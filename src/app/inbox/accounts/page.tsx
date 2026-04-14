import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isGoogleOAuthConfigured } from "@/lib/google-oauth";
import { AppSection } from "@/components/app/app-shell";
import { AccountConnections } from "@/components/app/account-connections";

export default async function AccountsPage() {
  const session = await getCurrentSession();
  if (!session?.user?.id) redirect("/signin");

  const accounts = await prisma.linkedEmailAccount.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: [{ isPrimary: "desc" }, { providerAccountEmail: "asc" }],
    select: {
      id: true,
      providerType: true,
      providerAccountEmail: true,
      displayName: true,
      colorTag: true,
      isPrimary: true,
      syncStatus: true,
    },
  });

  return (
    <AppSection
      eyebrow="Accounts & providers"
      title="Account connections"
      description="Link and manage providers in one secure inbox."
    >
      <Suspense fallback={<div className="min-h-[12rem] rounded-[1.85rem] border border-dashed border-border/50 bg-muted/10" />}>
        <AccountConnections accounts={accounts} googleOAuthConfigured={isGoogleOAuthConfigured()} />
      </Suspense>
    </AppSection>
  );
}
