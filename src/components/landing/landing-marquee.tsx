"use client";

import { motion, useReducedMotion } from "framer-motion";

const phrases = [
  "Prioritize",
  "Draft with context",
  "Sort by intent",
  "Send with confidence",
  "Stay in one surface",
];

export function LandingMarquee() {
  const reduceMotion = useReducedMotion();
  const sequence = [...phrases, ...phrases];

  return (
    <div className="relative overflow-hidden border-y border-border/40 bg-muted/15 py-3.5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background to-transparent" />
      <motion.div
        className="flex w-max gap-10 px-6"
        animate={reduceMotion ? {} : { x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {sequence.map((text, i) => (
          <span
            key={`${text}-${i}`}
            className="flex shrink-0 items-center gap-10 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
          >
            <span>{text}</span>
            <span className="h-1 w-1 rounded-full bg-primary/40" aria-hidden />
          </span>
        ))}
      </motion.div>
    </div>
  );
}
