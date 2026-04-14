"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-32 lg:px-8 lg:pb-32 lg:pt-40">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-24 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/15 via-transparent to-accent/25 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(91,187,189,0.18),transparent_65%)] blur-2xl" />
      </div>

      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.05, ease }}
          className="mb-6 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground"
        >
          Calm email, unified intelligence
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.12, ease }}
          className="font-serif text-4xl leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]"
        >
          One inbox that feels as considered as the rest of your day.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.2, ease }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
        >
          {APP_NAME} brings providers together with gentle AI prioritization, thoughtful drafting, and a
          layout that stays out of your way—so you can focus on what actually needs you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.28, ease }}
          className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
        >
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "min-w-[200px]")}>
            Create your workspace
          </Link>
          <Link
            href="/signin"
            className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "min-w-[200px]")}
          >
            Sign in
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.4, ease }}
          className="mt-8 text-sm text-muted-foreground"
        >
          No clutter. No noise. Just signal—presented with care.
        </motion.p>
      </div>
    </section>
  );
}
