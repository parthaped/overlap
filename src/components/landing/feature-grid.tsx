"use client";

import { motion } from "framer-motion";
import { Brain, Inbox, Sparkles } from "lucide-react";

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
    body: "A single calm canvas for multiple accounts, with spacing and rhythm tuned for long sessions.",
    icon: Inbox,
  },
  {
    title: "Drafts that sound like you",
    body: "Suggestions respect your tone and calendar hints, keeping replies fast without feeling generic.",
    icon: Sparkles,
  },
];

export function FeatureGrid({ className }: { className?: string }) {
  return (
    <section className={cn("border-t border-border/50 bg-card/30 px-6 py-24 lg:px-8", className)}>
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-3">
        {items.map((item, index) => (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.75, delay: index * 0.08, ease }}
            className="group relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-background/80 p-8 shadow-card transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-soft"
          >
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/80 text-foreground ring-1 ring-border/50 transition-transform duration-500 group-hover:scale-[1.03]">
              <item.icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
            </div>
            <h3 className="font-serif text-xl tracking-tight text-foreground">{item.title}</h3>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">{item.body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
