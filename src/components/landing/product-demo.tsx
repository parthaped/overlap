"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Inbox,
  Loader2,
  Mail,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ProviderId = "google" | "microsoft" | "icloud";

const providers: { id: ProviderId; label: string; email: string; color: string }[] = [
  { id: "google", label: "Google", email: "you@studio.design", color: "#5bbabd" },
  { id: "microsoft", label: "Microsoft", email: "you@consulting.team", color: "#f68d4f" },
  { id: "icloud", label: "iCloud", email: "you@icloud.com", color: "#8e8e93" },
];

const demoThreads: Record<
  ProviderId,
  { subject: string; bucket: string; score: string; snippet: string; time: string }[]
> = {
  google: [
    {
      subject: "Investor prep — headline check",
      bucket: "Needs reply",
      score: "High",
      snippet: "Could you confirm the revised metric headline before 7pm?",
      time: "12m ago",
    },
    {
      subject: "April partner newsletter",
      bucket: "Other",
      score: "Low",
      snippet: "Portfolio updates and summit ticket code inside.",
      time: "2d ago",
    },
  ],
  microsoft: [
    {
      subject: "Board deck edits before Friday",
      bucket: "Needs reply",
      score: "High",
      snippet: "Tighten the AI operations slide and KPI narrative.",
      time: "3h ago",
    },
    {
      subject: "Proposal timing",
      bucket: "Waiting on",
      score: "Med",
      snippet: "Waiting on Morgan’s team after your April 8 send.",
      time: "5d ago",
    },
  ],
  icloud: [
    {
      subject: "Family calendar — spring trip",
      bucket: "Focus",
      score: "Med",
      snippet: "Two weekends in May work best on your shared calendar.",
      time: "1d ago",
    },
  ],
};

const draftPhrases = [
  "Thanks for the patience — here’s a concise reply that matches your tone…",
  "Hi — confirming the headline reads clearly and aligns with last week’s deck.",
  "I can do Tuesday 2–4pm or Wednesday 10–12 for the roadmap session.",
];

export function ProductDemo() {
  const [provider, setProvider] = useState<ProviderId>("google");
  const [bucket, setBucket] = useState<"all" | "needs">("needs");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [phase, setPhase] = useState<"idle" | "generating" | "ready" | "sent">("idle");
  const [typed, setTyped] = useState("");
  const [sendPulse, setSendPulse] = useState(false);

  const threads = demoThreads[provider];
  const filtered = useMemo(
    () =>
      bucket === "needs"
        ? threads.filter((t) => t.bucket.toLowerCase().includes("need") || t.bucket === "Focus")
        : threads,
    [threads, bucket],
  );

  const safeIdx = Math.max(0, Math.min(selectedIdx, Math.max(0, filtered.length - 1)));
  const selected = filtered[safeIdx] ?? filtered[0];

  const runDemo = () => {
    setPhase("generating");
    setSendPulse(false);
    setTyped("");
    const target = draftPhrases[safeIdx % draftPhrases.length];
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(target.slice(0, i));
      if (i >= target.length) {
        window.clearInterval(id);
        setPhase("ready");
      }
    }, 22);
  };

  const sendDemo = () => {
    setSendPulse(true);
    setPhase("sent");
    window.setTimeout(() => {
      setSendPulse(false);
      setPhase("idle");
      setTyped("");
    }, 1600);
  };

  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <section className="border-t border-border/50 bg-gradient-to-b from-card/40 to-background px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Live preview
        </p>
        <h2 className="mt-4 text-center font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
          One surface. Every provider. Same calm rhythm.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
          Switch accounts, triage by bucket, and watch a reply draft appear—without leaving this
          layout.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.75, ease }}
          className="mt-14 overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/90 shadow-soft ring-1 ring-border/40"
        >
          {/* App chrome */}
          <div className="flex flex-col gap-0 border-b border-border/50 bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/90 ring-1 ring-border/50">
                <Inbox className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </div>
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Unified inbox
                </p>
                <p className="text-sm font-medium text-foreground">Demo workspace</p>
              </div>
            </div>

            <Tabs
              value={provider}
              onValueChange={(v) => {
                setProvider(v as ProviderId);
                setSelectedIdx(0);
              }}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid h-10 w-full grid-cols-3 gap-1 rounded-2xl bg-background/80 p-1 sm:w-auto sm:min-w-[280px]">
                {providers.map((p) => (
                  <TabsTrigger
                    key={p.id}
                    value={p.id}
                    className="rounded-xl px-2 py-1.5 text-xs font-medium transition-all duration-500 data-[state=active]:shadow-card sm:text-sm"
                  >
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            {/* Thread list */}
            <div className="border-b border-border/50 p-4 lg:border-b-0 lg:border-r">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Sort</span>
                <button
                  type="button"
                  onClick={() => {
                    setBucket("needs");
                    setSelectedIdx(0);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-all duration-500",
                    bucket === "needs"
                      ? "bg-foreground text-background"
                      : "bg-muted/70 text-muted-foreground hover:text-foreground",
                  )}
                >
                  Needs reply & focus
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBucket("all");
                    setSelectedIdx(0);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-all duration-500",
                    bucket === "all"
                      ? "bg-foreground text-background"
                      : "bg-muted/70 text-muted-foreground hover:text-foreground",
                  )}
                >
                  All threads
                </button>
              </div>

              <ul className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {filtered.map((t, i) => (
                    <motion.li
                      key={`${provider}-${t.subject}-${i}`}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, ease }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedIdx(i)}
                        className={cn(
                          "flex w-full flex-col rounded-2xl border px-4 py-3 text-left transition-all duration-500",
                          selectedIdx === i
                            ? "border-primary/40 bg-primary/5 shadow-card"
                            : "border-transparent bg-muted/30 hover:border-border/60 hover:bg-muted/50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium leading-snug text-foreground">{t.subject}</span>
                          <span className="shrink-0 text-[0.7rem] text-muted-foreground">{t.time}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-muted/90 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                            {t.bucket}
                          </span>
                          <span className="text-[0.65rem] text-muted-foreground">Priority · {t.score}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{t.snippet}</p>
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>

              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
                Same UI for {providers.find((p) => p.id === provider)?.email}
              </div>
            </div>

            {/* Compose / AI */}
            <div className="flex flex-col p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Composer
                  </p>
                  <p className="font-medium text-foreground">{selected?.subject ?? "Select a thread"}</p>
                </div>
                <Sparkles className="h-5 w-5 text-primary" strokeWidth={1.5} aria-hidden />
              </div>

              <div className="min-h-[140px] rounded-2xl border border-border/60 bg-background/80 p-4 text-sm leading-relaxed text-foreground shadow-inner">
                {phase === "idle" && (
                  <p className="text-muted-foreground">
                    Press <strong className="text-foreground">Generate draft</strong> to simulate AI
                    composing a reply in your tone—then send it through the same provider you’re
                    viewing.
                  </p>
                )}
                {(phase === "generating" || phase === "ready") && (
                  <p className="whitespace-pre-wrap">
                    {typed}
                    {phase === "generating" && (
                      <motion.span
                        animate={{ opacity: [1, 0.2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="inline-block w-2"
                      >
                        |
                      </motion.span>
                    )}
                  </p>
                )}
                {phase === "sent" && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-primary"
                  >
                    <Mail className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    Message queued — same thread, same unified timeline.
                  </motion.p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={runDemo}
                  disabled={phase === "generating"}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-card transition-all duration-500 hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {phase === "generating" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                      Generate draft
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={sendDemo}
                  disabled={phase !== "ready"}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border border-border/80 px-5 py-2.5 text-sm font-medium transition-all duration-500",
                    phase === "ready"
                      ? "bg-card text-foreground hover:border-primary/40"
                      : "cursor-not-allowed opacity-40",
                  )}
                >
                  <Send className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  Send
                </button>
              </div>

              <motion.div
                animate={sendPulse ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 0.5 }}
                className="mt-6 flex items-start gap-3 rounded-2xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground"
              >
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" aria-hidden />
                <p>
                  In the real app, buckets update from thread intelligence, drafts pull from your
                  preferences, and provider switches keep the chrome identical—so muscle memory
                  carries across Google, Microsoft, and more.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
