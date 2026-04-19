"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Inbox,
  Send,
  Shield,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import sanitizeHtml from "sanitize-html";
import { toast } from "sonner";

import {
  archiveThread,
  draftReply,
  muteDomain,
  setVip,
  snoozeThread,
  summarizeThread,
  toggleStar,
} from "@/actions/ai";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatRelativeTime, initials } from "@/lib/utils";

import type { InboxMessage, ThreadDetail } from "@/components/app/inbox/types";

const DRAFT_REPLY_TONES = [
  "Professional but warm",
  "Friendly and conversational",
  "Detailed and reassuring",
  "Short and direct",
] as const;

type ThreadReaderProps = {
  detail: ThreadDetail | null;
  onBack?: () => void;
  preferredTone: string;
};

export function ThreadReader({ detail, onBack, preferredTone }: ThreadReaderProps) {
  if (!detail) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background">
          <Inbox className="h-6 w-6" strokeWidth={1.5} />
        </span>
        <p className="max-w-sm text-sm leading-relaxed">
          Pick a thread on the left to read it here. Press <kbd className="rounded border border-border bg-muted/50 px-1 text-[10px]">?</kbd> for shortcuts.
        </p>
      </div>
    );
  }

  return <ReaderContent detail={detail} onBack={onBack} preferredTone={preferredTone} />;
}

function ReaderContent({
  detail,
  onBack,
  preferredTone,
}: {
  detail: ThreadDetail;
  onBack?: () => void;
  preferredTone: string;
}) {
  const reduceMotion = useReducedMotion();
  const [composerOpen, setComposerOpen] = useState(false);
  const [draftSubject, setDraftSubject] = useState(`Re: ${detail.subject}`);
  const [draftBody, setDraftBody] = useState("");
  const [draftTone, setDraftTone] = useState(preferredTone);
  const [pending, startTransition] = useTransition();
  const [pendingSummary, startSummary] = useTransition();
  const [summary, setSummary] = useState(detail.summary);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setDraftSubject(`Re: ${detail.subject}`);
    setDraftBody("");
    setComposerOpen(false);
    setSummary(detail.summary);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [detail.id, detail.subject, detail.summary]);

  const senderEmail = detail.messages.find((m) => m.direction === "INBOUND")?.fromEmail ?? null;
  const senderDomain = senderEmail?.split("@")[1] ?? null;

  function action<T>(fn: () => Promise<T>) {
    return () => startTransition(async () => { await fn(); });
  }

  function generateAIDraft() {
    startTransition(async () => {
      const r = await draftReply({ threadId: detail.id, tone: draftTone });
      if (r.ok) {
        setDraftSubject(r.data.subject);
        setDraftBody(r.data.body);
        setComposerOpen(true);
        toast.success("Draft generated");
      } else {
        toast.error(r.error);
      }
    });
  }

  function refreshSummary() {
    startSummary(async () => {
      const r = await summarizeThread({ threadId: detail.id });
      if (r.ok) {
        setSummary(r.data.summary);
        toast.success("Summary refreshed");
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <motion.div
      key={detail.id}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col"
    >
      <header className="flex items-start justify-between gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="flex min-w-0 items-start gap-2">
          {onBack ? (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 lg:hidden" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          ) : null}
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-[17px]">
              {detail.subject}
            </h2>
            {detail.chips.length > 0 ? (
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {detail.chips.slice(0, 4).map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80 ring-1 ring-border/40"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconAction
            label="Star"
            onClick={action(async () => {
              const r = await toggleStar({ threadId: detail.id });
              if (!r.ok) toast.error(r.error);
            })}
          >
            <Star className="h-4 w-4" strokeWidth={1.5} />
          </IconAction>
          <IconAction
            label="Archive"
            onClick={action(async () => {
              const r = await archiveThread({ threadId: detail.id });
              if (r.ok) toast.success("Archived");
              else toast.error(r.error);
            })}
          >
            <Archive className="h-4 w-4" strokeWidth={1.5} />
          </IconAction>
          <IconAction
            label="Snooze 4 hours"
            onClick={action(async () => {
              const r = await snoozeThread({ threadId: detail.id, hours: 4 });
              if (r.ok) toast.success("Snoozed");
              else toast.error(r.error);
            })}
          >
            <Clock className="h-4 w-4" strokeWidth={1.5} />
          </IconAction>
          {senderEmail ? (
            <IconAction
              label="Mark sender VIP"
              onClick={action(async () => {
                const r = await setVip({ email: senderEmail });
                if (r.ok) toast.success(`Added ${senderEmail} as VIP`);
                else toast.error(r.error);
              })}
            >
              <Shield className="h-4 w-4" strokeWidth={1.5} />
            </IconAction>
          ) : null}
          {senderDomain ? (
            <IconAction
              label="Mute sender domain"
              onClick={action(async () => {
                const r = await muteDomain({ domain: senderDomain });
                if (r.ok) toast.success(`Muted ${senderDomain}`);
                else toast.error(r.error);
              })}
            >
              <VolumeX className="h-4 w-4" strokeWidth={1.5} />
            </IconAction>
          ) : null}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <AIInsightStrip
          summary={summary}
          reasons={detail.reasons}
          actionItems={detail.actionItems}
          score={detail.aiPriorityScore}
          loadingSummary={pendingSummary}
          onRefreshSummary={refreshSummary}
        />

        <div className="mt-5 space-y-4">
          {detail.messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </div>
      </div>

      <footer className="border-t border-border/60 bg-background px-4 py-3 sm:px-6">
        {!composerOpen ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-border/70 bg-card/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-background"
            >
              <span className="flex-1 text-left">Reply…</span>
              <kbd className="rounded border border-border bg-muted/50 px-1 text-[10px] font-mono">r</kbd>
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={generateAIDraft}
              disabled={pending}
              className="gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
              {pending ? "Drafting…" : "Draft with AI"}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Reply
              </p>
              <Select value={draftTone} onValueChange={setDraftTone}>
                <SelectTrigger
                  aria-label="Reply tone"
                  className="h-8 min-w-[11rem] max-w-[14rem] shrink-0 rounded-lg border-border/60 px-2.5 text-xs font-medium shadow-none ring-1 ring-border/25 data-[state=open]:ring-primary/25"
                >
                  <SelectValue placeholder="Tone" />
                </SelectTrigger>
                <SelectContent>
                  {DRAFT_REPLY_TONES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={generateAIDraft}
                disabled={pending}
                className="ml-auto h-7 gap-1.5 px-2 text-xs"
              >
                <Sparkles className="h-3 w-3" strokeWidth={1.5} />
                {pending ? "Generating…" : "Re-roll"}
              </Button>
            </div>
            <input
              value={draftSubject}
              onChange={(e) => setDraftSubject(e.target.value)}
              placeholder="Subject"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none"
            />
            <textarea
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              rows={6}
              placeholder="Write a reply or use the AI draft button above…"
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none"
            />
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setComposerOpen(false)}
                className="h-8 px-3 text-xs"
              >
                Discard
              </Button>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-3 text-xs"
                  onClick={() => toast.message("Saved as draft")}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Save draft
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="h-8 gap-1.5 px-3 text-xs"
                  onClick={() => toast.success("Sending is wired in the next phase.")}
                >
                  <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </footer>
    </motion.div>
  );
}

function MessageBubble({ message }: { message: InboxMessage }) {
  const html = message.bodyHtml
    ? sanitizeHtml(message.bodyHtml, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "h4"]),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          a: ["href", "name", "target", "rel"],
          img: ["src", "alt", "title", "width", "height"],
        },
        transformTags: {
          a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
        },
      })
    : null;

  return (
    <article
      className={cn(
        "rounded-xl border border-border/60 bg-background/80 p-4",
        message.direction === "OUTBOUND" && "border-primary/20 bg-primary/[0.04]",
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground">
            {initials(message.fromName ?? message.fromEmail ?? "?")}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {message.fromName ?? message.fromEmail ?? "Unknown"}
            </p>
            {message.fromEmail ? (
              <p className="text-[11px] text-muted-foreground">{message.fromEmail}</p>
            ) : null}
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {formatRelativeTime(message.receivedAt ?? message.sentAt ?? null)}
        </span>
      </header>
      <div className="mt-3 text-[13.5px] leading-relaxed text-foreground/90">
        {html ? (
          <div
            className="prose prose-sm max-w-none [&_a]:text-primary [&_a]:underline-offset-2 [&_p]:my-2"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-[13.5px] leading-relaxed">
            {message.bodyText ?? ""}
          </pre>
        )}
      </div>
    </article>
  );
}

function AIInsightStrip({
  summary,
  reasons,
  actionItems,
  score,
  loadingSummary,
  onRefreshSummary,
}: {
  summary: string | null;
  reasons: string[];
  actionItems: string[];
  score: number;
  loadingSummary: boolean;
  onRefreshSummary: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.05] via-background to-accent/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/90">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
          AI insight
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2 py-0.5 ring-1 ring-border/40">
            <Volume2 className="h-3 w-3" strokeWidth={1.5} />
            Priority {score}
          </span>
          <button
            type="button"
            onClick={onRefreshSummary}
            disabled={loadingSummary}
            className="rounded-full bg-background/70 px-2 py-0.5 ring-1 ring-border/40 transition-colors hover:bg-background"
          >
            {loadingSummary ? "Summarizing…" : "Refresh"}
          </button>
        </div>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">
        {summary ?? "Nothing summarized yet. Hit refresh to ask the model."}
      </p>
      {reasons.length > 0 ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Why it matters
          </p>
          <ul className="mt-1 space-y-1 text-[12.5px] text-foreground/85">
            {reasons.slice(0, 3).map((r, i) => (
              <li key={`${r}-${i}`} className="flex items-start gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {actionItems.length > 0 ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Suggested next step
          </p>
          <ul className="mt-1 space-y-1 text-[12.5px] text-foreground/85">
            {actionItems.slice(0, 3).map((a, i) => (
              <li key={`${a}-${i}`} className="flex items-start gap-1.5">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" strokeWidth={1.5} />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function IconAction({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
    >
      {children}
    </button>
  );
}
