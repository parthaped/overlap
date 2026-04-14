import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatRelativeTime } from "@/lib/utils";
import { AppSection } from "@/components/app/app-shell";

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
      thread: {
        select: { normalizedSubject: true },
      },
    },
  });

  return (
    <AppSection
      title="Draft library"
      description="Review generated responses and reuse high-performing variations."
    >
      <div className="space-y-3">
        {drafts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
            No drafts yet. Use “Generate reply” from the dashboard.
          </p>
        ) : (
          drafts.map((draft) => (
            <article key={draft.id} className="rounded-xl border border-border/60 bg-card/70 p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-medium text-foreground">{draft.generatedSubject}</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-1">{draft.tone}</span>
                  <span>{formatRelativeTime(draft.createdAt)}</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Thread: {draft.thread.normalizedSubject}
              </p>
              <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-foreground/90">
                {draft.generatedBody}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Status:{" "}
                {draft.sentAt
                  ? "Sent"
                  : draft.approvedAt
                    ? "Approved"
                    : "Generated"}
              </p>
            </article>
          ))
        )}
      </div>
    </AppSection>
  );
}
