"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/ui-store";

type Handler = () => void;

export type Shortcuts = {
  onNextThread?: Handler;
  onPrevThread?: Handler;
  onOpenThread?: Handler;
  onArchive?: Handler;
  onReply?: Handler;
  onSnooze?: Handler;
  onDelete?: Handler;
  onAddVip?: Handler;
  onGoFocus?: Handler;
  onGoPromos?: Handler;
  onGoSocial?: Handler;
  onGoUpdates?: Handler;
  onGoNewsletters?: Handler;
  onGoNeedsReply?: Handler;
  onGoWaiting?: Handler;
};

/**
 * Global keyboard navigation. Pages can supply handlers for movement / actions;
 * the global shortcuts (?, Cmd-K, copilot) live here regardless.
 */
export function useGlobalShortcuts(handlers: Shortcuts = {}) {
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const toggleCopilot = useUIStore((s) => s.toggleCopilot);
  const setShortcutsOpen = useUIStore((s) => s.setShortcutsOpen);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setCopilotOpen = useUIStore((s) => s.setCopilotOpen);

  useEffect(() => {
    let pendingG = false;
    let gTimer: ReturnType<typeof setTimeout> | null = null;

    function clearG() {
      pendingG = false;
      if (gTimer) {
        clearTimeout(gTimer);
        gTimer = null;
      }
    }

    function handler(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      const meta = event.metaKey || event.ctrlKey;

      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggleCommandPalette();
        return;
      }
      if (meta && event.key.toLowerCase() === "j" && event.shiftKey) {
        event.preventDefault();
        toggleCopilot();
        return;
      }
      if (event.key === "Escape") {
        setCommandPaletteOpen(false);
        setShortcutsOpen(false);
        return;
      }

      if (isTyping) return;

      if (event.key === "?") {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      if (event.key === "/") {
        event.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }
      if (event.key.toLowerCase() === "c" && !meta) {
        event.preventDefault();
        setCopilotOpen(true);
        return;
      }

      // Two-key g-prefixed jumps.
      if (event.key.toLowerCase() === "g") {
        pendingG = true;
        if (gTimer) clearTimeout(gTimer);
        gTimer = setTimeout(clearG, 1200);
        return;
      }
      if (pendingG) {
        const map: Record<string, Handler | undefined> = {
          i: handlers.onGoFocus,
          f: handlers.onGoFocus,
          r: handlers.onGoNeedsReply,
          w: handlers.onGoWaiting,
          p: handlers.onGoPromos,
          s: handlers.onGoSocial,
          u: handlers.onGoUpdates,
          n: handlers.onGoNewsletters,
        };
        const fn = map[event.key.toLowerCase()];
        clearG();
        if (fn) {
          event.preventDefault();
          fn();
          return;
        }
      }

      // Single-key actions.
      if (event.key === "j") {
        handlers.onNextThread?.();
        event.preventDefault();
      } else if (event.key === "k") {
        handlers.onPrevThread?.();
        event.preventDefault();
      } else if (event.key === "Enter" || event.key === "o") {
        handlers.onOpenThread?.();
      } else if (event.key.toLowerCase() === "e") {
        handlers.onArchive?.();
      } else if (event.key.toLowerCase() === "r") {
        handlers.onReply?.();
      } else if (event.key.toLowerCase() === "s") {
        handlers.onSnooze?.();
      } else if (event.key === "#") {
        handlers.onDelete?.();
      } else if (event.key.toLowerCase() === "v") {
        handlers.onAddVip?.();
      }
    }

    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      if (gTimer) clearTimeout(gTimer);
    };
  }, [
    handlers,
    setCommandPaletteOpen,
    setCopilotOpen,
    setShortcutsOpen,
    toggleCommandPalette,
    toggleCopilot,
  ]);
}

const SHORTCUTS = [
  { keys: ["⌘", "K"], label: "Open command palette" },
  { keys: ["⌘", "⇧", "J"], label: "Toggle AI copilot" },
  { keys: ["?"], label: "Show this help" },
  { keys: ["j"], label: "Next thread" },
  { keys: ["k"], label: "Previous thread" },
  { keys: ["o", "↵"], label: "Open thread" },
  { keys: ["e"], label: "Archive thread" },
  { keys: ["r"], label: "Generate AI reply" },
  { keys: ["s"], label: "Snooze 4h" },
  { keys: ["v"], label: "Mark sender VIP" },
  { keys: ["c"], label: "Open copilot" },
  { keys: ["g", "f"], label: "Jump to Focus" },
  { keys: ["g", "r"], label: "Jump to Needs reply" },
  { keys: ["g", "w"], label: "Jump to Waiting on" },
  { keys: ["g", "p"], label: "Jump to Promotions" },
  { keys: ["g", "u"], label: "Jump to Updates" },
  { keys: ["g", "s"], label: "Jump to Social" },
  { keys: ["g", "n"], label: "Jump to Newsletters" },
];

export function ShortcutsModal() {
  const open = useUIStore((s) => s.shortcutsOpen);
  const setOpen = useUIStore((s) => s.setShortcutsOpen);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-[min(560px,92vw)] rounded-2xl border border-border bg-background p-6 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Keyboard shortcuts
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Move through your inbox without leaving the keyboard.
            </p>
            <div className="mt-5 grid gap-1.5">
              {SHORTCUTS.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm hover:bg-muted/40"
                >
                  <span className="text-foreground/90">{s.label}</span>
                  <span className="flex items-center gap-1">
                    {s.keys.map((k, i) => (
                      <kbd
                        key={`${s.label}-${k}-${i}`}
                        className={cn(
                          "inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-muted/40 px-1.5 text-[11px] font-mono text-foreground",
                        )}
                      >
                        {k}
                      </kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
