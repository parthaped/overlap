"use client";

import { ProviderType } from "@prisma/client";
import { useActionState } from "react";

import {
  connectAccount,
  disconnectAccount,
  setPrimaryAccount,
  type AccountActionState,
} from "@/actions/accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const providerOptions: { id: ProviderType; label: string }[] = [
  { id: "GOOGLE", label: "Google" },
  { id: "MICROSOFT", label: "Microsoft" },
  { id: "ICLOUD", label: "iCloud" },
  { id: "IMAP", label: "IMAP" },
  { id: "SMTP", label: "SMTP" },
  { id: "DEMO", label: "Demo" },
];

const initialState: AccountActionState = {};

type AccountRow = {
  id: string;
  providerType: ProviderType;
  providerAccountEmail: string;
  displayName: string;
  colorTag: string;
  isPrimary: boolean;
  syncStatus: string;
};

export function AccountConnections({ accounts }: { accounts: AccountRow[] }) {
  const [state, formAction, isPending] = useActionState(connectAccount, initialState);

  return (
    <div className="space-y-8">
      <div className="rounded-[1.5rem] border border-border/60 bg-card/70 p-6 shadow-card">
        <h2 className="font-serif text-2xl tracking-tight text-foreground">Connect account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Add providers into one workspace. Use Demo mode to seed example threads instantly.
        </p>
        {/*
          Future OAuth (not wired): add buttons that start NextAuth or a dedicated OAuth route.
          Env placeholders — GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
          MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID (see .env.example).
          Example redirect URIs:
          - ${NEXTAUTH_URL}/api/auth/callback/google
          - ${NEXTAUTH_URL}/api/auth/callback/azure-ad
        */}
        <form action={formAction} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <select
              id="provider"
              name="provider"
              className="h-12 w-full rounded-2xl border border-border/80 bg-card/80 px-4 text-sm"
              defaultValue="GOOGLE"
            >
              {providerOptions.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mode">Mode</Label>
            <select
              id="mode"
              name="mode"
              className="h-12 w-full rounded-2xl border border-border/80 bg-card/80 px-4 text-sm"
              defaultValue="demo"
            >
              <option value="demo">Demo seeded inbox</option>
              <option value="manual">Manual (placeholder)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" name="displayName" placeholder="Work Mail" required minLength={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Account email</Label>
            <Input id="email" name="email" type="email" placeholder="you@company.com" required />
          </div>
          <label className="col-span-full flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" name="makePrimary" defaultChecked className="h-4 w-4 rounded" />
            Set as primary account
          </label>
          {state.error ? <p className="col-span-full text-sm text-destructive">{state.error}</p> : null}
          {state.success ? <p className="col-span-full text-sm text-emerald-600">{state.success}</p> : null}
          <Button disabled={isPending} className="col-span-full sm:col-span-1">
            {isPending ? "Connecting…" : "Connect account"}
          </Button>
        </form>
      </div>

      <div className="rounded-[1.5rem] border border-border/60 bg-card/70 p-6 shadow-card">
        <h2 className="font-serif text-2xl tracking-tight text-foreground">Connected providers</h2>
        <div className="mt-4 space-y-3">
          {accounts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
              No accounts connected yet.
            </p>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/70 p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: account.colorTag || "#5bbabd" }}
                    />
                    <p className="font-medium text-foreground">{account.displayName}</p>
                    {account.isPrimary ? (
                      <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] text-background">
                        Primary
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
