"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { HeroEmailSimulation } from "@/components/landing/hero-email-simulation";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-28 lg:px-8 lg:pb-28 lg:pt-36">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-20 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/12 via-transparent to-accent/20 blur-3xl" />
        <div className="absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(91,187,189,0.16),transparent_68%)] blur-2xl" />
        <div className="absolute -right-32 top-1/3 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(246,141,79,0.1),transparent_70%)] blur-2xl" />
        <motion.div
          className="absolute left-[12%] top-[42%] h-px w-32 bg-gradient-to-r from-transparent via-primary/25 to-transparent"
          animate={{ opacity: [0.3, 0.7, 0.3], scaleX: [0.85, 1, 0.85] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[18%] top-[28%] h-px w-24 bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
          animate={{ opacity: [0.2, 0.55, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-16">
        <div className="flex flex-col text-center lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.05, ease }}
            className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground"
          >
            Calm email, unified intelligence
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.1, ease }}
            className="font-serif text-4xl leading-[1.06] tracking-tight text-foreground sm:text-5xl lg:text-[3.35rem]"
          >
            One inbox as considered as the rest of your day.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.18, ease }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl lg:mx-0 lg:max-w-none"
          >
            {APP_NAME} unifies providers with quiet AI prioritization, drafting that matches your voice, and a
            layout that stays out of your way—so attention goes where it matters.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.26, ease }}
            className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "min-w-[200px] justify-center")}>
              Create your workspace
            </Link>
            <Link
              href="/signin"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "min-w-[200px] justify-center",
              )}
            >
              Sign in
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.38, ease }}
            className="mt-8 text-sm text-muted-foreground"
          >
            No clutter. No noise. Just signal—presented with care.
          </motion.p>
        </div>

        <HeroEmailSimulation />
      </div>
    </section>
  );
}
