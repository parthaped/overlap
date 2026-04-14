"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { LogOut, Mail } from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export type AppShellUser = {
  name: string;
  email: string;
};

type AppShellProps = {
  user: AppShellUser;
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/80 ring-1 ring-border/60">
              <Mail className="h-5 w-5 text-foreground" strokeWidth={1.5} aria-hidden />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{APP_NAME}</p>
              <p className="font-medium leading-tight text-foreground">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              className="gap-2"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Sign out
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10 lg:px-8">{children}</div>

      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        <Link className="transition-colors hover:text-foreground" href="/">
          Back to home
        </Link>
      </footer>
    </div>
  );
}

export function AppSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-6", className)}>
      <div>
        <h1 className="font-serif text-3xl tracking-tight text-foreground">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
