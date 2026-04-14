import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";

import { AppShell } from "@/components/app/app-shell";

export const metadata: Metadata = {
  title: `Inbox — ${APP_NAME}`,
};

export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <AppShell
      user={{
        name: session.user.name ?? "Member",
        email: session.user.email ?? "",
      }}
    >
      {children}
    </AppShell>
  );
}
