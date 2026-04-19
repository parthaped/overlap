"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArchiveX, Mail, Sparkles, Sun } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { bulkTriage } from "@/actions/ai";
import { askInboxAi } from "@/actions/inbox-ai";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/ui-store";

import type { BucketCounts, DailyBrief as DailyBriefData } from "@/components/app/inbox/types";

type DailyBriefProps = {
  brief: DailyBriefData;
  counts: BucketCounts;
  userName: string;
  onSelectThread: (id: string) => void;
};

export function DailyBriefBanner({ brief, counts, userName, onSelectThread }: DailyBriefProps) {
  const reduceMotion = useReducedMotion();
  const setOverlapAiOpen = useUIStore((s) => s.setOverlapAiOpen);
  const setBucket = useUIStore((s) => s.setBucket);
  const [pending, startTransition] = useTransition();

  const promos = counts.PROMOTIONS ?? 0;
  const news = counts.NEWSLETTERS ?? 0;
  const needsReply = counts.NEEDS_REPLY ?? 0;
  const focus = counts.FOCUS ?? 0;
  const greeting = greet();

  function clearPromosAndNews() {
    startTransition(async () => {
      const [a, b] = await Promise.all([
        bulkTriage({ bucket: "PROMOTIONS", action: "archive" }),
        bulkTriage({ bucket: "NEWSLETTERS", action: "archive" }),
      ]);
      const cleared = (a.ok ? a.data.count : 0) + (b.ok ? b.data.count : 0);
      if (cleared > 0) {
        toast.success(`Cleared ${cleared} low-priority threads.`);
      } else {
        toast.message("Nothing to clear right now.");
      }
    });
  }

  function askForBrief() {
    setOverlapAiOpen(true);
    toast.promise(askInboxAi({ question: "Give me a 60-second morning brief." }), {
      loading: "Drafting brief…",
      success: "Brief ready in Overlap AI.",
      error: "Couldn't reach Overlap AI.",
    });
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/[0.06] via-background to-accent/[0.05] px-4 py-4 sm:px-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Sun className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>{greeting}, {userName.split(" ")[0]}</span>
          </div>
          <p className="mt-1 text-[15px] leading-snug text-foreground sm:text-base">
            {brief.oneLiner}
          </p>
          {brief.priorities.length > 0 ? (
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {brief.priorities.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setBucket("FOCUS");
                      onSelectThread(p.id);
                    }}
                    className="group inline-flex max-w-[260px] items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[12px] text-foreground/85 transition-colors hover:border-foreground/30 hover:bg-background"
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground/85 text-[10px] font-semibold text-background">
                      {p.score}
                    </span>
                    <span className="truncate">{p.subject}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setBucket("NEEDS_REPLY")}
            disabled={needsReply === 0}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors",
              needsReply > 0
                ? "border-primary/40 bg-primary/10 text-foreground hover:bg-primary/15"
                : "border-border/50 bg-background/50 text-muted-foreground/70",
            )}
          >
            <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
            {needsReply} need a reply
          </button>
          <button
            type="button"
            onClick={() => setBucket("FOCUS")}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[12px] text-foreground/85 transition-colors hover:bg-background"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
            {focus} focus
          </button>
          {promos + news > 0 ? (
            <button
              type="button"
              onClick={clearPromosAndNews}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[12px] text-foreground/85 transition-colors hover:bg-background disabled:opacity-60"
            >
              <ArchiveX className="h-3.5 w-3.5" strokeWidth={1.5} />
              {pending ? "Clearing…" : `Clear ${promos + news} promos / news`}
            </button>
          ) : null}
          <button
            type="button"
            onClick={askForBrief}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-1 text-[12px] text-background shadow-sm transition-all hover:-translate-y-px hover:shadow-card"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
            Brief me
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function greet() {
  const hour = new Date().getHours();
  if (hour < 5) return "Late night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}
