"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, FileText, Send, Sparkles } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { draftReply, sendDraft } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";

export type DraftStatus = "Generated" | "Approved" | "Sent";

export type DraftLibraryItem = {
  id: string;
  generatedSubject: string;
  generatedBody: string;
  tone: string;
  createdAt: string;
  threadSubject: string;
  threadId: string;
  status: DraftStatus;
};

const ease = [0.22, 1, 0.36, 1] as const;
const FILTERS: Array<{ id: "all" | DraftStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "Generated", label: "Pending" },
  { id: "Approved", label: "Approved" },
  { id: "Sent", label: "Sent" },
];

export function DraftsLibrary({ drafts }: { drafts: DraftLibraryItem[] }) {
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<"all" | DraftStatus>("all");

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: drafts.length };
    for (const d of drafts) {
      map[d.status] = (map[d.status] ?? 0) + 1;
    }
    return map;
  }, [drafts]);

  const filtered = filter === "all" ? drafts : drafts.filter((d) => d.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const count = counts[f.id] ?? 0;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              {count > 0 ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] tabular-nums",
                    active ? "bg-background/20" : "bg-background",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/55 bg-muted/10 px-6 py-16 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
            <FileText className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          </span>
          <p className="max-w-sm text-sm text-muted-foreground">
            {filter === "all"
              ? "No drafts yet. Generate one from any thread or via the AI copilot."
              : `No drafts in ${filter.toLowerCase()}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((draft, index) => (
            <motion.article
              key={draft.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: reduceMotion ? 0 : index * 0.03, ease }}
              className="rounded-2xl border border-border/60 bg-card/60 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[15px] font-semibold text-foreground">
                    {draft.generatedSubject}
                  </h3>
                  <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                    Thread: {draft.threadSubject}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full bg-muted/60 px-2 py-0.5">{draft.tone}</span>
                  <span className="tabular-nums">{formatRelativeTime(draft.createdAt)}</span>
                  <StatusPill status={draft.status} />
                </div>
              </div>
              <p className="mt-3 line-clamp-5 text-[13.5px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {draft.generatedBody}
              </p>
              <DraftActions draft={draft} />
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: DraftStatus }) {
  const styles: Record<DraftStatus, string> = {
    Generated: "bg-amber-100/60 text-amber-900 ring-amber-200/40",
    Approved: "bg-blue-100/60 text-blue-900 ring-blue-200/40",
    Sent: "bg-emerald-100/60 text-emerald-900 ring-emerald-200/40",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
        styles[status],
      )}
    >
      {status}
    </span>
  );
}

function DraftActions({ draft }: { draft: DraftLibraryItem }) {
  const [pending, startTransition] = useTransition();

  function handleReroll() {
    startTransition(async () => {
      const r = await draftReply({ threadId: draft.threadId, tone: draft.tone });
      if (r.ok) toast.success("New draft generated");
      else toast.error(r.error);
    });
  }

  function handleSend() {
    startTransition(async () => {
      const r = await sendDraft({ draftId: draft.id });
      if (r.ok) toast.success("Marked as sent");
      else toast.error(r.error);
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center justify-end gap-1.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReroll}
        disabled={pending}
        className="h-8 gap-1.5 px-2.5 text-xs"
      >
        <Sparkles className="h-3 w-3" strokeWidth={1.5} />
        Re-roll
      </Button>
      {draft.status !== "Sent" ? (
        <Button
          variant="primary"
          size="sm"
          onClick={handleSend}
          disabled={pending}
          className="h-8 gap-1.5 px-2.5 text-xs"
        >
          <Send className="h-3 w-3" strokeWidth={1.5} />
          {pending ? "Sending…" : "Send"}
        </Button>
      ) : (
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
          <CheckCircle2 className="h-3 w-3" strokeWidth={1.5} />
          Sent
        </span>
      )}
    </div>
  );
}
