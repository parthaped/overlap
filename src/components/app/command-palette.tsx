"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArchiveX,
  ArrowRight,
  Inbox,
  Mail,
  MailOpen,
  Megaphone,
  MessagesSquare,
  Newspaper,
  Search,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { bulkTriage } from "@/actions/ai";
import { askInboxAi } from "@/actions/inbox-ai";
import { cn } from "@/lib/utils";
import { useUIStore, type BucketId } from "@/lib/ui-store";

type CommandGroup = {
  id: string;
  label: string;
  items: CommandItem[];
};

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  run: () => void | Promise<void>;
};

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setBucket = useUIStore((s) => s.setBucket);
  const setOverlapAiOpen = useUIStore((s) => s.setOverlapAiOpen);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setQuery("");
    setActiveIndex(0);
    /* eslint-enable react-hooks/set-state-in-effect */
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const groups = useMemo<CommandGroup[]>(() => {
    const goto = (b: BucketId) => () => {
      setBucket(b);
      setOpen(false);
      router.push("/inbox");
    };
    const askAI = (q: string) => async () => {
      setOpen(false);
      setOverlapAiOpen(true);
      toast.promise(askInboxAi({ question: q }), {
        loading: "Thinking…",
        success: "Done.",
        error: "Overlap AI failed.",
      });
    };

    return [
      {
        id: "navigate",
        label: "Navigate",
        items: [
          { id: "n-focus", label: "Focus", hint: "g f", icon: Star, run: goto("FOCUS") },
          { id: "n-needs", label: "Needs reply", hint: "g r", icon: Mail, run: goto("NEEDS_REPLY") },
          {
            id: "n-waiting",
            label: "Waiting on",
            hint: "g w",
            icon: MailOpen,
            run: goto("WAITING_ON"),
          },
          { id: "n-updates", label: "Updates", hint: "g u", icon: Inbox, run: goto("UPDATES") },
          {
            id: "n-promos",
            label: "Promotions",
            hint: "g p",
            icon: Megaphone,
            run: goto("PROMOTIONS"),
          },
          { id: "n-social", label: "Social", hint: "g s", icon: Users, run: goto("SOCIAL") },
          {
            id: "n-news",
            label: "Newsletters",
            hint: "g n",
            icon: Newspaper,
            run: goto("NEWSLETTERS"),
          },
        ],
      },
      {
        id: "ai",
        label: "Overlap AI",
        items: [
          {
            id: "ai-brief",
            label: "What's important today?",
            hint: "Daily brief",
            icon: Sparkles,
            run: askAI("What's important today?"),
          },
          {
            id: "ai-vips",
            label: "Draft replies for my VIPs",
            icon: Sparkles,
            run: askAI("Draft replies for the threads from my VIPs."),
          },
          {
            id: "ai-waiting",
            label: "Who am I waiting on?",
            icon: MessagesSquare,
            run: askAI("Who am I waiting on?"),
          },
        ],
      },
      {
        id: "triage",
        label: "Triage",
        items: [
          {
            id: "t-promos",
            label: "Archive all promotions",
            icon: ArchiveX,
            run: async () => {
              setOpen(false);
              const r = await bulkTriage({ bucket: "PROMOTIONS", action: "archive" });
              if (r.ok) toast.success(`Archived ${r.data.count} promotional threads.`);
              else toast.error(r.error);
            },
          },
          {
            id: "t-news",
            label: "Archive all newsletters",
            icon: ArchiveX,
            run: async () => {
              setOpen(false);
              const r = await bulkTriage({ bucket: "NEWSLETTERS", action: "archive" });
              if (r.ok) toast.success(`Archived ${r.data.count} newsletters.`);
              else toast.error(r.error);
            },
          },
          {
            id: "t-social",
            label: "Archive all social updates",
            icon: ArchiveX,
            run: async () => {
              setOpen(false);
              const r = await bulkTriage({ bucket: "SOCIAL", action: "archive" });
              if (r.ok) toast.success(`Archived ${r.data.count} social threads.`);
              else toast.error(r.error);
            },
          },
        ],
      },
    ];
  }, [router, setBucket, setOverlapAiOpen, setOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => i.label.toLowerCase().includes(q)),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);

  const flat = useMemo(() => filtered.flatMap((g) => g.items), [filtered]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIndex(0);
  }, [query]);

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[activeIndex];
      if (item) {
        void item.run();
      } else if (query.trim().length > 0) {
        // Treat as an Overlap AI question.
        const q = query.trim();
        setOpen(false);
        setOverlapAiOpen(true);
        toast.promise(askInboxAi({ question: q }), {
          loading: "Asking Overlap…",
          success: "Done.",
          error: "Overlap AI failed.",
        });
      }
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[55] flex items-start justify-center bg-black/30 px-4 pt-[16vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -4, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-background shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKey}
                placeholder="Search, jump, or ask Overlap…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <kbd className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                Esc
              </kbd>
            </div>

            <div className="max-h-[50vh] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const q = query.trim();
                    if (!q) return;
                    setOpen(false);
                    setOverlapAiOpen(true);
                    toast.promise(askInboxAi({ question: q }), {
                      loading: "Asking Overlap…",
                      success: "Done.",
                      error: "Overlap AI failed.",
                    });
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted/40"
                >
                  <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  <span className="flex-1">
                    Ask Overlap: <span className="font-medium">{query}</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ) : (
                filtered.map((group) => (
                  <div key={group.id} className="px-2 pb-2">
                    <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {group.label}
                    </p>
                    {group.items.map((item) => {
                      const flatIndex = flat.indexOf(item);
                      const active = flatIndex === activeIndex;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          onClick={() => item.run()}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            active ? "bg-muted/70 text-foreground" : "text-foreground/85 hover:bg-muted/40",
                          )}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                          <span className="flex-1">{item.label}</span>
                          {item.hint ? (
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {item.hint}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
