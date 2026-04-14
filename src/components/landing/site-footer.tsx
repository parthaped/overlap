import Link from "next/link";

import { APP_NAME } from "@/lib/constants";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 px-6 py-14 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-serif text-lg tracking-tight text-foreground">{APP_NAME}</p>
          <p className="mt-2 text-sm text-muted-foreground">Built for focus, not for feeds.</p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link className="transition-colors duration-500 hover:text-foreground" href="/signin">
            Sign in
          </Link>
          <Link className="transition-colors duration-500 hover:text-foreground" href="/signup">
            Create account
          </Link>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-center text-xs text-muted-foreground/80 sm:text-left">
        © {year} {APP_NAME}. Crafted with restraint.
      </p>
    </footer>
  );
}
