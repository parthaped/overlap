import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppSection } from "@/components/app/app-shell";
import { DraftsLibrary, type DraftLibraryItem } from "@/components/app/drafts-library";

export default async function DraftsPage() {
  const session = await getCurrentSession();
  if (!session?.user?.id) redirect("/signin");

  const drafts = await prisma.draftSuggestion.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      generatedSubject: true,
      generatedBody: true,
      tone: true,
      approvedAt: true,
      sentAt: true,
      createdAt: true,
      threadId: true,
      thread: {
        select: { normalizedSubject: true },
      },
    },
  });

  const items: DraftLibraryItem[] = drafts.map((draft) => ({
    id: draft.id,
    generatedSubject: draft.generatedSubject,
    generatedBody: draft.generatedBody,
    tone: draft.tone,
    createdAt: draft.createdAt.toISOString(),
    threadId: draft.threadId,
    threadSubject: draft.thread.normalizedSubject,
    status: draft.sentAt ? "Sent" : draft.approvedAt ? "Approved" : "Generated",
  }));

  return (
    <AppSection
      eyebrow="Library"
      title="Draft library"
      description="Review generated responses and reuse high-performing variations."
    >
      <DraftsLibrary drafts={items} />
    </AppSection>
  );
}
