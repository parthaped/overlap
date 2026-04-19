"use client";

import { CircleDot } from "lucide-react";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/ui-store";

import type { InboxAccount } from "@/components/app/inbox/types";

type AccountFilterProps = {
  accounts: InboxAccount[];
};

export function AccountFilter({ accounts }: AccountFilterProps) {
  const selected = useUIStore((s) => s.selectedAccountId);
  const setSelected = useUIStore((s) => s.setAccount);

  if (accounts.length === 0) return null;

  const options = [{ id: "all", label: "All inboxes", color: "" }, ...accounts.map((a) => ({
    id: a.id,
    label: a.displayName,
    color: a.colorTag,
  }))];

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-border/60 bg-background/40 px-3 py-1.5">
      {options.map((opt) => {
        const active = selected === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setSelected(opt.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
            aria-pressed={active}
          >
            {opt.color ? (
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: opt.color }}
              />
            ) : (
              <CircleDot className="h-3 w-3" strokeWidth={1.5} />
            )}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
