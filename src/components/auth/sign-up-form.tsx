"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { signUp, type SignUpState } from "@/actions/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SignUpState = {};

export function SignUpForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  useEffect(() => {
    if (state.success && state.email) {
      router.push(`/signin?registered=1&email=${encodeURIComponent(state.email)}`);
    }
  }, [state.success, state.email, router]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" autoComplete="name" required minLength={2} placeholder="Alex Mercer" />
        {state.fieldErrors?.name ? (
          <p className="text-sm text-destructive">{state.fieldErrors.name.join(", ")}</p>
        ) : null}
      </div>

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
          placeholder="you@company.com"
        />
        {state.fieldErrors?.email ? (
          <p className="text-sm text-destructive">{state.fieldErrors.email.join(", ")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
        {state.fieldErrors?.password ? (
          <p className="text-sm text-destructive">{state.fieldErrors.password.join(", ")}</p>
        ) : null}
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending || state.success}>
        {isPending ? "Creating account…" : state.success ? "Redirecting…" : "Create account"}
      </Button>
    </form>
  );
}
