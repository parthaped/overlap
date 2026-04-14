import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

import { AppSection } from "@/components/app/app-shell";
import { ThreadList, type ThreadListItem } from "@/components/app/thread-list";

export default async function InboxPage() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const threads = await prisma.messageThread.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    select: {
      id: true,
      normalizedSubject: true,
      lastMessageAt: true,
      needsReply: true,
      waitingOnOther: true,
      aiSummary: true,
      aiPriorityScore: true,
      focusBucket: true,
    },
  });

  const items: ThreadListItem[] = threads.map((thread) => ({
    id: thread.id,
    normalizedSubject: thread.normalizedSubject,
    lastMessageAt: thread.lastMessageAt,
    needsReply: thread.needsReply,
    waitingOnOther: thread.waitingOnOther,
    aiSummary: thread.aiSummary,
    aiPriorityScore: thread.aiPriorityScore,
    focusBucket: thread.focusBucket,
  }));

  return (
    <AppSection
      title="Inbox"
      description="Threads from your connected accounts, ordered by recency. This view reflects what is stored for your workspace."
    >
      <ThreadList threads={items} />
    </AppSection>
  );
}
