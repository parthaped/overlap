"use client";

import { useActionState } from "react";

import { updateUserSettings, type SettingsState } from "@/actions/settings";
import { INBOX_STYLE_OPTIONS, TONE_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SettingsState = {};

export function SettingsForm({
  preferredTone,
  inboxStyle,
}: {
  preferredTone: string;
  inboxStyle: "MINIMALIST" | "BALANCED" | "DETAILED";
}) {
  const [state, action, pending] = useActionState(updateUserSettings, initialState);

  return (
    <form action={action} className="space-y-5 rounded-[1.5rem] border border-border/60 bg-card/70 p-6 shadow-card">
      <div>
        <h2 className="font-serif text-2xl tracking-tight text-foreground">Workspace settings</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Customize tone and inbox density to match how you work.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferredTone">Preferred tone</Label>
        <Input id="preferredTone" name="preferredTone" defaultValue={preferredTone} />
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map((tone) => (
            <span key={tone.id} className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
              {tone.label}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inboxStyle">Inbox style</Label>
        <select
          id="inboxStyle"
          name="inboxStyle"
          defaultValue={inboxStyle}
          className="h-12 w-full rounded-2xl border border-border/80 bg-card/80 px-4 text-sm"
        >
          {INBOX_STYLE_OPTIONS.map((style) => (
            <option key={style.id} value={style.id}>
              {style.label}
            </option>
          ))}
        </select>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}

      <Button disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
    </form>
  );
}
