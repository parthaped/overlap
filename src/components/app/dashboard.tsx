"use client";

import { AnimatePresence, motion } from "framer-motion";
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

export function Dashboard({ userName, accounts, threads, drafts }: DashboardProps) {
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
    <section className="space-y-8">
      <div className="rounded-[1.75rem] border border-border/60 bg-card/70 p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Unified workspace
            </p>
            <h1 className="mt-2 font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
              Welcome back, {userName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Everything important across providers in one calm surface. Prioritize, reply, and
              move through your day without context switching.
            </p>
          </div>
          <Button variant="secondary" className="gap-2">
            <Sparkles className="h-4 w-4" />
            New AI Draft
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Threads" value={stats.total} icon={Inbox} />
          <StatCard label="Need reply" value={stats.needsReply} icon={Mail} />
          <StatCard label="High priority" value={stats.highPriority} icon={BarChart3} />
          <StatCard label="Waiting on others" value={stats.waiting} icon={Clock3} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_360px]">
        <aside className="space-y-4 rounded-[1.5rem] border border-border/60 bg-card/60 p-4 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Accounts
          </h2>
          <button
            type="button"
            onClick={() => setSelectedAccountId("all")}
            className={cn(
              "w-full rounded-xl border px-3 py-2 text-left text-sm transition-all",
              selectedAccountId === "all"
                ? "border-foreground/20 bg-foreground/5"
                : "border-transparent bg-muted/30 hover:bg-muted/60",
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
                  "w-full rounded-xl border px-3 py-3 text-left transition-all",
                  selectedAccountId === account.id
                    ? "border-foreground/20 bg-foreground/5"
                    : "border-transparent bg-muted/30 hover:bg-muted/60",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: account.colorTag || "#5bbabd" }}
                  />
                  <p className="text-sm font-medium text-foreground">{account.displayName}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{account.providerAccountEmail}</p>
              </button>
            ))}
          </div>

          <h2 className="pt-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Buckets
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {buckets.map((bucket) => (
              <button
                key={bucket.id}
                type="button"
                onClick={() => setSelectedBucket(bucket.id)}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  selectedBucket === bucket.id
                    ? "bg-foreground text-background"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground",
                )}
              >
                {bucket.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-3 rounded-[1.5rem] border border-border/60 bg-card/60 p-4 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Threads
            </h2>
            <p className="text-xs text-muted-foreground">{filteredThreads.length} visible</p>
          </div>

          {filteredThreads.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              No threads match this filter yet.
            </div>
          ) : (
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {filteredThreads.map((thread) => (
                  <motion.li
                    key={thread.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={cn(
                        "w-full rounded-xl border px-4 py-3 text-left transition-all duration-500",
                        selectedThread?.id === thread.id
                          ? "border-primary/35 bg-primary/5 shadow-card"
                          : "border-transparent bg-muted/30 hover:bg-muted/60",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
                          {thread.subject}
                        </h3>
                        <span className="text-[11px] text-muted-foreground">
                          {formatRelativeTime(thread.lastMessageAt)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{thread.preview}</p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="rounded-full bg-muted px-2 py-1">{thread.accountLabel}</span>
                        <span>Priority {scoreToLabel(thread.aiPriorityScore)}</span>
                      </div>
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        <div className="space-y-4 rounded-[1.5rem] border border-border/60 bg-card/60 p-4 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Thread workspace
          </h2>

          {selectedThread ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/35 p-4">
                <h3 className="font-serif text-xl tracking-tight text-foreground">
                  {selectedThread.subject}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedThread.summary || selectedThread.preview}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-1">{selectedThread.accountLabel}</span>
                  <span>{selectedThread.focusBucket.replaceAll("_", " ")}</span>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Quick actions
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Sparkles className="h-3.5 w-3.5" /> Generate reply
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Send className="h-3.5 w-3.5" /> Send now
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
              Select a thread to see details and actions.
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recent drafts
            </h3>
            {drafts.length === 0 ? (
              <p className="rounded-xl bg-muted/20 p-3 text-xs text-muted-foreground">
                No drafts generated yet.
              </p>
            ) : (
              drafts.map((draft) => (
                <div key={draft.id} className="rounded-xl bg-muted/25 p-3">
                  <p className="text-sm font-medium text-foreground">{draft.generatedSubject}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {draft.generatedBody}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-1">{draft.tone}</span>
                    <span>{formatRelativeTime(draft.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.22 }}
      className="rounded-xl border border-border/60 bg-background/75 p-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </motion.div>
  );
}
