"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Brain, Inbox, Layers, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const items = [
  {
    title: "Quiet prioritization",
    body: "Threads are scored with context you control—so the right conversations rise without shouting.",
    icon: Brain,
  },
  {
    title: "One composed surface",
    body: "A single calm canvas for multiple accounts, tuned for long sessions and zero visual noise.",
    icon: Inbox,
  },
  {
    title: "Drafts that sound like you",
    body: "Suggestions respect your tone and priorities, keeping replies fast without feeling generic.",
    icon: Sparkles,
  },
];

export function FeatureGrid({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <section className={cn("relative overflow-hidden border-t border-border/40 bg-card/25 px-6 py-24 lg:px-8", className)}>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(91,187,189,0.06),transparent)]" />

      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.75, ease }}
          className="mb-14 flex flex-col gap-4 text-center sm:mx-auto sm:max-w-2xl"
        >
          <div className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-border/50 bg-background/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <Layers className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} aria-hidden />
            Crafted workflow
          </div>
          <h2 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
            Everything you need—nothing you don’t.
          </h2>
          <p className="text-lg text-muted-foreground">
            A restrained toolkit for people who treat email as work worth doing well.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {items.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.75, delay: index * 0.09, ease }}
              className="group relative overflow-hidden rounded-[1.85rem] border border-border/50 bg-background/75 p-8 shadow-card ring-1 ring-border/25 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-primary/20 hover:shadow-soft"
            >
              {!reduceMotion ? (
                <motion.div
                  className="pointer-events-none absolute -inset-px rounded-[1.85rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(91,187,189,0.12) 0%, transparent 42%, rgba(246,141,79,0.08) 100%)",
                  }}
                />
              ) : null}
              <div className="relative">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/80 text-foreground ring-1 ring-border/45 transition-transform duration-500 group-hover:scale-[1.04]">
                  <item.icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="font-serif text-xl tracking-tight text-foreground">{item.title}</h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
