import type { FocusBucket } from "@prisma/client";

import { formatRelativeTime, scoreToLabel } from "@/lib/utils";

export type ThreadListItem = {
  id: string;
  normalizedSubject: string;
  lastMessageAt: Date;
  needsReply: boolean;
  waitingOnOther: boolean;
  aiSummary: string | null;
  aiPriorityScore: number;
  focusBucket: FocusBucket;
};

type ThreadListProps = {
  threads: ThreadListItem[];
};

const bucketLabel: Record<FocusBucket, string> = {
  FOCUS: "Focus",
  OTHER: "Other",
  NEEDS_REPLY: "Needs reply",
  WAITING_ON: "Waiting on",
  SCHEDULED: "Scheduled",
  SENT: "Sent",
  DRAFTS: "Drafts",
  TRASH: "Trash",
};

export function ThreadList({ threads }: ThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-border/70 bg-card/40 px-8 py-16 text-center">
        <p className="font-medium text-foreground">No threads yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect an account or send a message to see your unified inbox here.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {threads.map((thread, index) => (
        <li
          key={thread.id}
          className="group rounded-[1.35rem] border border-border/60 bg-card/80 p-6 shadow-card transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-border hover:shadow-soft"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-muted/80 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  {bucketLabel[thread.focusBucket]}
                </span>
                {thread.needsReply ? (
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-[0.7rem] font-semibold text-primary">
                    Needs reply
                  </span>
                ) : null}
                {thread.waitingOnOther ? (
                  <span className="rounded-full bg-secondary px-3 py-1 text-[0.7rem] font-semibold text-secondary-foreground">
                    Waiting on them
                  </span>
                ) : null}
              </div>
              <h2 className="font-serif text-xl tracking-tight text-foreground">{thread.normalizedSubject}</h2>
              {thread.aiSummary ? (
                <p className="max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">{thread.aiSummary}</p>
              ) : null}
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{formatRelativeTime(thread.lastMessageAt)}</p>
              <p className="mt-1 text-xs text-muted-foreground/90">
                Priority · {scoreToLabel(thread.aiPriorityScore)} ({Math.round(thread.aiPriorityScore)})
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
