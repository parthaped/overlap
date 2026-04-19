"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Cable,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
  Sparkles,
} from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { cn, initials } from "@/lib/utils";
import { useUIStore } from "@/lib/ui-store";

import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/app/command-palette";
import { OverlapAiPanel } from "@/components/app/inbox/overlap-ai-panel";
import { ShortcutsModal } from "@/components/app/keyboard-shortcuts";

export type AppShellUser = {
  name: string;
  email: string;
};

type AppShellProps = {
  user: AppShellUser;
  children: React.ReactNode;
  rightRail?: React.ReactNode;
};

const navItems = [
  { href: "/inbox", label: "Inbox", icon: LayoutDashboard },
  { href: "/inbox/drafts", label: "Drafts", icon: FileText },
  { href: "/inbox/accounts", label: "Accounts", icon: Cable },
  { href: "/inbox/settings", label: "Settings", icon: Settings },
];

export function AppShell({ user, children, rightRail }: AppShellProps) {
  const pathname = usePathname();
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const toggleOverlapAi = useUIStore((s) => s.toggleOverlapAi);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CommandPalette />
      <ShortcutsModal />
      <OverlapAiPanel />

      <div className="flex min-h-screen w-full">
        {/* Desktop left rail */}
        <aside className="sticky top-0 hidden h-screen w-[228px] shrink-0 flex-col border-r border-border/60 bg-card/40 px-3 py-4 md:flex">
          <Link href="/inbox" className="flex items-center gap-2 px-2.5 py-1.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Mail className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div className="leading-tight">
              <p className="text-[15px] font-semibold tracking-tight text-foreground">{APP_NAME}</p>
              <p className="text-[11px] text-muted-foreground">AI inbox</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            <span className="flex-1 text-left">Search or ask…</span>
            <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={toggleOverlapAi}
            className="mt-2 flex items-center gap-2 rounded-lg bg-foreground/95 px-2.5 py-1.5 text-sm text-background shadow-sm transition-all hover:-translate-y-px hover:shadow-card"
          >
            <Sparkles className="h-4 w-4" strokeWidth={1.5} />
            <span className="flex-1 text-left">Open Overlap AI</span>
            <kbd className="rounded bg-background/15 px-1 py-0.5 text-[10px] font-mono">
              ⌘⇧J
            </kbd>
          </button>

          <nav className="mt-5 space-y-0.5" aria-label="Primary">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/inbox" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "text-foreground/85 hover:bg-muted/55 hover:text-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2 border-t border-border/50 pt-3">
            <div className="flex items-center gap-2 px-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                {initials(user.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-tight text-foreground">
                  {user.name}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/55 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              Sign out
            </button>
          </div>
        </aside>

        <main className="flex min-h-screen flex-1 flex-col overflow-hidden">
          {/* Mobile header */}
          <header className="flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md md:hidden">
            <Link href="/inbox" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
                <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
              <span className="text-sm font-semibold">{APP_NAME}</span>
            </Link>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setCommandPaletteOpen(true)} className="h-8 px-2.5 text-xs">
                ⌘K
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleOverlapAi} className="h-8 gap-1.5 px-2.5 text-xs">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                AI
              </Button>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
            {rightRail ? (
              <div className="hidden border-l border-border/60 bg-card/30 lg:block lg:w-[360px] xl:w-[400px]">
                {rightRail}
              </div>
            ) : null}
          </div>

          {/* Mobile bottom nav */}
          <nav
            className="sticky bottom-0 z-30 flex items-stretch justify-around border-t border-border/60 bg-background/95 px-2 py-1.5 backdrop-blur-md md:hidden"
            aria-label="Primary mobile"
            style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/inbox" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-md py-1.5 text-[11px] transition-colors",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </main>
      </div>
    </div>
  );
}

export function AppSection({
  title,
  description,
  eyebrow,
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
    <section className={cn("mx-auto w-full max-w-4xl px-6 py-8", className)}>
      <header className="space-y-1.5">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Inbox className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span>{APP_NAME}</span>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
