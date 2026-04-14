import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

import { Dashboard } from "@/components/app/dashboard";

export default async function InboxPage() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const [accounts, threads, drafts] = await Promise.all([
    prisma.linkedEmailAccount.findMany({
      where: { userId: session.user.id, deletedAt: null },
      orderBy: [{ isPrimary: "desc" }, { providerAccountEmail: "asc" }],
      select: {
        id: true,
        providerType: true,
        providerAccountEmail: true,
        displayName: true,
        colorTag: true,
        isPrimary: true,
        syncStatus: true,
      },
    }),
    prisma.messageThread.findMany({
      where: { userId: session.user.id, deletedAt: null },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      select: {
        id: true,
        normalizedSubject: true,
        lastMessageAt: true,
        needsReply: true,
        waitingOnOther: true,
        aiSummary: true,
        aiPriorityScore: true,
        focusBucket: true,
        messages: {
          where: { deletedAt: null },
          orderBy: [{ receivedAt: "desc" }, { sentAt: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: {
            snippet: true,
            bodyText: true,
            linkedAccount: {
              select: {
                id: true,
                displayName: true,
                providerType: true,
              },
            },
          },
        },
      },
    }),
    prisma.draftSuggestion.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        tone: true,
        generatedSubject: true,
        generatedBody: true,
        createdAt: true,
        approvedAt: true,
        thread: {
          select: {
            normalizedSubject: true,
          },
        },
      },
    }),
  ]);

  const accountRows = accounts.map((account) => ({
    ...account,
    providerType: account.providerType,
    syncStatus: account.syncStatus,
  }));

  const threadRows = threads.map((thread) => {
    const latest = thread.messages[0];
    return {
      id: thread.id,
      subject: thread.normalizedSubject,
      summary: thread.aiSummary,
      lastMessageAt: thread.lastMessageAt.toISOString(),
      focusBucket: thread.focusBucket,
      needsReply: thread.needsReply,
      waitingOnOther: thread.waitingOnOther,
      aiPriorityScore: thread.aiPriorityScore,
      accountId: latest?.linkedAccount.id ?? "unknown",
      accountLabel: latest?.linkedAccount.displayName ?? latest?.linkedAccount.providerType ?? "Unknown",
      preview: latest?.snippet ?? latest?.bodyText?.slice(0, 140) ?? "No preview available.",
    };
  });

  const draftRows = drafts.map((draft) => ({
    id: draft.id,
    threadSubject: draft.thread.normalizedSubject,
    tone: draft.tone,
    generatedSubject: draft.generatedSubject,
    generatedBody: draft.generatedBody,
    createdAt: draft.createdAt.toISOString(),
    approvedAt: draft.approvedAt ? draft.approvedAt.toISOString() : null,
  }));

  return (
    <Dashboard
      userName={session.user.name ?? "Member"}
      accounts={accountRows}
      threads={threadRows}
      drafts={draftRows}
    />
  );
}
