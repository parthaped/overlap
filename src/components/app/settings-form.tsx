"use client";

import { motion } from "framer-motion";
import { Shield, Sparkles, VolumeX } from "lucide-react";
import { useActionState, useState } from "react";

import { updateUserSettings, type SettingsState } from "@/actions/settings";
import { INBOX_STYLE_OPTIONS, TONE_OPTIONS, PRIORITIZE_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ChipInput } from "@/components/ui/chip-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const initialState: SettingsState = {};

const cardClass =
  "rounded-2xl border border-border/60 bg-card/60 p-5 sm:p-6";

const ease = [0.22, 1, 0.36, 1] as const;

type SettingsFormProps = {
  preferredTone: string;
  inboxStyle: "MINIMALIST" | "BALANCED" | "DETAILED";
  vipEmails: string[];
  vipDomains: string[];
  priorityKeywords: string[];
  mutedDomains: string[];
  mutedKeywords: string[];
  suggestedVipEmails?: string[];
  suggestedMutedDomains?: string[];
};

function emailValidator(raw: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(raw) ? raw.toLowerCase() : null;
}

function domainValidator(raw: string) {
  const cleaned = raw.replace(/^https?:\/\//, "").replace(/\/.*/, "").toLowerCase();
  return /\./.test(cleaned) ? cleaned : null;
}

export function SettingsForm({
  preferredTone,
  inboxStyle,
  vipEmails,
  vipDomains,
  priorityKeywords,
  mutedDomains,
  mutedKeywords,
  suggestedVipEmails = [],
  suggestedMutedDomains = [],
}: SettingsFormProps) {
  const [state, action, pending] = useActionState(updateUserSettings, initialState);
  const [inboxStyleValue, setInboxStyleValue] = useState(inboxStyle);
  const [vipEmailsValue, setVipEmails] = useState(vipEmails);
  const [vipDomainsValue, setVipDomains] = useState(vipDomains);
  const [priorityKeywordsValue, setPriorityKeywords] = useState(priorityKeywords);
  const [mutedDomainsValue, setMutedDomains] = useState(mutedDomains);
  const [mutedKeywordsValue, setMutedKeywords] = useState(mutedKeywords);

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      action={action}
      className="space-y-5"
    >
      {/* Tone + style */}
      <div className={cn(cardClass)}>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Workspace
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          How Overlap drafts replies and lays out the inbox.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="preferredTone">Preferred tone</Label>
            <Input
              id="preferredTone"
              name="preferredTone"
              defaultValue={preferredTone}
              className="h-10 rounded-lg"
            />
            <div className="flex flex-wrap gap-1 pt-1">
              {TONE_OPTIONS.map((tone) => (
                <span
                  key={tone.id}
                  className="rounded-full bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground"
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
        </div>
      </div>

      {/* Priority signals */}
      <div className={cn(cardClass)}>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Shield className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Priority signals
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              VIP senders and keywords that always reach Focus, regardless of content.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label>VIP emails</Label>
            <input
              type="hidden"
              name="vipEmails"
              value={JSON.stringify(vipEmailsValue)}
            />
            <ChipInput
              value={vipEmailsValue}
              onChange={setVipEmails}
              placeholder="ceo@company.com"
              validate={emailValidator}
              suggestions={suggestedVipEmails}
              ariaLabel="VIP emails"
            />
          </div>

          <div className="space-y-1.5">
            <Label>VIP domains</Label>
            <input
              type="hidden"
              name="vipDomains"
              value={JSON.stringify(vipDomainsValue)}
            />
            <ChipInput
              value={vipDomainsValue}
              onChange={setVipDomains}
              placeholder="company.com"
              validate={domainValidator}
              ariaLabel="VIP domains"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Priority keywords</Label>
            <input
              type="hidden"
              name="priorityKeywords"
              value={JSON.stringify(priorityKeywordsValue)}
            />
            <ChipInput
              value={priorityKeywordsValue}
              onChange={setPriorityKeywords}
              placeholder="contract, board meeting, payroll"
              suggestions={[...PRIORITIZE_OPTIONS]}
              ariaLabel="Priority keywords"
            />
          </div>
        </div>
      </div>

      {/* Mute & lower-priority signals */}
      <div className={cn(cardClass)}>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-muted/70 text-foreground/70">
            <VolumeX className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Quiet noise
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Domains and keywords routed straight to Promotions so they never interrupt.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Muted domains</Label>
            <input
              type="hidden"
              name="mutedDomains"
              value={JSON.stringify(mutedDomainsValue)}
            />
            <ChipInput
              value={mutedDomainsValue}
              onChange={setMutedDomains}
              placeholder="newsletter.example.com"
              validate={domainValidator}
              suggestions={suggestedMutedDomains}
              ariaLabel="Muted domains"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Muted keywords</Label>
            <input
              type="hidden"
              name="mutedKeywords"
              value={JSON.stringify(mutedKeywordsValue)}
            />
            <ChipInput
              value={mutedKeywordsValue}
              onChange={setMutedKeywords}
              placeholder="webinar, trial, expires"
              ariaLabel="Muted keywords"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p
          className={cn(
            "text-sm",
            state.error
              ? "text-destructive"
              : state.success
                ? "text-emerald-600"
                : "text-muted-foreground",
          )}
        >
          {state.error ?? state.success ?? "Changes will reclassify your inbox in the background."}
        </p>
        <Button disabled={pending} className="gap-2">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </motion.form>
  );
}
