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
      eyebrow="Preferences"
      title="Settings"
      description="Adjust workspace behavior, tone defaults, and account-level preferences."
    >
      <SettingsForm preferredTone={user.preferredTone} inboxStyle={user.inboxStyle} />
      <div className="relative overflow-hidden rounded-[1.85rem] border border-border/50 bg-card/88 p-6 text-sm text-muted-foreground shadow-soft ring-1 ring-border/30 backdrop-blur-[2px] sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />
        <p className="font-serif text-lg tracking-tight text-foreground">Security</p>
        <p className="mt-3 leading-relaxed">Signed in as {user.email}</p>
        <p className="mt-2 leading-relaxed">Account created on {user.createdAt.toLocaleDateString()}</p>
        <p className="mt-4 leading-relaxed text-muted-foreground/95">
          Sessions persist on this browser/device. Signing out revokes local access.
        </p>
      </div>
    </AppSection>
  );
}
