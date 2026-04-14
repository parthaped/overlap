"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FileText } from "lucide-react";

import { cn, formatRelativeTime } from "@/lib/utils";

export type DraftLibraryItem = {
  id: string;
  generatedSubject: string;
  generatedBody: string;
  tone: string;
  createdAt: string;
  threadSubject: string;
  status: string;
};

const panelClass =
  "relative overflow-hidden rounded-[1.85rem] border border-border/50 bg-card/88 shadow-soft ring-1 ring-border/30 backdrop-blur-[2px]";

const ease = [0.22, 1, 0.36, 1] as const;

export function DraftsLibrary({ drafts }: { drafts: DraftLibraryItem[] }) {
  const reduceMotion = useReducedMotion();

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[1.85rem] border border-dashed border-border/55 bg-muted/12 px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 ring-1 ring-border/40">
          <FileText className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} aria-hidden />
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          No drafts yet. Use <span className="font-medium text-foreground">Generate reply</span> from the
          dashboard when you&apos;re ready.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {drafts.map((draft, index) => (
        <motion.article
          key={draft.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: reduceMotion ? 0 : index * 0.05, ease }}
          className={cn(panelClass, "p-5 sm:p-6")}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/22 to-transparent" />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="font-medium leading-snug text-foreground sm:max-w-[70%]">{draft.generatedSubject}</h2>
            <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted/60 px-2.5 py-1 font-medium ring-1 ring-border/35">
                {draft.tone}
              </span>
              <span className="tabular-nums">{formatRelativeTime(draft.createdAt)}</span>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Thread: <span className="text-foreground/85">{draft.threadSubject}</span>
          </p>
          <p className="mt-4 line-clamp-5 text-sm leading-relaxed text-foreground/90">{draft.generatedBody}</p>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Status · {draft.status}
          </p>
        </motion.article>
      ))}
    </div>
  );
}
