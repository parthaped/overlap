"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignInFormProps = {
  callbackUrl?: string;
  defaultEmail?: string;
  showRegisteredNotice?: boolean;
};

export function SignInForm({
  callbackUrl,
  defaultEmail,
  showRegisteredNotice,
}: SignInFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resolvedCallback =
    callbackUrl ?? searchParams.get("callbackUrl") ?? "/inbox";

  useEffect(() => {
    if (showRegisteredNotice) {
      toast.success("Account ready", {
        description: "Sign in with your new credentials.",
      });
    }
  }, [showRegisteredNotice]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("We couldn’t sign you in. Check your email and password.");
        return;
      }

      if (result?.ok) {
        router.push(resolvedCallback);
        router.refresh();
      }
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {showRegisteredNotice ? (
        <p className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-foreground">
          Account created. You can sign in now.
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          defaultValue={defaultEmail ?? ""}
          placeholder="you@company.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          placeholder="••••••••"
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in…" : "Continue"}
      </Button>
    </form>
  );
}
