"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Loader2,
  Send,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { askInboxAi, type InboxAiToolCall } from "@/actions/inbox-ai";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/ui-store";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: InboxAiToolCall[];
};

const SUGGESTIONS = [
  "What's important today?",
  "Clear all promotions older than 7 days",
  "Draft replies to my VIPs",
  "Who am I waiting on?",
  "Summarize the thread I'm reading",
];

export function OverlapAiPanel() {
  const open = useUIStore((s) => s.overlapAiOpen);
  const setOpen = useUIStore((s) => s.setOverlapAiOpen);
  const conversationId = useUIStore((s) => s.overlapAiConversationId);
  const setConversationId = useUIStore((s) => s.setOverlapAiConversationId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);
  const nextId = (prefix: "u" | "a") => `${prefix}_${++idCounter.current}`;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: nextId("u"), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    startTransition(async () => {
      const r = await askInboxAi({
        question: trimmed,
        conversationId: conversationId ?? undefined,
      });
      if (r.ok) {
        if (!conversationId) setConversationId(r.conversationId);
        setMessages((prev) => [
          ...prev,
          {
            id: nextId("a"),
            role: "assistant",
            content: r.reply,
            toolCalls: r.toolCalls,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId("a"),
            role: "assistant",
            content: r.error || "Something went wrong.",
          },
        ]);
      }
    });
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <motion.aside
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed right-0 top-0 z-50 flex h-screen w-[min(420px,92vw)] flex-col border-l border-border bg-background shadow-2xl lg:shadow-none"
            aria-label="Overlap AI"
          >
            <header className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Overlap AI</p>
                  <p className="text-[11px] text-muted-foreground">
                    Asks, summarizes, drafts, triages.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                aria-label="Close Overlap AI"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-foreground">
                    Ask anything about your inbox. Overlap can read, summarize, draft, and
                    triage. Try a suggestion to get started.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="group flex items-center justify-between rounded-lg border border-border/70 bg-card/40 px-3 py-2 text-left text-[13px] text-foreground transition-colors hover:border-foreground/30 hover:bg-background"
                      >
                        <span>{s}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => <MessageBubble key={m.id} message={m} />)
              )}
              {pending ? (
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
                  Thinking…
                </div>
              ) : null}
            </div>

            <footer className="border-t border-border/60 bg-background px-3 py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={1}
                  placeholder="Ask Overlap…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={pending || !input.trim()}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-foreground text-background transition-opacity",
                    (pending || !input.trim()) && "opacity-50",
                  )}
                  aria-label="Send"
                >
                  <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </form>
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                ⌘⇧J toggles Overlap AI · Esc closes
              </p>
            </footer>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-foreground px-3 py-2 text-[13px] leading-snug text-background">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-2xl border border-border/60 bg-card/40 px-3 py-2 text-[13px] leading-snug text-foreground">
        {message.content.split("\n").map((line, i) => (
          <p key={i} className={i === 0 ? "" : "mt-1"}>
            {line}
          </p>
        ))}
      </div>
      {message.toolCalls && message.toolCalls.length > 0 ? (
        <div className="space-y-1">
          {message.toolCalls.map((tc, i) => (
            <ToolCallTrace key={`${tc.name}-${i}`} call={tc} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ToolCallTrace({ call }: { call: InboxAiToolCall }) {
  const [open, setOpen] = useState(false);
  const summary = summarizeToolCall(call);
  return (
    <div className="rounded-md border border-border/40 bg-background/70">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11px] text-muted-foreground hover:text-foreground"
      >
        <Wrench className="h-3 w-3" strokeWidth={1.75} />
        <span className="flex-1 truncate">
          <span className="font-mono text-foreground/80">{call.name}</span>
          {summary ? <span className="ml-1 text-muted-foreground">→ {summary}</span> : null}
        </span>
        <ChevronRight
          className={cn("h-3 w-3 transition-transform", open && "rotate-90")}
          strokeWidth={1.75}
        />
      </button>
      {open ? (
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all border-t border-border/40 px-2.5 py-1.5 text-[10.5px] text-muted-foreground">
          {JSON.stringify({ args: call.args, result: call.result }, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

function summarizeToolCall(call: InboxAiToolCall): string {
  const result = call.result as { ok?: boolean; data?: unknown; error?: string } | undefined;
  if (!result) return "";
  if (result.ok === false) return `error: ${result.error ?? "unknown"}`;
  if (call.name === "bulk_triage") {
    const data = result.data as { count?: number } | undefined;
    return `${data?.count ?? 0} threads`;
  }
  if (call.name === "list_top_priorities") {
    const data = result.data as { priorities?: unknown[] } | undefined;
    return `${data?.priorities?.length ?? 0} priorities`;
  }
  if (call.name === "search_threads") {
    const data = result.data as { threads?: unknown[] } | undefined;
    return `${data?.threads?.length ?? 0} matches`;
  }
  if (call.name === "draft_reply") {
    return "draft generated";
  }
  if (call.name === "summarize_thread") {
    return "summary refreshed";
  }
  return "ok";
}
