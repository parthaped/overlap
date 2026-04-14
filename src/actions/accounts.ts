"use server";

/**
 * Account linking uses the form + demo seed path. Real OAuth is not connected.
 * When implementing Google / Microsoft, use env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
 * MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID (see `.env.example`).
 */

import { FocusBucket, MessageDirection, ProviderType, SyncStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { connectAccountSchema } from "@/lib/validators";
import { getDemoThreads } from "@/services/demo-data";

const accountFormSchema = connectAccountSchema.extend({
  makePrimary: z.boolean().default(true),
});

export type AccountActionState = {
  error?: string;
  success?: string;
};

export async function connectAccount(
  _prevState: AccountActionState | undefined,
  formData: FormData,
): Promise<AccountActionState> {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const parsed = accountFormSchema.safeParse({
    provider: formData.get("provider"),
    mode: formData.get("mode") ?? "demo",
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    makePrimary: formData.get("makePrimary") === "on",
  });

  if (!parsed.success) {
    return { error: "Please provide valid account details." };
  }

  const provider = parsed.data.provider as ProviderType;
  const email = parsed.data.email.toLowerCase();
  const colorByProvider: Record<ProviderType, string> = {
    GOOGLE: "#5bbabd",
    MICROSOFT: "#f68d4f",
    ICLOUD: "#8e8e93",
    IMAP: "#6c7a89",
    SMTP: "#a26df5",
    DEMO: "#5bbabd",
  };

  try {
    const account = await prisma.linkedEmailAccount.upsert({
      where: {
        providerType_providerAccountEmail: {
          providerType: provider,
          providerAccountEmail: email,
        },
      },
      update: {
        userId: session.user.id,
        displayName: parsed.data.displayName,
        deletedAt: null,
        syncStatus: SyncStatus.ACTIVE,
        colorTag: colorByProvider[provider],
      },
      create: {
        userId: session.user.id,
        providerType: provider,
        providerAccountEmail: email,
        displayName: parsed.data.displayName,
        syncStatus: SyncStatus.ACTIVE,
        colorTag: colorByProvider[provider],
        isPrimary: false,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { primaryAccountId: true },
    });

    if (parsed.data.makePrimary || !user?.primaryAccountId) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { primaryAccountId: account.id },
      });
      await prisma.linkedEmailAccount.updateMany({
        where: { userId: session.user.id, id: { not: account.id } },
        data: { isPrimary: false },
      });
      await prisma.linkedEmailAccount.update({
        where: { id: account.id },
        data: { isPrimary: true },
      });
    }

    if (parsed.data.mode === "demo") {
      await hydrateDemoThreads(session.user.id, account.id, provider);
    }

    revalidatePath("/inbox");
    revalidatePath("/inbox/accounts");
    return { success: "Account connected." };
  } catch (error) {
    console.error("connectAccount failed", error);
    return { error: "Could not connect account. Please try again." };
  }
}

export async function setPrimaryAccount(formData: FormData) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return;
  }

  const accountId = String(formData.get("accountId") ?? "");
  if (!accountId) return;

  await prisma.linkedEmailAccount.updateMany({
    where: { userId: session.user.id },
    data: { isPrimary: false },
  });
  await prisma.linkedEmailAccount.update({
    where: { id: accountId },
    data: { isPrimary: true },
  });
  await prisma.user.update({
    where: { id: session.user.id },
    data: { primaryAccountId: accountId },
  });

  revalidatePath("/inbox");
  revalidatePath("/inbox/accounts");
}

export async function disconnectAccount(formData: FormData) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return;
  }

  const accountId = String(formData.get("accountId") ?? "");
  if (!accountId) return;

  await prisma.linkedEmailAccount.update({
    where: { id: accountId },
    data: { deletedAt: new Date(), isPrimary: false, syncStatus: SyncStatus.PAUSED },
  });

  const nextPrimary = await prisma.linkedEmailAccount.findFirst({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { lastSyncedAt: "desc" },
    select: { id: true },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { primaryAccountId: nextPrimary?.id ?? null },
  });
  if (nextPrimary?.id) {
    await prisma.linkedEmailAccount.update({
      where: { id: nextPrimary.id },
      data: { isPrimary: true },
    });
  }

  revalidatePath("/inbox");
  revalidatePath("/inbox/accounts");
}

async function hydrateDemoThreads(userId: string, accountId: string, provider: ProviderType) {
  const threads = getDemoThreads(provider);

  for (const [index, demoThread] of threads.entries()) {
    let thread = await prisma.messageThread.findFirst({
      where: {
        userId,
        normalizedSubject: demoThread.normalizedSubject,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!thread) {
      thread = await prisma.messageThread.create({
        data: {
          userId,
          normalizedSubject: demoThread.normalizedSubject,
          lastMessageAt: new Date(),
          needsReply: demoThread.bucket === "NEEDS_REPLY" || demoThread.bucket === "FOCUS",
          waitingOnOther: demoThread.bucket === "WAITING_ON",
          aiSummary: demoThread.summary,
          aiPriorityScore: demoThread.score,
          focusBucket: demoThread.bucket as FocusBucket,
        },
        select: { id: true },
      });
    }

    const firstMessage = demoThread.messages[0];
    const date =
      firstMessage?.receivedAt ?? firstMessage?.sentAt ?? new Date(Date.now() - index * 1000).toISOString();

    await prisma.messageThread.update({
      where: { id: thread.id },
      data: {
        aiSummary: demoThread.summary,
        aiPriorityScore: demoThread.score,
        focusBucket: demoThread.bucket as FocusBucket,
        lastMessageAt: new Date(date),
        needsReply: demoThread.bucket === "NEEDS_REPLY" || demoThread.bucket === "FOCUS",
        waitingOnOther: demoThread.bucket === "WAITING_ON",
      },
    });

    for (const message of demoThread.messages) {
      await prisma.emailMessage.upsert({
        where: {
          linkedAccountId_providerMessageId: {
            linkedAccountId: accountId,
            providerMessageId: message.id,
          },
        },
        update: {
          snippet: message.snippet,
          bodyText: message.body,
          subject: demoThread.subject,
          direction: message.direction as MessageDirection,
          needsReply: message.needsReply ?? false,
        },
        create: {
          threadId: thread.id,
          linkedAccountId: accountId,
          providerMessageId: message.id,
          providerThreadId: `${provider.toLowerCase()}-${thread.id}`,
          fromJson: message.from,
          toJson: message.to,
          subject: demoThread.subject,
          snippet: message.snippet,
          bodyText: message.body,
          direction: message.direction as MessageDirection,
          receivedAt: message.receivedAt ? new Date(message.receivedAt) : undefined,
          sentAt: message.sentAt ? new Date(message.sentAt) : undefined,
          isRead: message.isRead ?? false,
          needsReply: message.needsReply ?? false,
          rawFolderLabelsJson: demoThread.labels,
          aiPriorityScore: demoThread.score,
        },
      });
    }
  }
}
