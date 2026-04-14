import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppSection } from "@/components/app/app-shell";
import { SettingsForm } from "@/components/app/settings-form";

export default async function SettingsPage() {
  const session = await getCurrentSession();
  if (!session?.user?.id) redirect("/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      preferredTone: true,
      inboxStyle: true,
      email: true,
      createdAt: true,
    },
  });
  if (!user) redirect("/signin");

  return (
    <AppSection
      title="Settings"
      description="Adjust workspace behavior, tone defaults, and account-level preferences."
    >
      <SettingsForm preferredTone={user.preferredTone} inboxStyle={user.inboxStyle} />
      <div className="rounded-[1.5rem] border border-border/60 bg-card/70 p-6 text-sm text-muted-foreground shadow-card">
        <p className="font-medium text-foreground">Security</p>
        <p className="mt-2">Signed in as {user.email}</p>
        <p className="mt-1">Account created on {user.createdAt.toLocaleDateString()}</p>
        <p className="mt-3">
          Sessions persist on this browser/device. Signing out revokes local access.
        </p>
      </div>
    </AppSection>
  );
}
