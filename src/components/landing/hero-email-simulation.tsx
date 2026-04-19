"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Archive,
  ArrowRight,
  Clock,
  Inbox,
  LayoutDashboard,
  Mail,
  MailOpen,
  Megaphone,
  Search,
  Send,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

type BucketId =
  | "FOCUS"
  | "NEEDS_REPLY"
  | "WAITING_ON"
  | "UPDATES"
  | "PROMOTIONS";

type Chip =
  | "VIP"
  | "Deadline"
  | "Meeting"
  | "Promotional"
  | "Newsletter"
  | "Update"
  | "Finance";

type Thread = {
  id: string;
  bucket: BucketId;
  sender: string;
  senderInitials: string;
  accentColor: string;
  subject: string;
  preview: string;
  time: string;
  unread?: boolean;
  chips: Chip[];
};

const buckets: { id: BucketId; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; count: number }[] = [
  { id: "FOCUS", label: "Focus", icon: Sparkles, count: 3 },
  { id: "NEEDS_REPLY", label: "Needs reply", icon: Mail, count: 5 },
  { id: "WAITING_ON", label: "Waiting on", icon: MailOpen, count: 2 },
  { id: "UPDATES", label: "Updates", icon: Inbox, count: 12 },
  { id: "PROMOTIONS", label: "Promotions", icon: Megaphone, count: 24 },
];

const threads: Thread[] = [
  {
    id: "t1",
    bucket: "FOCUS",
    sender: "Sarah Chen",
    senderInitials: "SC",
    accentColor: "#5bbabd",
    subject: "Q2 narrative — alignment before Friday",
    preview: "Could you confirm the revised metric headline before 7pm? Board read goes out Friday morning.",
    time: "12m",
    unread: true,
    chips: ["VIP", "Deadline"],
  },
  {
    id: "t2",
    bucket: "NEEDS_REPLY",
    sender: "John Park",
    senderInitials: "JP",
    accentColor: "#5bbabd",
    subject: "Roadmap working session next week",
    preview: "Tuesday or Wednesday afternoon would be ideal. 45 minutes should give us room.",
    time: "1h",
    unread: true,
    chips: ["Meeting"],
  },
  {
    id: "t3",
    bucket: "NEEDS_REPLY",
    sender: "Morgan Diaz",
    senderInitials: "MD",
    accentColor: "#f68d4f",
    subject: "Contract redlines for review",
    preview: "Two notes from legal on indemnification — both should be quick.",
    time: "3h",
    chips: ["Finance"],
  },
  {
    id: "t4",
    bucket: "PROMOTIONS",
    sender: "Spring Lookbook",
    senderInitials: "SL",
    accentColor: "#8e8e93",
    subject: "30% off — this weekend only",
    preview: "Don't miss our spring sale. Unsubscribe at the bottom.",
    time: "1d",
    chips: ["Promotional"],
  },
  {
    id: "t5",
    bucket: "UPDATES",
    sender: "GitHub",
    senderInitials: "GH",
    accentColor: "#8e8e93",
    subject: "[atelier/product] PR opened",
    preview: "user@atelier opened pull request #284 in atelier/product.",
    time: "2d",
    chips: ["Update"],
  },
];

const chipStyles: Record<Chip, string> = {
  VIP: "bg-amber-100/80 text-amber-900 ring-amber-200/50",
  Deadline: "bg-red-100/80 text-red-900 ring-red-200/40",
  Meeting: "bg-blue-100/80 text-blue-900 ring-blue-200/40",
  Promotional: "bg-pink-100/70 text-pink-900 ring-pink-200/40",
  Newsletter: "bg-violet-100/70 text-violet-900 ring-violet-200/40",
  Update: "bg-slate-200/70 text-slate-800 ring-slate-300/40",
  Finance: "bg-emerald-100/80 text-emerald-900 ring-emerald-200/40",
};

const draftSnippet =
  "Hi Sarah — confirmed. The headline reads cleanly and matches last week's deck. I tightened the KPI line so it mirrors the appendix without repeating the chart.";

export function HeroEmailSimulation() {
  const reduceMotion = useReducedMotion();
  const [bucket, setBucket] = useState<BucketId>("FOCUS");
  const [selectedId, setSelectedId] = useState<string>("t1");
  const [phase, setPhase] = useState<"idle" | "drafting" | "ready">("idle");
  const [typed, setTyped] = useState("");

  const filtered = useMemo(() => threads.filter((t) => t.bucket === bucket), [bucket]);
  const selected = useMemo(
    () => filtered.find((t) => t.id === selectedId) ?? filtered[0] ?? threads[0],
    [filtered, selectedId],
  );

  // Auto-loop: switch buckets, then trigger AI draft.
  useEffect(() => {
    if (reduceMotion) return;
    const order: BucketId[] = ["FOCUS", "NEEDS_REPLY", "PROMOTIONS"];
    let i = 0;
    const id = window.setInterval(() => {
      i = (i + 1) % order.length;
      setBucket(order[i]!);
      setSelectedId(threads.find((t) => t.bucket === order[i]!)?.id ?? "t1");
      setPhase("idle");
      setTyped("");
    }, 5800);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  // Auto-draft animation when Focus → Sarah Chen is selected.
  useEffect(() => {
    if (reduceMotion) return;
    if (selected?.id !== "t1") return;
    const start = window.setTimeout(() => setPhase("drafting"), 1500);
    return () => window.clearTimeout(start);
  }, [reduceMotion, selected?.id]);

  useEffect(() => {
    if (phase !== "drafting") return;
    if (typed.length >= draftSnippet.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("ready");
      return;
    }
    const t = window.setTimeout(() => setTyped(draftSnippet.slice(0, typed.length + 1)), 22);
    return () => window.clearTimeout(t);
  }, [phase, typed]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.3, ease }}
      className="relative mx-auto w-full max-w-xl lg:mx-0"
    >
      <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[2.25rem] bg-[radial-gradient(ellipse_at_30%_20%,rgba(91,187,189,0.18),transparent_55%),radial-gradient(ellipse_at_70%_80%,rgba(246,141,79,0.10),transparent_50%)] blur-2xl" />

      <motion.div
        animate={reduceMotion ? {} : { y: [0, -4, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-xl ring-1 ring-border/40"
      >
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/30 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 text-[10px] font-medium text-muted-foreground">overlap.app/inbox</span>
        </div>

        <div className="grid grid-cols-[64px_1fr] sm:grid-cols-[72px_1fr]">
          {/* Sidebar */}
          <aside className="border-r border-border/60 bg-card/40 px-2 py-3">
            <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background">
              <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
            </div>
            <div className="space-y-1">
              {[LayoutDashboard, Mail, Inbox, Users].map((Icon, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground",
                    i === 0 && "bg-muted/60 text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                </div>
              ))}
            </div>
          </aside>

          {/* Main */}
          <div className="flex flex-col">
            {/* Top bar with search + Overlap AI */}
            <div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2">
              <div className="flex flex-1 items-center gap-1.5 rounded-md bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground">
                <Search className="h-3 w-3" strokeWidth={1.5} />
                Search, jump, or ask Overlap…
                <span className="ml-auto rounded border border-border/60 bg-background px-1 py-px text-[9px] font-medium">⌘K</span>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background"
              >
                <Sparkles className="h-3 w-3" strokeWidth={1.75} />
                Overlap AI
              </button>
            </div>

            {/* Bucket tabs */}
            <div className="flex gap-0.5 overflow-hidden border-b border-border/60 px-2 py-1.5">
              {buckets.map((b) => {
                const Icon = b.icon;
                const active = bucket === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setBucket(b.id);
                      const first = threads.find((t) => t.bucket === b.id);
                      if (first) setSelectedId(first.id);
                      setPhase("idle");
                      setTyped("");
                    }}
                    className={cn(
                      "relative inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10.5px] transition-colors",
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3 w-3" strokeWidth={1.5} />
                    <span>{b.label}</span>
                    {b.count > 0 ? (
                      <span
                        className={cn(
                          "rounded-full px-1 py-px text-[9px] tabular-nums",
                          active ? "bg-foreground text-background" : "bg-muted/70 text-muted-foreground",
                        )}
                      >
                        {b.count}
                      </span>
                    ) : null}
                    {active ? (
                      <motion.span
                        layoutId="hero-bucket-pill"
                        className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-foreground"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Two-pane: thread list + reader */}
            <div className="grid h-[260px] grid-cols-[160px_1fr] sm:h-[280px] sm:grid-cols-[180px_1fr]">
              {/* Thread list */}
              <ul className="overflow-hidden border-r border-border/60">
                {filtered.slice(0, 4).map((t) => {
                  const active = selected?.id === t.id;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(t.id);
                          setPhase("idle");
                          setTyped("");
                        }}
                        className={cn(
                          "relative flex w-full items-start gap-2 border-b border-border/40 px-2.5 py-2 text-left transition-colors",
                          active ? "bg-primary/[0.06]" : "hover:bg-muted/30",
                        )}
                      >
                        {active ? (
                          <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-r bg-foreground" />
                        ) : null}
                        <span
                          className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-foreground"
                          style={{ backgroundColor: `${t.accentColor}1f` }}
                        >
                          {t.senderInitials}
                          {t.unread ? (
                            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background" />
                          ) : null}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1">
                            <p className={cn("truncate text-[10.5px] leading-tight", t.unread ? "font-semibold" : "font-medium text-foreground/85")}>
                              {t.sender}
                            </p>
                            <span className="ml-auto shrink-0 text-[9px] tabular-nums text-muted-foreground">{t.time}</span>
                          </div>
                          <p className={cn("mt-0.5 truncate text-[10px]", t.unread ? "text-foreground" : "text-foreground/80")}>{t.subject}</p>
                          {t.chips.length > 0 ? (
                            <div className="mt-1 flex flex-wrap gap-0.5">
                              {t.chips.slice(0, 2).map((c) => (
                                <span key={c} className={cn("rounded-full px-1 py-px text-[8.5px] font-medium ring-1", chipStyles[c])}>
                                  {c}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Reader */}
              <div className="flex flex-col overflow-hidden">
                {/* Subject + actions */}
                <div className="flex items-start justify-between gap-2 border-b border-border/50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-[11.5px] font-semibold text-foreground">{selected?.subject}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {selected?.sender} · {selected?.time}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-0.5 text-muted-foreground">
                    <Star className="h-3 w-3" strokeWidth={1.5} />
                    <Archive className="h-3 w-3" strokeWidth={1.5} />
                    <Clock className="h-3 w-3" strokeWidth={1.5} />
                  </div>
                </div>

                {/* AI insight strip */}
                <div className="flex items-start gap-1.5 border-b border-primary/15 bg-primary/[0.04] px-3 py-1.5">
                  <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-foreground">
                      {selected?.bucket === "FOCUS"
                        ? "Time-sensitive: confirm headline before 7pm."
                        : selected?.bucket === "NEEDS_REPLY"
                          ? "Suggests Tue 2–4pm or Wed 10–12 from your calendar."
                          : selected?.bucket === "PROMOTIONS"
                            ? "Promotional. Safe to archive."
                            : "Notification — no reply needed."}
                    </p>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {(selected?.chips ?? []).map((c) => (
                        <span key={c} className={cn("rounded-full px-1 py-px text-[8.5px] font-medium ring-1", chipStyles[c])}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Body / composer */}
                <div className="flex-1 space-y-2 overflow-hidden px-3 py-2 text-[10.5px] leading-snug text-foreground/85">
                  <p className="line-clamp-2">{selected?.preview}</p>

                  {selected?.id === "t1" ? (
                    <div className="rounded-md border border-border/60 bg-card/50 p-2">
                      <div className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-primary">
                        <Sparkles className="h-2.5 w-2.5" strokeWidth={1.75} />
                        {phase === "ready" ? "Drafted in your tone" : phase === "drafting" ? "Drafting…" : "Reply"}
                      </div>
                      <p className="min-h-[42px] whitespace-pre-wrap text-[10px] text-foreground">
                        {typed || (phase === "idle" ? "Press Draft with AI to compose a reply." : "")}
                        {phase === "drafting" ? (
                          <motion.span
                            animate={{ opacity: [1, 0.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="ml-0.5 inline-block w-1 text-primary"
                          >
                            |
                          </motion.span>
                        ) : null}
                      </p>
                      <div className="mt-2 flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPhase("drafting");
                            setTyped("");
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-foreground px-2 py-0.5 text-[9px] font-medium text-background"
                        >
                          <Sparkles className="h-2.5 w-2.5" strokeWidth={1.75} />
                          Draft with AI
                        </button>
                        <button
                          type="button"
                          disabled={phase !== "ready"}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[9px] font-medium",
                            phase === "ready" ? "text-foreground" : "opacity-40",
                          )}
                        >
                          <Send className="h-2.5 w-2.5" strokeWidth={1.75} />
                          Send
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground lg:justify-start">
        Your inbox, day one
        <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
      </p>
    </motion.div>
  );
}
