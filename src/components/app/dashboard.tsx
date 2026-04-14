"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BarChart3, Clock3, Inbox, Mail, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime, scoreToLabel } from "@/lib/utils";

export type DashboardAccount = {
  id: string;
  providerType: string;
  providerAccountEmail: string;
  displayName: string;
  colorTag: string;
  isPrimary: boolean;
  syncStatus: string;
};

export type DashboardThread = {
  id: string;
  subject: string;
  summary: string | null;
  lastMessageAt: string;
  focusBucket: string;
  needsReply: boolean;
  waitingOnOther: boolean;
  aiPriorityScore: number;
  accountId: string;
  accountLabel: string;
  preview: string;
};

export type DashboardDraft = {
  id: string;
  threadSubject: string;
  tone: string;
  generatedSubject: string;
  generatedBody: string;
  createdAt: string;
  approvedAt: string | null;
};

type DashboardProps = {
  userName: string;
  accounts: DashboardAccount[];
  threads: DashboardThread[];
  drafts: DashboardDraft[];
};

const buckets = [
  { id: "all", label: "All" },
  { id: "FOCUS", label: "Focus" },
  { id: "NEEDS_REPLY", label: "Needs reply" },
  { id: "WAITING_ON", label: "Waiting on" },
];

const panelClass =
  "relative overflow-hidden rounded-[1.85rem] border border-border/50 bg-card/88 shadow-soft ring-1 ring-border/30 backdrop-blur-[2px]";

const ease = [0.22, 1, 0.36, 1] as const;

export function Dashboard({ userName, accounts, threads, drafts }: DashboardProps) {
  const reduceMotion = useReducedMotion();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [selectedBucket, setSelectedBucket] = useState<string>("all");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(threads[0]?.id ?? null);

  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      const byAccount = selectedAccountId === "all" || thread.accountId === selectedAccountId;
      const byBucket = selectedBucket === "all" || thread.focusBucket === selectedBucket;
      return byAccount && byBucket;
    });
  }, [threads, selectedAccountId, selectedBucket]);

  const selectedThread =
    filteredThreads.find((thread) => thread.id === selectedThreadId) ?? filteredThreads[0] ?? null;

  const stats = useMemo(() => {
    const total = threads.length;
    const needsReply = threads.filter((thread) => thread.needsReply).length;
    const highPriority = threads.filter((thread) => thread.aiPriorityScore >= 80).length;
    const waiting = threads.filter((thread) => thread.waitingOnOther).length;
    return { total, needsReply, highPriority, waiting };
  }, [threads]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease }}
      className="space-y-8"
    >
      <div className={cn(panelClass, "p-6 sm:p-8")}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/28 to-transparent" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Unified workspace
            </p>
            <h1 className="mt-3 font-serif text-3xl tracking-tight text-foreground sm:text-[2.35rem]">
              Welcome back, {userName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Everything important across providers in one calm surface. Prioritize, reply, and move
              through your day without context switching.
            </p>
          </div>
          <Button variant="secondary" className="gap-2 shadow-card ring-1 ring-border/40 transition-all duration-300 hover:-translate-y-0.5">
            <Sparkles className="h-4 w-4" strokeWidth={1.5} />
            New AI draft
          </Button>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Threads" value={stats.total} icon={Inbox} reduceMotion={!!reduceMotion} />
          <StatCard label="Need reply" value={stats.needsReply} icon={Mail} reduceMotion={!!reduceMotion} />
          <StatCard label="High priority" value={stats.highPriority} icon={BarChart3} reduceMotion={!!reduceMotion} />
          <StatCard label="Waiting on others" value={stats.waiting} icon={Clock3} reduceMotion={!!reduceMotion} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,340px)]">
        <aside className={cn(panelClass, "space-y-5 p-5")}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Accounts
          </h2>
          <button
            type="button"
            onClick={() => setSelectedAccountId("all")}
            className={cn(
              "relative w-full overflow-hidden rounded-2xl border px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-300",
              selectedAccountId === "all"
                ? "border-primary/30 bg-primary/[0.06] shadow-card"
                : "border-transparent bg-muted/35 hover:bg-muted/55",
            )}
          >
            All providers
          </button>
          <div className="space-y-2">
            {accounts.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => setSelectedAccountId(account.id)}
                className={cn(
                  "relative w-full overflow-hidden rounded-2xl border px-3.5 py-3 text-left transition-all duration-300",
                  selectedAccountId === account.id
                    ? "border-primary/30 bg-primary/[0.06] shadow-card"
                    : "border-transparent bg-muted/35 hover:bg-muted/55",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background"
                    style={{ backgroundColor: account.colorTag || "#5bbabd" }}
                  />
                  <p className="text-sm font-medium text-foreground">{account.displayName}</p>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{account.providerAccountEmail}</p>
              </button>
            ))}
          </div>

          <h2 className="pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Buckets
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {buckets.map((bucket) => (
              <button
                key={bucket.id}
                type="button"
                onClick={() => setSelectedBucket(bucket.id)}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs font-medium transition-all duration-300",
                  selectedBucket === bucket.id
                    ? "bg-foreground text-background shadow-card"
                    : "bg-muted/45 text-muted-foreground hover:text-foreground",
                )}
              >
                {bucket.label}
              </button>
            ))}
          </div>
        </aside>

        <div className={cn(panelClass, "flex flex-col p-5")}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Threads
            </h2>
            <p className="text-xs tabular-nums text-muted-foreground">{filteredThreads.length} visible</p>
          </div>

          {filteredThreads.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/15 p-10 text-center text-sm text-muted-foreground">
              No threads match this filter yet.
            </div>
          ) : (
            <ul className="space-y-2.5">
              <AnimatePresence initial={false} mode="popLayout">
                {filteredThreads.map((thread) => (
                  <motion.li
                    key={thread.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.32, ease }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={cn(
                        "relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 text-left transition-all duration-300",
                        selectedThread?.id === thread.id
                          ? "border-primary/35 bg-primary/[0.07] shadow-card"
                          : "border-transparent bg-muted/30 hover:border-border/50 hover:bg-muted/45",
                      )}
                    >
                      {selectedThread?.id === thread.id ? (
                        <motion.span
                          layoutId="dashboard-thread-ring"
                          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-primary/22"
                          transition={{ type: "spring", stiffness: 400, damping: 34 }}
                        />
                      ) : null}
                      <div className="relative flex items-start justify-between gap-3">
                        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{thread.subject}</h3>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatRelativeTime(thread.lastMessageAt)}
                        </span>
                      </div>
                      <p className="relative mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {thread.preview}
                      </p>
                      <div className="relative mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="rounded-full bg-muted/80 px-2 py-0.5 font-medium">
                          {thread.accountLabel}
                        </span>
                        <span>Priority {scoreToLabel(thread.aiPriorityScore)}</span>
                      </div>
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        <div className={cn(panelClass, "space-y-5 p-5")}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Thread workspace
          </h2>

          {selectedThread ? (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl border border-border/45 bg-gradient-to-br from-muted/40 to-muted/15 p-5">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
                <h3 className="font-serif text-xl tracking-tight text-foreground">{selectedThread.subject}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {selectedThread.summary || selectedThread.preview}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-background/80 px-2.5 py-1 font-medium ring-1 ring-border/40">
                    {selectedThread.accountLabel}
                  </span>
                  <span>{selectedThread.focusBucket.replaceAll("_", " ")}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 bg-background/75 p-4 ring-1 ring-border/25">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Quick actions
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="secondary" size="sm" className="gap-2 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} /> Generate reply
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Send className="h-3.5 w-3.5" strokeWidth={1.5} /> Send now
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/15 p-8 text-center text-sm text-muted-foreground">
              Select a thread to see details and actions.
            </div>
          )}

          <div className="space-y-3 border-t border-border/40 pt-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Recent drafts
            </h3>
            {drafts.length === 0 ? (
              <p className="rounded-2xl bg-muted/20 p-4 text-xs leading-relaxed text-muted-foreground">
                No drafts generated yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {drafts.map((draft, i) => (
                  <motion.div
                    key={draft.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: reduceMotion ? 0 : i * 0.04, ease }}
                    className="rounded-2xl border border-border/40 bg-muted/20 p-3.5 transition-colors duration-300 hover:border-border/60 hover:bg-muted/30"
                  >
                    <p className="text-sm font-medium text-foreground">{draft.generatedSubject}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {draft.generatedBody}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded-full bg-background/70 px-2 py-0.5 ring-1 ring-border/35">
                        {draft.tone}
                      </span>
                      <span>{formatRelativeTime(draft.createdAt)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  reduceMotion,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -3 }}
      transition={{ duration: 0.25, ease }}
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/80 p-4 ring-1 ring-border/25"
    >
      {!reduceMotion ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(135deg, rgba(91,187,189,0.1) 0%, transparent 45%, rgba(246,141,79,0.06) 100%)",
          }}
        />
      ) : null}
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground/80" strokeWidth={1.5} />
      </div>
      <p className="relative mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
    </motion.div>
  );
}
