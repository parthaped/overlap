import { redirect } from "next/navigation";

import { dailyBrief } from "@/actions/ai";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deriveSenderFromMessage } from "@/services/thread-analysis";

import { InboxShell } from "@/components/app/inbox/inbox-shell";
import type {
  BucketCounts,
  InboxAccount,
  InboxMessage,
  InboxThread,
  ThreadDetail,
} from "@/components/app/inbox/types";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const userId = session.user.id;

  const [accounts, threads, grouped, briefRes] = await Promise.all([
    prisma.linkedEmailAccount.findMany({
      where: { userId, deletedAt: null },
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
      where: { userId, deletedAt: null, isArchived: false },
      orderBy: [{ aiPriorityScore: "desc" }, { lastMessageAt: "desc" }],
      take: 200,
      select: {
        id: true,
        normalizedSubject: true,
        lastMessageAt: true,
        needsReply: true,
        waitingOnOther: true,
        aiSummary: true,
        aiPriorityScore: true,
        focusBucket: true,
        category: true,
        snoozeUntil: true,
        isUnread: true,
        isStarred: true,
        aiReasoningJson: true,
        messages: {
          where: { deletedAt: null },
          orderBy: [{ receivedAt: "desc" }, { sentAt: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: {
            snippet: true,
            bodyText: true,
            fromJson: true,
            senderEmail: true,
            senderDomain: true,
            linkedAccount: {
              select: {
                id: true,
                displayName: true,
                providerType: true,
                colorTag: true,
              },
            },
          },
        },
      },
    }),
    prisma.messageThread.groupBy({
      by: ["focusBucket"],
      where: { userId, deletedAt: null, isArchived: false },
      _count: { _all: true },
    }),
    dailyBrief(),
  ]);

  const accountRows: InboxAccount[] = accounts.map((a) => ({
    id: a.id,
    providerType: a.providerType,
    providerAccountEmail: a.providerAccountEmail,
    displayName: a.displayName,
    colorTag: a.colorTag,
    isPrimary: a.isPrimary,
    syncStatus: a.syncStatus,
  }));

  const threadRows: InboxThread[] = threads.map((t) => {
    const latest = t.messages[0];
    const sender = latest?.fromJson
      ? deriveSenderFromMessage({ fromJson: latest.fromJson })
      : { email: null, domain: null, name: null };
    const reasoning = (t.aiReasoningJson as
      | { reasons?: string[]; chips?: string[]; actionItems?: string[] }
      | null) ?? {};
    return {
      id: t.id,
      subject: t.normalizedSubject,
      summary: t.aiSummary,
      preview: latest?.snippet ?? latest?.bodyText?.slice(0, 160) ?? "—",
      lastMessageAt: t.lastMessageAt.toISOString(),
      focusBucket: t.focusBucket,
      category: t.category,
      needsReply: t.needsReply,
      waitingOnOther: t.waitingOnOther,
      isUnread: t.isUnread,
      isStarred: t.isStarred,
      snoozeUntil: t.snoozeUntil?.toISOString() ?? null,
      aiPriorityScore: t.aiPriorityScore,
      chips: reasoning.chips ?? [],
      reasons: reasoning.reasons ?? [],
      actionItems: reasoning.actionItems ?? [],
      accountId: latest?.linkedAccount.id ?? "unknown",
      accountLabel:
        latest?.linkedAccount.displayName ?? latest?.linkedAccount.providerType ?? "Unknown",
      accountColor: latest?.linkedAccount.colorTag ?? "#6c7a89",
      senderName: sender.name,
      senderEmail: latest?.senderEmail ?? sender.email,
      senderDomain: latest?.senderDomain ?? sender.domain,
    };
  });

  const counts: BucketCounts = { ALL: threadRows.length };
  for (const row of grouped) {
    const key = row.focusBucket as keyof BucketCounts;
    counts[key] = row._count._all;
  }
  counts.STARRED = threadRows.filter((t) => t.isStarred).length;
  counts.SNOOZED = threadRows.filter(
    (t) => t.snoozeUntil && new Date(t.snoozeUntil) > new Date(),
  ).length;

  // Hydrate detail for the first ~12 highest priority threads so the reader
  // pane can switch instantly.
  const detailIds = threadRows.slice(0, 12).map((t) => t.id);
  const fullMessages = detailIds.length
    ? await prisma.messageThread.findMany({
        where: { id: { in: detailIds }, userId },
        select: {
          id: true,
          messages: {
            where: { deletedAt: null },
            orderBy: [{ receivedAt: "asc" }, { sentAt: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              subject: true,
              bodyHtml: true,
              bodyText: true,
              direction: true,
              receivedAt: true,
              sentAt: true,
              fromJson: true,
              toJson: true,
            },
          },
        },
      })
    : [];

  const messagesByThread = new Map<string, InboxMessage[]>();
  for (const t of fullMessages) {
    messagesByThread.set(
      t.id,
      t.messages.map((m) => {
        const sender = deriveSenderFromMessage({ fromJson: m.fromJson });
        return {
          id: m.id,
          subject: m.subject,
          bodyHtml: m.bodyHtml,
          bodyText: m.bodyText,
          direction: m.direction,
          receivedAt: m.receivedAt?.toISOString() ?? null,
          sentAt: m.sentAt?.toISOString() ?? null,
          fromName: sender.name,
          fromEmail: sender.email,
          toJson: m.toJson,
        };
      }),
    );
  }

  const threadDetails: Record<string, ThreadDetail> = {};
  for (const t of threadRows.slice(0, 12)) {
    threadDetails[t.id] = {
      id: t.id,
      subject: t.subject,
      summary: t.summary,
      reasons: t.reasons,
      actionItems: t.actionItems,
      chips: t.chips,
      category: t.category,
      focusBucket: t.focusBucket,
      aiPriorityScore: t.aiPriorityScore,
      messages: messagesByThread.get(t.id) ?? [],
    };
  }

  const brief = briefRes.ok
    ? { oneLiner: briefRes.data.oneLiner, priorities: briefRes.data.priorities }
    : { oneLiner: "Inbox loaded.", priorities: [] };

  return (
    <InboxShell
      userName={session.user.name ?? "Member"}
      preferredTone={session.user.preferredTone ?? "Professional but warm"}
      accounts={accountRows}
      threads={threadRows}
      threadDetails={threadDetails}
      brief={brief}
      counts={counts}
    />
  );
}
