"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import { Cable, FileText, LayoutDashboard, LogOut, Mail, Settings } from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { AppBackdrop } from "@/components/app/app-backdrop";
import { Button } from "@/components/ui/button";

export type AppShellUser = {
  name: string;
  email: string;
};

type AppShellProps = {
  user: AppShellUser;
  children: React.ReactNode;
};

const navLinkClass = (active: boolean) =>
  cn(
    "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium outline-none transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    active
      ? "bg-background text-foreground shadow-card"
      : "text-muted-foreground hover:text-foreground",
  );

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const nav = [
    { href: "/inbox", label: "Dashboard", icon: LayoutDashboard },
    { href: "/inbox/accounts", label: "Accounts", icon: Cable },
    { href: "/inbox/drafts", label: "Drafts", icon: FileText },
    { href: "/inbox/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55"
      >
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 justify-self-start">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-muted/90 to-muted/60 ring-1 ring-border/50 shadow-sm">
              <Mail className="h-5 w-5 text-foreground" strokeWidth={1.5} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{APP_NAME}</p>
              <p className="truncate font-medium leading-tight text-foreground">{user.name}</p>
            </div>
          </div>

          <nav
            className="hidden w-max justify-self-center md:flex"
            aria-label="Main navigation"
          >
            <div className="flex items-center gap-1 rounded-full bg-muted/50 p-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <motion.span
                    key={item.href}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    className="inline-flex"
                  >
                    <Link
                      href={item.href}
                      className={navLinkClass(active)}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {item.label}
                    </Link>
                  </motion.span>
                );
              })}
            </div>
          </nav>

          <div className="flex min-w-0 items-center justify-self-end gap-2">
            <span
              className="hidden max-w-[11rem] truncate text-sm text-muted-foreground sm:inline lg:max-w-[14rem]"
              title={user.email}
            >
              {user.email}
            </span>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              className="shrink-0 gap-2"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Sign out
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10 pb-24 md:pb-10 lg:px-8">
        <AppBackdrop />
        <div className="relative z-0">{children}</div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55 md:hidden"
        aria-label="Main navigation"
      >
        <div
          className="mx-auto flex max-w-6xl items-stretch justify-around px-2 pt-1"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <motion.span
                key={item.href}
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                className="flex min-w-0 flex-1 justify-center"
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-11 min-w-[3.5rem] max-w-full flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-medium outline-none transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200",
                      active ? "bg-background shadow-card" : "bg-transparent",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              </motion.span>
            );
          })}
        </div>
      </nav>

      <footer className="border-t border-border/40 py-8 pb-[calc(5rem+env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground md:pb-8">
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
  eyebrow = "Workspace",
  children,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn("space-y-8", className)}
    >
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
        <h1 className="font-serif text-3xl tracking-tight text-foreground sm:text-[2.15rem]">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </motion.section>
  );
}
