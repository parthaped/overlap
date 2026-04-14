"use client";

import { motion } from "framer-motion";
import { useActionState, useState } from "react";

import { updateUserSettings, type SettingsState } from "@/actions/settings";
import { INBOX_STYLE_OPTIONS, TONE_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const initialState: SettingsState = {};

const panelClass =
  "relative overflow-hidden rounded-[1.85rem] border border-border/50 bg-card/88 shadow-soft ring-1 ring-border/30 backdrop-blur-[2px]";

const ease = [0.22, 1, 0.36, 1] as const;

export function SettingsForm({
  preferredTone,
  inboxStyle,
}: {
  preferredTone: string;
  inboxStyle: "MINIMALIST" | "BALANCED" | "DETAILED";
}) {
  const [state, action, pending] = useActionState(updateUserSettings, initialState);
  const [inboxStyleValue, setInboxStyleValue] = useState(inboxStyle);

  return (
    <motion.form
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      action={action}
      className={cn(panelClass, "space-y-6 p-6 sm:p-8")}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/28 to-transparent" />
      <div>
        <h2 className="font-serif text-2xl tracking-tight text-foreground sm:text-[1.65rem]">Workspace settings</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Customize tone and inbox density to match how you work.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferredTone">Preferred tone</Label>
        <Input
          id="preferredTone"
          name="preferredTone"
          defaultValue={preferredTone}
          className="rounded-2xl border-border/60 bg-background/80 ring-1 ring-border/25"
        />
        <div className="flex flex-wrap gap-2 pt-1">
          {TONE_OPTIONS.map((tone) => (
            <span
              key={tone.id}
              className="rounded-full bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground ring-1 ring-border/30"
            >
              {tone.label}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <input type="hidden" name="inboxStyle" value={inboxStyleValue} />
        <Label htmlFor="inbox-style-trigger">Inbox style</Label>
        <Select
          value={inboxStyleValue}
          onValueChange={(v) =>
            setInboxStyleValue(v as "MINIMALIST" | "BALANCED" | "DETAILED")
          }
        >
          <SelectTrigger id="inbox-style-trigger" aria-label="Inbox style">
            <SelectValue placeholder="Choose layout density" />
          </SelectTrigger>
          <SelectContent>
            {INBOX_STYLE_OPTIONS.map((style) => (
              <SelectItem key={style.id} value={style.id}>
                {style.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}

      <Button disabled={pending} className="transition-all duration-300 hover:-translate-y-0.5">
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </motion.form>
  );
}
