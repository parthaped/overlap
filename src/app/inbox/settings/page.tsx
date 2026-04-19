import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppSection } from "@/components/app/app-shell";
import { SettingsForm } from "@/components/app/settings-form";

type Signals = {
  vipEmails: string[];
  vipDomains: string[];
  priorityKeywords: string[];
  mutedDomains: string[];
  mutedKeywords: string[];
};

function readSignals(value: unknown): Signals {
  const empty: Signals = {
    vipEmails: [],
    vipDomains: [],
    priorityKeywords: [],
    mutedDomains: [],
    mutedKeywords: [],
  };
  if (!value) return empty;
  if (Array.isArray(value))
    return { ...empty, priorityKeywords: value.filter((v): v is string => typeof v === "string") };
  if (typeof value !== "object") return empty;
  const v = value as Partial<Signals>;
  return {
    vipEmails: Array.isArray(v.vipEmails) ? v.vipEmails : [],
    vipDomains: Array.isArray(v.vipDomains) ? v.vipDomains : [],
    priorityKeywords: Array.isArray(v.priorityKeywords) ? v.priorityKeywords : [],
    mutedDomains: Array.isArray(v.mutedDomains) ? v.mutedDomains : [],
    mutedKeywords: Array.isArray(v.mutedKeywords) ? v.mutedKeywords : [],
  };
}

export default async function SettingsPage() {
  const session = await getCurrentSession();
  if (!session?.user?.id) redirect("/signin");

  const userId = session.user.id;
  const [user, suggestedSenders, mutedSuggestions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        preferredTone: true,
        inboxStyle: true,
        email: true,
        createdAt: true,
        prioritizeJson: true,
        deprioritizeJson: true,
      },
    }),
    prisma.emailMessage.groupBy({
      by: ["senderEmail"],
      where: {
        linkedAccount: { userId, deletedAt: null },
        senderEmail: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { senderEmail: "desc" } },
      take: 8,
    }),
    prisma.emailMessage.groupBy({
      by: ["senderDomain"],
      where: {
        linkedAccount: { userId, deletedAt: null },
        senderDomain: { not: null },
        thread: { category: "PROMOTIONAL" },
      },
      _count: { _all: true },
      orderBy: { _count: { senderDomain: "desc" } },
      take: 8,
    }),
  ]);

  if (!user) redirect("/signin");

  const preferred = readSignals(user.prioritizeJson);
  const muted = readSignals(user.deprioritizeJson);

  const suggestedVipEmails = suggestedSenders
    .map((s) => s.senderEmail)
    .filter((s): s is string => Boolean(s))
    .filter((s) => !preferred.vipEmails.includes(s));

  const suggestedMutedDomains = mutedSuggestions
    .map((s) => s.senderDomain)
    .filter((s): s is string => Boolean(s))
    .filter((s) => !muted.mutedDomains.includes(s));

  return (
    <AppSection
      eyebrow="Preferences"
      title="Settings"
      description="Adjust workspace behavior, tone defaults, and which senders should always (or never) reach you."
    >
      <SettingsForm
        preferredTone={user.preferredTone}
        inboxStyle={user.inboxStyle}
        vipEmails={preferred.vipEmails}
        vipDomains={preferred.vipDomains}
        priorityKeywords={preferred.priorityKeywords}
        mutedDomains={muted.mutedDomains}
        mutedKeywords={muted.mutedKeywords}
        suggestedVipEmails={suggestedVipEmails}
        suggestedMutedDomains={suggestedMutedDomains}
      />

      <div className="mt-6 rounded-2xl border border-border/60 bg-card/50 p-5 text-sm text-muted-foreground sm:p-6">
        <p className="text-base font-semibold text-foreground">Account</p>
        <p className="mt-2">Signed in as {user.email}</p>
        <p className="mt-1">Created {user.createdAt.toLocaleDateString()}</p>
      </div>
    </AppSection>
  );
}
