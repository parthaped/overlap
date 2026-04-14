import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Sign in — ${APP_NAME}`,
};

type PageProps = {
  searchParams: Promise<{ callbackUrl?: string; registered?: string; email?: string }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="relative flex min-h-screen flex-col px-6 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(91,187,189,0.12),transparent_45%)]" />
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="inline-flex font-serif text-xl tracking-tight text-foreground transition-opacity duration-500 hover:opacity-70"
        >
          {APP_NAME}
        </Link>
        <div className="mt-10 rounded-[1.75rem] border border-border/60 bg-card/80 p-8 shadow-card backdrop-blur-sm">
          <h1 className="font-serif text-3xl tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-2 text-[0.95rem] text-muted-foreground">
            Sign in to open your unified inbox.
          </p>
          <div className="mt-8">
            <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-muted/50" aria-hidden />}>
              <SignInForm
                callbackUrl={params.callbackUrl}
                defaultEmail={params.email}
                showRegisteredNotice={params.registered === "1"}
              />
            </Suspense>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          New to {APP_NAME}?{" "}
          <Link className="font-medium text-foreground underline-offset-4 transition-colors hover:underline" href="/signup">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
