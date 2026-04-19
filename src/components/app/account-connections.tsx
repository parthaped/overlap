"use client";

import { ProviderType } from "@prisma/client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useMemo, useState } from "react";

import {
  connectAccount,
  disconnectAccount,
  setPrimaryAccount,
  type AccountActionState,
} from "@/actions/accounts";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const providerOptions: { id: ProviderType; label: string }[] = [
  { id: "GOOGLE", label: "Google" },
  { id: "MICROSOFT", label: "Microsoft" },
  { id: "ICLOUD", label: "iCloud" },
  { id: "IMAP", label: "IMAP" },
  { id: "SMTP", label: "SMTP" },
  { id: "DEMO", label: "Demo" },
];

const initialState: AccountActionState = {};

const panelClass =
  "rounded-2xl border border-border/60 bg-card/55 p-5 sm:p-6";

const ease = [0.22, 1, 0.36, 1] as const;

type AccountRow = {
  id: string;
  providerType: ProviderType;
  providerAccountEmail: string;
  displayName: string;
  colorTag: string;
  isPrimary: boolean;
  syncStatus: string;
};

function oauthFlashMessage(error: string | null, success: string | null) {
  if (success === "google") {
    return { kind: "success" as const, text: "Google account connected. Gmail is authorized for read and send." };
  }
  switch (error) {
    case "google_not_configured":
      return {
        kind: "error" as const,
        text: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (see .env.example).",
      };
    case "google_denied":
      return { kind: "error" as const, text: "Google sign-in was cancelled." };
    case "google_invalid":
      return { kind: "error" as const, text: "This link expired or was invalid. Try connecting again." };
    case "google_token":
      return { kind: "error" as const, text: "Google could not issue tokens. Check client secret and redirect URI in Google Cloud Console." };
    case "google_profile":
      return { kind: "error" as const, text: "Could not read your Google profile. Ensure the userinfo scope is allowed." };
    case "google_already_linked":
      return {
        kind: "error" as const,
        text: "This Google address is already linked to another Overlap user.",
      };
    default:
      return null;
  }
}

export function AccountConnections({
  accounts,
  googleOAuthConfigured,
}: {
  accounts: AccountRow[];
  googleOAuthConfigured: boolean;
}) {
  const [state, formAction, isPending] = useActionState(connectAccount, initialState);
  const [formProvider, setFormProvider] = useState<string>("IMAP");
  const [formMode, setFormMode] = useState<string>("manual");
  const searchParams = useSearchParams();
  const flash = useMemo(
    () => oauthFlashMessage(searchParams.get("error"), searchParams.get("success")),
    [searchParams],
  );

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className={cn(panelClass)}
      >
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Connect account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Link Gmail via OAuth, or add a mailbox manually.
        </p>

        {flash ? (
          <p
            className={cn(
              "mt-3 rounded-lg px-3 py-2 text-[13px]",
              flash.kind === "success"
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-800"
                : "border border-destructive/25 bg-destructive/10 text-destructive",
            )}
          >
            {flash.text}
          </p>
        ) : null}

        <div className="mt-5 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Gmail & Google Workspace
          </p>
          {googleOAuthConfigured ? (
            <Link
              href="/api/integrations/google/start"
              className={cn(
                buttonVariants({ variant: "primary", size: "md" }),
                "h-10 w-full max-w-md justify-center gap-2 rounded-lg sm:w-auto",
              )}
            >
              <GoogleMark className="h-4 w-4" />
              Continue with Google
            </Link>
          ) : (
            <p className="max-w-xl rounded-lg border border-dashed border-border/60 bg-muted/15 px-3 py-2 text-[13px] text-muted-foreground">
              Add <span className="font-mono text-xs">GOOGLE_CLIENT_ID</span> and{" "}
              <span className="font-mono text-xs">GOOGLE_CLIENT_SECRET</span> to your environment, then add the
              redirect URI from <span className="font-mono text-xs">.env.example</span> in Google Cloud Console.
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            Offline access; refreshable tokens. Enable <strong className="font-medium text-foreground">Gmail API</strong> on the same project.
          </p>
        </div>

        <div className="mt-8 border-t border-border/40 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Manual mailbox
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a mailbox without OAuth. Useful for IMAP, internal accounts, or staging.
          </p>
          <form action={formAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="provider" value={formProvider} />
            <input type="hidden" name="mode" value={formMode} />
            <div className="space-y-2">
              <Label htmlFor="provider-trigger">Provider</Label>
              <Select value={formProvider} onValueChange={setFormProvider}>
                <SelectTrigger id="provider-trigger" aria-label="Provider">
                  <SelectValue placeholder="Choose provider" />
                </SelectTrigger>
                <SelectContent>
                  {providerOptions.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mode-trigger">Mode</Label>
              <Select value={formMode} onValueChange={setFormMode}>
                <SelectTrigger id="mode-trigger" aria-label="Connection mode">
                  <SelectValue placeholder="Choose mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="demo">Sample inbox (testing)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                name="displayName"
                placeholder="Work Mail"
                required
                minLength={2}
                className="h-10 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Account email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                required
                className="h-10 rounded-lg"
              />
            </div>
            <label className="col-span-full flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                name="makePrimary"
                defaultChecked
                className="h-4 w-4 rounded border-border/60"
              />
              Set as primary account
            </label>
            {state.error ? <p className="col-span-full text-sm text-destructive">{state.error}</p> : null}
            {state.success ? <p className="col-span-full text-sm text-emerald-600">{state.success}</p> : null}
            <Button
              disabled={isPending}
              variant="secondary"
              className="col-span-full transition-all duration-300 hover:-translate-y-0.5 sm:col-span-1"
            >
              {isPending ? "Connecting…" : "Add mailbox"}
            </Button>
          </form>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.04, ease }}
        className={cn(panelClass)}
      >
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Connected providers</h2>
        <div className="mt-4 space-y-2">
          {accounts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/55 bg-muted/15 p-4 text-sm text-muted-foreground">
              No accounts connected yet.
            </p>
          ) : (
            accounts.map((account, index) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03, ease }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/55 bg-background/70 p-3 transition-colors hover:border-border"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: account.colorTag || "#5bbabd" }}
                    />
                    <p className="text-sm font-medium text-foreground">{account.displayName}</p>
                    {account.isPrimary ? (
                      <span className="rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background">
                        Primary
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                    {account.providerType} · {account.providerAccountEmail} · {account.syncStatus}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!account.isPrimary ? (
                    <form action={setPrimaryAccount}>
                      <input type="hidden" name="accountId" value={account.id} />
                      <Button variant="outline" size="sm">
                        Set primary
                      </Button>
                    </form>
                  ) : null}
                  <form action={disconnectAccount}>
                    <input type="hidden" name="accountId" value={account.id} />
                    <Button variant="ghost" size="sm">
                      Disconnect
                    </Button>
                  </form>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
