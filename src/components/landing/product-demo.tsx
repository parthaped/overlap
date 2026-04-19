"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Archive,
  Cable,
  Clock,
  FileText,
  Inbox,
  LayoutDashboard,
  Loader2,
  Mail,
  MailOpen,
  Megaphone,
  Newspaper,
  Search,
  Send,
  Settings,
  Shield,
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
  | "PROMOTIONS"
  | "SOCIAL"
  | "NEWSLETTERS";

type Chip =
  | "VIP"
  | "Deadline"
  | "Meeting"
  | "Promotional"
  | "Newsletter"
  | "Social"
  | "Update"
  | "Finance"
  | "High-stakes"
  | "Muted sender";

type PreviewThread = {
  id: string;
  bucket: BucketId;
  sender: string;
  senderInitials: string;
  senderEmail: string;
  accountColor: string;
  accountLabel: string;
  subject: string;
  preview: string;
  body: string;
  time: string;
  unread?: boolean;
  starred?: boolean;
  chips: Chip[];
  insight: { summary: string; reasons: string[]; actionItems?: string[]; score: number };
  defaultDraft?: string;
};

const buckets: {
  id: BucketId;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: "FOCUS", label: "Focus", icon: Sparkles },
  { id: "NEEDS_REPLY", label: "Needs reply", icon: Mail },
  { id: "WAITING_ON", label: "Waiting on", icon: MailOpen },
  { id: "UPDATES", label: "Updates", icon: Inbox },
  { id: "PROMOTIONS", label: "Promotions", icon: Megaphone },
  { id: "SOCIAL", label: "Social", icon: Users },
  { id: "NEWSLETTERS", label: "Newsletters", icon: Newspaper },
];

const chipStyles: Record<Chip, string> = {
  VIP: "bg-amber-100/80 text-amber-900 ring-amber-200/50",
  Deadline: "bg-red-100/80 text-red-900 ring-red-200/40",
  Meeting: "bg-blue-100/80 text-blue-900 ring-blue-200/40",
  Promotional: "bg-pink-100/70 text-pink-900 ring-pink-200/40",
  Newsletter: "bg-violet-100/70 text-violet-900 ring-violet-200/40",
  Social: "bg-sky-100/70 text-sky-900 ring-sky-200/40",
  Update: "bg-slate-200/70 text-slate-800 ring-slate-300/40",
  Finance: "bg-emerald-100/80 text-emerald-900 ring-emerald-200/40",
  "High-stakes": "bg-orange-100/80 text-orange-900 ring-orange-200/40",
  "Muted sender": "bg-zinc-200/70 text-zinc-700 ring-zinc-300/40",
};

const allThreads: PreviewThread[] = [
  {
    id: "t-focus-1",
    bucket: "FOCUS",
    sender: "Sarah Chen",
    senderInitials: "SC",
    senderEmail: "sarah@meridian.co",
    accountColor: "#5bbabd",
    accountLabel: "Atelier Studio",
    subject: "Q2 narrative — alignment before Friday",
    preview: "Could you confirm the revised metric headline before 7pm? Board read goes out Friday.",
    body:
      "Hi — could you confirm the revised metric headline before 7pm? The board read goes out Friday morning and I want to lock the narrative. Pasting the latest line below.",
    time: "12m",
    unread: true,
    chips: ["VIP", "Deadline"],
    insight: {
      summary: "Time-sensitive ask from a VIP. Confirm headline before 7pm tonight.",
      reasons: ["VIP sender (Meridian.co)", "Explicit 7pm deadline", "Tied to Friday board read"],
      actionItems: ["Reply with confirmation", "Lock board narrative"],
      score: 94,
    },
    defaultDraft:
      "Hi Sarah — confirmed. The headline reads cleanly and matches last week's deck. I tightened the KPI line so it mirrors the appendix without repeating the chart. Sending the locked version now.",
  },
  {
    id: "t-focus-2",
    bucket: "FOCUS",
    sender: "Morgan Diaz",
    senderInitials: "MD",
    senderEmail: "morgan@partnerlegal.com",
    accountColor: "#5bbabd",
    accountLabel: "Atelier Studio",
    subject: "Contract redlines for review",
    preview: "Two notes from legal on indemnification — both should be quick.",
    body:
      "Sharing two redlines from legal on the indemnification clause. Both are minor edits but want your sign-off before sending back.",
    time: "1h",
    chips: ["High-stakes", "Finance"],
    insight: {
      summary: "Legal redlines — quick review needed before sending back to counterparty.",
      reasons: ["Tier-1 keyword: contract", "Mentions legal team", "Awaiting your sign-off"],
      actionItems: ["Review two redlines", "Confirm or counter"],
      score: 88,
    },
    defaultDraft:
      "Morgan — reviewed both. Edit 1 looks good as drafted. On Edit 2, can we keep the original cap language? Otherwise, ship it.",
  },
  {
    id: "t-needs-1",
    bucket: "NEEDS_REPLY",
    sender: "John Park",
    senderInitials: "JP",
    senderEmail: "john@northstarhq.com",
    accountColor: "#5bbabd",
    accountLabel: "Atelier Studio",
    subject: "Roadmap working session next week",
    preview: "Tuesday or Wednesday afternoon would be ideal — 45 min should be plenty.",
    body:
      "Hey Alex — could you send a few times next week for a 45-minute roadmap working session? Tuesday or Wednesday afternoon would be ideal.",
    time: "3h",
    unread: true,
    chips: ["Meeting"],
    insight: {
      summary: "Meeting request. Offer Tue 2–4pm or Wed 10–12 from your calendar.",
      reasons: ["Asks for availability", "Calendar shows two open windows"],
      actionItems: ["Reply with availability"],
      score: 78,
    },
    defaultDraft:
      "Hi John — happy to lock it in. Tuesday 2–4pm or Wednesday 10–12 both work on my side. Send the invite for whichever fits best and I'll add the working doc.",
  },
  {
    id: "t-needs-2",
    bucket: "NEEDS_REPLY",
    sender: "Priya Raman",
    senderInitials: "PR",
    senderEmail: "priya@consultingteam.io",
    accountColor: "#f68d4f",
    accountLabel: "Consulting Team",
    subject: "Stakeholder map — quick sanity check",
    preview: "I added Marcus and pruned the procurement cluster. Does this look right?",
    body: "Pinged you on the stakeholder map — added Marcus and pruned the procurement cluster.",
    time: "5h",
    chips: [],
    insight: {
      summary: "Quick sanity-check request. 30-second reply will close the loop.",
      reasons: ["Direct yes/no question", "Owner waiting on you"],
      actionItems: ["Acknowledge or amend"],
      score: 64,
    },
    defaultDraft:
      "Priya — looks right. Marcus is the right primary; agree on pruning procurement until phase two.",
  },
  {
    id: "t-waiting-1",
    bucket: "WAITING_ON",
    sender: "You → Vendor Ops",
    senderInitials: "Y",
    senderEmail: "vendor@partner.com",
    accountColor: "#5bbabd",
    accountLabel: "Atelier Studio",
    subject: "Following up on April 8 send",
    preview: "Bumping this back to the top — any update on the SOW?",
    body: "Bumping this back to the top — any update on the SOW we sent on April 8?",
    time: "2d",
    chips: [],
    insight: {
      summary: "You're waiting on Vendor Ops. Last bump was 2 days ago.",
      reasons: ["Outbound thread", "No reply in 5+ days"],
      actionItems: ["Wait or send reminder"],
      score: 42,
    },
  },
  {
    id: "t-update-1",
    bucket: "UPDATES",
    sender: "GitHub",
    senderInitials: "GH",
    senderEmail: "notifications@github.com",
    accountColor: "#8e8e93",
    accountLabel: "Atelier Studio",
    subject: "[atelier/product] PR opened",
    preview: "user@atelier opened pull request #284 in atelier/product.",
    body: "user@atelier opened pull request #284 in atelier/product.",
    time: "4h",
    chips: ["Update", "Muted sender"],
    insight: {
      summary: "GitHub notification. No reply needed.",
      reasons: ["Automated update", "Sender domain: github.com"],
      score: 18,
    },
  },
  {
    id: "t-promo-1",
    bucket: "PROMOTIONS",
    sender: "Spring Lookbook",
    senderInitials: "SL",
    senderEmail: "deals@news.mailchimp.com",
    accountColor: "#8e8e93",
    accountLabel: "Atelier Studio",
    subject: "30% off this weekend only",
    preview: "Don't miss our spring sale. Unsubscribe at the bottom.",
    body: "Don't miss our spring sale. 30% off this weekend only. Unsubscribe at the bottom.",
    time: "1d",
    chips: ["Promotional"],
    insight: {
      summary: "Promotional. Safe to bulk archive.",
      reasons: ["Mailchimp domain", "Subject keyword: % off"],
      score: 8,
    },
  },
  {
    id: "t-social-1",
    bucket: "SOCIAL",
    sender: "LinkedIn",
    senderInitials: "in",
    senderEmail: "invitations@linkedin.com",
    accountColor: "#8e8e93",
    accountLabel: "Atelier Studio",
    subject: "Daniel invited you to connect",
    preview: "Daniel would like to connect with you on LinkedIn.",
    body: "Daniel would like to connect with you on LinkedIn.",
    time: "1d",
    chips: ["Social"],
    insight: {
      summary: "LinkedIn invite. Low priority.",
      reasons: ["Sender: linkedin.com", "Social network notification"],
      score: 12,
    },
  },
  {
    id: "t-newsletter-1",
    bucket: "NEWSLETTERS",
    sender: "Stratechery",
    senderInitials: "St",
    senderEmail: "newsletter@stratechery.com",
    accountColor: "#8e8e93",
    accountLabel: "Atelier Studio",
    subject: "Weekly: platform shifts & strategy notes",
    preview: "This week: enterprise AI distribution and the new shape of vertical software.",
    body: "This week: enterprise AI distribution and the new shape of vertical software.",
    time: "1d",
    chips: ["Newsletter"],
    insight: {
      summary: "Newsletter. Read when you have time.",
      reasons: ["Subscription cadence: weekly", "No action required"],
      score: 22,
    },
  },
];

function bucketCounts() {
  return buckets.reduce<Record<BucketId, number>>(
    (acc, b) => {
      acc[b.id] = allThreads.filter((t) => t.bucket === b.id).length;
      return acc;
    },
    {} as Record<BucketId, number>,
  );
}

const counts = bucketCounts();

export function ProductDemo() {
  const reduceMotion = useReducedMotion();
  const [bucket, setBucket] = useState<BucketId>("FOCUS");
  const [selectedId, setSelectedId] = useState<string>(allThreads[0]!.id);
  const [phase, setPhase] = useState<"idle" | "drafting" | "ready" | "sent">("idle");
  const [typed, setTyped] = useState("");
  const [tone, setTone] = useState("Professional but warm");

  const filtered = useMemo(() => allThreads.filter((t) => t.bucket === bucket), [bucket]);
  const selected = useMemo(
    () => filtered.find((t) => t.id === selectedId) ?? filtered[0] ?? allThreads[0]!,
    [filtered, selectedId],
  );

  useEffect(() => {
    if (filtered.length === 0) return;
    if (!filtered.some((t) => t.id === selectedId)) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setSelectedId(filtered[0]!.id);
      setPhase("idle");
      setTyped("");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [filtered, selectedId]);

  const generateDraft = () => {
    if (!selected.defaultDraft) {
      setPhase("ready");
      setTyped(
        "Thanks — I have everything I need to act on this. I'll follow up shortly with the next step.",
      );
      return;
    }
    setPhase("drafting");
    setTyped("");
    const target = selected.defaultDraft;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(target.slice(0, i));
      if (i >= target.length) {
        window.clearInterval(id);
        setPhase("ready");
      }
    }, 18);
  };

  const sendDraft = () => {
    setPhase("sent");
    window.setTimeout(() => {
      setPhase("idle");
      setTyped("");
    }, 1800);
  };

  return (
    <section className="relative overflow-hidden border-t border-border/40 bg-gradient-to-b from-card/50 via-background to-background px-6 py-24 lg:px-8">
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[min(100%,48rem)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center_top,rgba(91,187,189,0.09),transparent_65%)]" />

      <div className="relative mx-auto max-w-6xl">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease }}
          className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground"
        >
          The product
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.65, delay: 0.05, ease }}
          className="mt-4 text-center font-serif text-3xl tracking-tight text-foreground sm:text-4xl"
        >
          The exact dashboard you&apos;ll open every morning.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.65, delay: 0.1, ease }}
          className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground"
        >
          Switch buckets, open a thread, watch the AI reader generate a reply in your tone — the
          same UI, chips, and shortcuts you use inside the app.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.75, delay: 0.06, ease }}
          className="mt-14 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl ring-1 ring-border/40"
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/30 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-3 text-[10.5px] font-medium text-muted-foreground">overlap.app/inbox</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr]">
            {/* Sidebar */}
            <aside className="hidden flex-col border-r border-border/60 bg-card/40 px-3 py-4 lg:flex">
              <div className="flex items-center gap-2 px-2 pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
                  <Mail className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="text-sm font-semibold text-foreground">Overlap</span>
              </div>

              <div className="my-2 space-y-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-[11px] text-muted-foreground"
                >
                  <Search className="h-3 w-3" strokeWidth={1.5} />
                  Search · ⌘K
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md bg-foreground/95 px-2 py-1.5 text-[11px] font-medium text-background"
                >
                  <Sparkles className="h-3 w-3" strokeWidth={1.75} />
                  Ask Copilot
                </button>
              </div>

              <nav className="mt-1 space-y-0.5">
                {[
                  { label: "Inbox", icon: LayoutDashboard, active: true },
                  { label: "Drafts", icon: FileText },
                  { label: "Accounts", icon: Cable },
                  { label: "Settings", icon: Settings },
                ].map(({ label, icon: Icon, active }) => (
                  <div
                    key={label}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px]",
                      active ? "bg-muted/70 font-medium text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {label}
                  </div>
                ))}
              </nav>

              <div className="mt-auto rounded-md border border-border/50 bg-card/60 px-2 py-1.5 text-[10.5px] text-muted-foreground">
                <p className="text-foreground">Alex Mercer</p>
                <p className="truncate">alex@atelier.studio</p>
              </div>
            </aside>

            {/* Main column */}
            <div className="flex flex-col">
              {/* Daily Brief */}
              <div className="border-b border-border/60 bg-gradient-to-r from-primary/[0.05] via-transparent to-transparent px-4 py-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.75} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                      Morning brief
                    </p>
                    <p className="mt-0.5 text-[13px] text-foreground">
                      2 deadlines today, 5 needing reply, 24 promotions to clear. One redline from
                      legal needs your call.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="hidden shrink-0 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground sm:inline-flex"
                  >
                    Clear promos
                  </button>
                </div>
              </div>

              {/* Bucket tabs */}
              <div className="flex gap-0.5 overflow-x-auto border-b border-border/60 px-2 py-1.5">
                {buckets.map((b) => {
                  const Icon = b.icon;
                  const active = bucket === b.id;
                  const c = counts[b.id];
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setBucket(b.id);
                        setPhase("idle");
                        setTyped("");
                      }}
                      className={cn(
                        "relative inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] transition-colors",
                        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                      aria-pressed={active}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span>{b.label}</span>
                      {c > 0 ? (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-px text-[10px] tabular-nums",
                            active
                              ? "bg-foreground text-background"
                              : "bg-muted/70 text-muted-foreground",
                          )}
                        >
                          {c}
                        </span>
                      ) : null}
                      {active ? (
                        <motion.span
                          layoutId="demo-bucket-pill"
                          className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-foreground"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Three-pane: list + reader */}
              <div className="grid min-h-[440px] grid-cols-1 lg:grid-cols-[260px_1fr]">
                {/* Thread list */}
                <ul className="border-b border-border/60 lg:border-b-0 lg:border-r">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {filtered.map((t) => {
                      const active = selected?.id === t.id;
                      return (
                        <motion.li
                          key={t.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.32, ease }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(t.id);
                              setPhase("idle");
                              setTyped("");
                            }}
                            className={cn(
                              "group relative flex w-full items-start gap-2.5 border-b border-border/40 px-3 py-2.5 text-left transition-colors",
                              active ? "bg-primary/[0.06]" : "hover:bg-muted/30",
                              t.unread && !active ? "bg-background" : "",
                            )}
                          >
                            {active ? (
                              <span className="absolute inset-y-2 left-0 w-0.5 rounded-r bg-foreground" />
                            ) : null}
                            <span
                              className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-foreground"
                              style={{ backgroundColor: `${t.accountColor}1f` }}
                            >
                              {t.senderInitials}
                              {t.unread ? (
                                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background" />
                              ) : null}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-1.5">
                                <p
                                  className={cn(
                                    "truncate text-[12px] leading-tight",
                                    t.unread ? "font-semibold text-foreground" : "font-medium text-foreground/85",
                                  )}
                                >
                                  {t.sender}
                                </p>
                                <span className="ml-auto shrink-0 text-[10px] tabular-nums text-muted-foreground">
                                  {t.time}
                                </span>
                              </div>
                              <p
                                className={cn(
                                  "mt-0.5 truncate text-[11.5px] leading-tight",
                                  t.unread ? "text-foreground" : "text-foreground/85",
                                )}
                              >
                                {t.subject}
                              </p>
                              <p className="mt-0.5 line-clamp-1 text-[10.5px] text-muted-foreground">
                                {t.preview}
                              </p>
                              {t.chips.length > 0 ? (
                                <div className="mt-1 flex flex-wrap gap-0.5">
                                  {t.chips.slice(0, 3).map((c) => (
                                    <span
                                      key={c}
                                      className={cn(
                                        "rounded-full px-1.5 py-px text-[9.5px] font-medium ring-1",
                                        chipStyles[c],
                                      )}
                                    >
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </button>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                  {filtered.length === 0 ? (
                    <div className="px-4 py-6 text-center text-[12px] text-muted-foreground">
                      Nothing here. Inbox zero for {buckets.find((b) => b.id === bucket)?.label}.
                    </div>
                  ) : null}
                </ul>

                {/* Reader */}
                <div className="flex min-h-[440px] flex-col">
                  {/* Subject header */}
                  <div className="flex items-start justify-between gap-3 border-b border-border/50 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-foreground">{selected.subject}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {selected.sender} · {selected.senderEmail} · {selected.time}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1 text-muted-foreground">
                      <ActionIcon icon={Star} label="Star" />
                      <ActionIcon icon={Archive} label="Archive" />
                      <ActionIcon icon={Clock} label="Snooze" />
                      <ActionIcon icon={Shield} label="Mute" />
                    </div>
                  </div>

                  {/* AI insight strip */}
                  <div className="border-b border-primary/15 bg-primary/[0.04] px-4 py-2.5">
                    <div className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.75} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                            AI insight
                          </p>
                          <span className="rounded-full bg-foreground/90 px-1.5 py-px text-[9.5px] font-semibold text-background">
                            Priority {selected.insight.score}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] text-foreground">{selected.insight.summary}</p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-muted-foreground">
                          {selected.insight.reasons.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                        {selected.insight.actionItems ? (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {selected.insight.actionItems.map((a) => (
                              <span
                                key={a}
                                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary ring-1 ring-primary/20"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Message bubble */}
                  <div className="space-y-3 px-4 py-3">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3 text-[12.5px] leading-relaxed text-foreground">
                      <div className="mb-1.5 flex items-center justify-between text-[10.5px] text-muted-foreground">
                        <span className="font-medium text-foreground/80">{selected.sender}</span>
                        <span>{selected.time} ago</span>
                      </div>
                      <p className="whitespace-pre-wrap">{selected.body}</p>
                    </div>

                    {/* Composer */}
                    <div className="rounded-lg border border-border bg-background p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Reply
                        </p>
                        <select
                          value={tone}
                          onChange={(e) => setTone(e.target.value)}
                          className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] text-foreground focus:outline-none"
                        >
                          <option>Professional but warm</option>
                          <option>Direct</option>
                          <option>Friendly</option>
                          <option>Concise</option>
                        </select>
                      </div>

                      <div className="relative min-h-[88px] rounded-md border border-border/60 bg-card/40 px-3 py-2 text-[12px] leading-snug text-foreground">
                        {phase === "drafting" ? (
                          <motion.div
                            className="pointer-events-none absolute inset-0 rounded-md"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <motion.div
                              className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-primary/12 to-transparent"
                              animate={reduceMotion ? {} : { x: ["-100%", "120%"] }}
                              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                            />
                          </motion.div>
                        ) : null}
                        {phase === "idle" ? (
                          <p className="text-muted-foreground">
                            Press <strong className="text-foreground">Draft with AI</strong> to compose
                            in your tone using calendar context and your past replies.
                          </p>
                        ) : phase === "sent" ? (
                          <p className="flex items-center gap-2 text-primary">
                            <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Sent through {selected.accountLabel}.
                          </p>
                        ) : (
                          <p className="relative whitespace-pre-wrap">
                            {typed}
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
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          Tone · {tone}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={generateDraft}
                            disabled={phase === "drafting"}
                            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[11px] font-medium text-background transition-opacity disabled:opacity-60"
                          >
                            {phase === "drafting" ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3" strokeWidth={1.75} />
                            )}
                            {phase === "drafting" ? "Drafting…" : "Draft with AI"}
                          </button>
                          <button
                            type="button"
                            onClick={sendDraft}
                            disabled={phase !== "ready"}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-[11px] font-medium",
                              phase === "ready" ? "text-foreground" : "cursor-not-allowed opacity-40",
                            )}
                          >
                            <Send className="h-3 w-3" strokeWidth={1.75} />
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-[12px] text-muted-foreground">
          Same chrome, same shortcuts (⌘K to search, ⌘⇧J for Copilot) you use every day.
        </p>
      </div>
    </section>
  );
}

function ActionIcon({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="rounded-md p-1.5 transition-colors hover:bg-muted/60 hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
    </button>
  );
}
