import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
      title="Account connections"
      description="Link and manage providers in one secure inbox."
    >
      <AccountConnections accounts={accounts} />
    </AppSection>
  );
}
