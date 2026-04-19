"use client";

import { motion } from "framer-motion";
import {
  Inbox,
  Mail,
  MailOpen,
  Megaphone,
  Newspaper,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useUIStore, type BucketId } from "@/lib/ui-store";

import type { BucketCounts } from "@/components/app/inbox/types";

type BucketDef = {
  id: BucketId;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

const BUCKETS: BucketDef[] = [
  { id: "FOCUS", label: "Focus", icon: Sparkles },
  { id: "NEEDS_REPLY", label: "Needs reply", icon: Mail },
  { id: "WAITING_ON", label: "Waiting on", icon: MailOpen },
  { id: "UPDATES", label: "Updates", icon: Inbox },
  { id: "PROMOTIONS", label: "Promotions", icon: Megaphone },
  { id: "SOCIAL", label: "Social", icon: Users },
  { id: "NEWSLETTERS", label: "Newsletters", icon: Newspaper },
  { id: "STARRED", label: "Starred", icon: Star },
  { id: "ALL", label: "All", icon: Inbox },
];

type BucketTabsProps = {
  counts: BucketCounts;
};

export function BucketTabs({ counts }: BucketTabsProps) {
  const current = useUIStore((s) => s.currentBucket);
  const setBucket = useUIStore((s) => s.setBucket);

  return (
    <div className="border-b border-border/60 bg-background/60">
      <div className="flex gap-0.5 overflow-x-auto px-2 py-1.5">
        {BUCKETS.map((b) => {
          const Icon = b.icon;
          const active = current === b.id;
          const count = counts[b.id];
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setBucket(b.id)}
              className={cn(
                "relative inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={active}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>{b.label}</span>
              {typeof count === "number" && count > 0 ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[10px] tabular-nums",
                    active
                      ? "bg-foreground text-background"
                      : "bg-muted/70 text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              ) : null}
              {active ? (
                <motion.span
                  layoutId="bucket-active-pill"
                  className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-foreground"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
