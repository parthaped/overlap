"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

type Step = {
  label: string;
  text: string;
  mono?: boolean;
  highlight?: boolean;
};

const scenes: { id: string; steps: Step[] }[] = [
  {
    id: "compose",
    steps: [
      { label: "To", text: "sarah.chen@meridian.co", mono: true },
      { label: "Subject", text: "Re: Q2 narrative — alignment" },
      {
        label: "Message",
        text: "Thanks for the tight turnaround. Here’s the revised headline and the paragraph we should anchor the board read on.",
      },
    ],
  },
  {
    id: "ai",
    steps: [
      {
        label: "Suggested reply",
        text: "Hi Sarah — confirming the headline reads cleanly and matches last week’s deck. I’ve tightened the KPI line so it mirrors the appendix without repeating the chart.",
        highlight: true,
      },
    ],
  },
];

function Cursor({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <motion.span
      animate={{ opacity: [1, 0.2, 1] }}
      transition={{ repeat: Infinity, duration: 0.8 }}
      className="ml-0.5 inline-block text-primary"
      aria-hidden
    >
      |
    </motion.span>
  );
}

export function HeroEmailSimulation() {
  const reduceMotion = useReducedMotion();
  const [sceneIdx, setSceneIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const scene = scenes[sceneIdx % scenes.length];
  const step = scene.steps[stepIdx] ?? scene.steps[0];
  const full = step?.text ?? "";

  useEffect(() => {
    if (reduceMotion) return;
    if (!full) return;
    if (charCount >= full.length) {
      const pause = window.setTimeout(() => {
        if (stepIdx < scene.steps.length - 1) {
          setStepIdx((s) => s + 1);
          setCharCount(0);
        } else {
          setSceneIdx((s) => (s + 1) % scenes.length);
          setStepIdx(0);
          setCharCount(0);
        }
      }, 900);
      return () => window.clearTimeout(pause);
    }
    const tick = window.setTimeout(() => setCharCount((c) => c + 1), 36);
    return () => window.clearTimeout(tick);
  }, [charCount, full, reduceMotion, scene.steps.length, stepIdx]);

  const displayed = reduceMotion ? full : full.slice(0, charCount);
  const isTyping = !reduceMotion && charCount < full.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, delay: 0.35, ease }}
      className="relative mx-auto w-full max-w-xl lg:mx-0"
    >
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(ellipse_at_30%_20%,rgba(91,187,189,0.22),transparent_55%),radial-gradient(ellipse_at_70%_80%,rgba(246,141,79,0.12),transparent_50%)] blur-2xl" />

      <motion.div
        animate={reduceMotion ? {} : { y: [0, -5, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/90 shadow-soft ring-1 ring-border/30 backdrop-blur-sm"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />

        <div className="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500/90 shadow-[0_0_12px_rgba(52,211,153,0.45)]" />
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {scene.id === "ai" ? "AI assist" : "Compose"}
            </span>
          </div>
          <motion.div
            className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary"
            animate={reduceMotion ? {} : { opacity: [0.72, 1, 0.72] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            Live assist
          </motion.div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {scene.id === "compose" ? (
            <>
              {scene.steps.slice(0, stepIdx).map((s) => (
                <div key={s.label} className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {s.label}
                  </p>
                  <p
                    className={
                      s.mono
                        ? "font-mono text-[13px] text-foreground/90"
                        : "text-[13px] font-medium leading-snug text-foreground"
                    }
                  >
                    {s.text}
                  </p>
                </div>
              ))}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {step.label}
                </p>
                <p
                  className={
                    step.mono
                      ? "font-mono text-[13px] text-foreground/90"
                      : "text-[13px] font-medium leading-snug text-foreground"
                  }
                >
                  {displayed}
                  <Cursor active={isTyping} />
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {step.label}
              </p>
              <motion.div
                layout
                className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.08] to-transparent p-4"
              >
                {!reduceMotion ? (
                  <motion.div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-primary/12 to-transparent"
                    animate={{ x: ["-100%", "120%"] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                  />
                ) : null}
                <p className="relative text-[13px] leading-relaxed text-foreground">
                  {displayed}
                  <Cursor active={isTyping} />
                </p>
              </motion.div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/40 bg-muted/25 px-5 py-3">
          <span className="text-[11px] text-muted-foreground">Unified send · same thread</span>
          <motion.span
            className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground"
            whileHover={reduceMotion ? {} : { x: 2 }}
          >
            Preview
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
}
