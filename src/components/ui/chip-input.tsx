"use client";

import { X } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";

type ChipInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  validate?: (raw: string) => string | null;
  className?: string;
  ariaLabel?: string;
  suggestions?: string[];
};

export function ChipInput({
  value,
  onChange,
  placeholder,
  validate,
  className,
  ariaLabel,
  suggestions,
}: ChipInputProps) {
  const [draft, setDraft] = useState("");
  const id = useId();

  function commit(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const validated = validate ? validate(trimmed) : trimmed;
    if (!validated) return;
    if (value.includes(validated)) return;
    onChange([...value, validated]);
    setDraft("");
  }

  function remove(item: string) {
    onChange(value.filter((v) => v !== item));
  }

  const filteredSuggestions = (suggestions ?? []).filter(
    (s) => !value.includes(s) && (!draft || s.toLowerCase().includes(draft.toLowerCase())),
  );

  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1.5 focus-within:border-foreground/40"
        aria-label={ariaLabel}
      >
        {value.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[12px] text-foreground"
          >
            {chip}
            <button
              type="button"
              onClick={() => remove(chip)}
              className="rounded-full text-muted-foreground transition-colors hover:text-foreground"
              aria-label={`Remove ${chip}`}
            >
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit(draft);
            } else if (e.key === "Backspace" && !draft && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => commit(draft)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[140px] bg-transparent px-1 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
      {filteredSuggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {filteredSuggestions.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => commit(s)}
              className="rounded-full border border-border/60 bg-card/40 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              + {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
