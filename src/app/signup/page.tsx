import Link from "next/link";
import type { Metadata } from "next";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Create account — ${APP_NAME}`,
};

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen flex-col px-6 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,245,220,0.7),transparent_50%)]" />
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="inline-flex font-serif text-xl tracking-tight text-foreground transition-opacity duration-500 hover:opacity-70"
        >
          {APP_NAME}
        </Link>
        <div className="mt-10 rounded-[1.75rem] border border-border/60 bg-card/80 p-8 shadow-card backdrop-blur-sm">
          <h1 className="font-serif text-3xl tracking-tight text-foreground">Create your account</h1>
          <p className="mt-2 text-[0.95rem] text-muted-foreground">
            A few details—then you can shape how {APP_NAME} prioritizes your mail.
          </p>
          <div className="mt-8">
            <SignUpForm />
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-medium text-foreground underline-offset-4 transition-colors hover:underline" href="/signin">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
