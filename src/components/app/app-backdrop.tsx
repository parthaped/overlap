"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Subtle ambient background aligned with the marketing landing page. */
export function AppBackdrop() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 min-h-[28rem] overflow-hidden"
      aria-hidden
    >
      <div className="absolute left-1/2 top-[-4rem] h-[28rem] w-[min(100%,44rem)] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/11 via-transparent to-accent/14 blur-3xl" />
      <div className="absolute -left-28 top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(91,187,189,0.14),transparent_68%)] blur-2xl" />
      <div className="absolute -right-20 top-40 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(246,141,79,0.09),transparent_72%)] blur-2xl" />
      {!reduceMotion ? (
        <>
          <motion.div
            className="absolute left-[8%] top-[38%] h-px w-28 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
            animate={{ opacity: [0.25, 0.55, 0.25], scaleX: [0.9, 1, 0.9] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-[12%] top-[22%] h-px w-20 bg-gradient-to-r from-transparent via-foreground/8 to-transparent"
            animate={{ opacity: [0.15, 0.45, 0.15] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      ) : null}
    </div>
  );
}
