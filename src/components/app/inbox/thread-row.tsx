"use client";

import { Archive, Clock, Sparkles, Star } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { archiveThread, draftReply, snoozeThread, toggleStar } from "@/actions/ai";
import { cn, formatRelativeTime, initials } from "@/lib/utils";

import type { InboxThread } from "@/components/app/inbox/types";

type ThreadRowProps = {
  thread: InboxThread;
  active: boolean;
  onSelect: (id: string) => void;
};

const CHIP_STYLES: Record<string, string> = {
  VIP: "bg-amber-100/80 text-amber-900 ring-amber-200/50",
  Deadline: "bg-red-100/80 text-red-900 ring-red-200/40",
  Meeting: "bg-blue-100/80 text-blue-900 ring-blue-200/40",
  Finance: "bg-emerald-100/80 text-emerald-900 ring-emerald-200/40",
  Promotional: "bg-pink-100/70 text-pink-900 ring-pink-200/40",
  Newsletter: "bg-violet-100/70 text-violet-900 ring-violet-200/40",
  Social: "bg-sky-100/70 text-sky-900 ring-sky-200/40",
  Update: "bg-slate-200/70 text-slate-800 ring-slate-300/40",
  "High-stakes": "bg-orange-100/80 text-orange-900 ring-orange-200/40",
  "Muted sender": "bg-zinc-200/70 text-zinc-700 ring-zinc-300/40",
  Automated: "bg-zinc-200/70 text-zinc-700 ring-zinc-300/40",
};

export function ThreadRow({ thread, active, onSelect }: ThreadRowProps) {
  const [pending, startTransition] = useTransition();

  function withStop(fn: () => Promise<unknown>) {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      startTransition(async () => {
        await fn();
      });
    };
  }

  const senderLabel = thread.senderName ?? thread.senderEmail ?? thread.accountLabel;

  return (
    <button
      type="button"
      data-testid="thread-row"
      data-thread-id={thread.id}
      onClick={() => onSelect(thread.id)}
      className={cn(
        "group relative flex w-full items-start gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors",
        active
          ? "bg-primary/[0.06] hover:bg-primary/[0.08]"
          : "hover:bg-muted/35",
        thread.isUnread && !active ? "bg-background" : "",
      )}
    >
      {active ? (
        <span className="absolute inset-y-2 left-0 w-0.5 rounded-r bg-foreground" />
      ) : null}

      <span
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-foreground"
        style={{
          backgroundColor: thread.accountColor ? `${thread.accountColor}1f` : undefined,
        }}
        aria-hidden
      >
        {initials(thread.senderName ?? thread.accountLabel)}
        {thread.isUnread ? (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        ) : null}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p
            className={cn(
              "truncate text-[13.5px] leading-tight",
              thread.isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/90",
            )}
          >
            {senderLabel}
          </p>
          <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {formatRelativeTime(thread.lastMessageAt)}
          </span>
        </div>
        <p
          className={cn(
            "mt-0.5 truncate text-[13px] leading-tight",
            thread.isUnread ? "text-foreground" : "text-foreground/85",
          )}
        >
          {thread.subject}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[12px] leading-snug text-muted-foreground">
          {thread.preview}
        </p>

        {(thread.chips.length > 0 || thread.snoozeUntil) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {thread.snoozeUntil ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/70 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 ring-1 ring-amber-200/40">
                <Clock className="h-2.5 w-2.5" strokeWidth={2} />
                Snoozed
              </span>
            ) : null}
            {thread.chips.slice(0, 3).map((chip) => (
              <span
                key={chip}
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1",
                  CHIP_STYLES[chip] ?? "bg-muted/60 text-foreground/80 ring-border/40",
                )}
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex flex-col gap-1">
          <span
            role="button"
            tabIndex={0}
            onClick={withStop(async () => {
              const r = await toggleStar({ threadId: thread.id });
              if (!r.ok) toast.error(r.error);
            })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation();
                startTransition(async () => {
                  await toggleStar({ threadId: thread.id });
                });
              }
            }}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            aria-label="Star"
          >
            <Star
              className={cn("h-3.5 w-3.5", thread.isStarred && "fill-amber-400 text-amber-500")}
              strokeWidth={1.5}
            />
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={withStop(async () => {
              const r = await archiveThread({ threadId: thread.id });
              if (r.ok) toast.success("Archived");
              else toast.error(r.error);
            })}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            aria-label="Archive"
          >
            <Archive className="h-3.5 w-3.5" strokeWidth={1.5} />
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={withStop(async () => {
              const r = await snoozeThread({ threadId: thread.id, hours: 4 });
              if (r.ok) toast.success("Snoozed for 4 hours");
              else toast.error(r.error);
            })}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            aria-label="Snooze"
          >
            <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={withStop(async () => {
              const r = await draftReply({ threadId: thread.id });
              if (r.ok) toast.success("Draft ready");
              else toast.error(r.error);
            })}
            className={cn(
              "rounded-md p-1 text-primary hover:bg-primary/10",
              pending && "opacity-50",
            )}
            aria-label="AI draft"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
          </span>
        </div>
      </div>
    </button>
  );
}
