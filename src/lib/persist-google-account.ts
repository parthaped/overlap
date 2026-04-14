import { ProviderType, SyncStatus } from "@prisma/client";

import { encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/db";

export type PersistGoogleResult =
  | { ok: true; accountId: string }
  | { ok: false; code: "ALREADY_LINKED_OTHER" };

/**
 * Stores encrypted OAuth tokens on LinkedEmailAccount. Tokens are AES-GCM ciphertext in DB fields.
 */
export async function persistGoogleLinkedAccount(input: {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  accessToken: string;
  /** New refresh from Google; if omitted, previous encrypted refresh is kept when updating. */
  refreshToken: string | null;
  expiresIn: number | undefined;
}): Promise<PersistGoogleResult> {
  const email = input.email.toLowerCase();

  const existing = await prisma.linkedEmailAccount.findUnique({
    where: {
      providerType_providerAccountEmail: {
        providerType: ProviderType.GOOGLE,
        providerAccountEmail: email,
      },
    },
  });

  if (existing && existing.userId !== input.userId) {
    return { ok: false, code: "ALREADY_LINKED_OTHER" };
  }

  const encAccess = encryptSecret(input.accessToken);
  const encRefresh =
    input.refreshToken != null
      ? encryptSecret(input.refreshToken)
      : (existing?.refreshToken ?? null);

  const tokenExpiresAt =
    input.expiresIn != null ? new Date(Date.now() + input.expiresIn * 1000) : null;

  const colorTag = "#5bbabd";

  let accountId: string;

  if (existing) {
    const updated = await prisma.linkedEmailAccount.update({
      where: { id: existing.id },
      data: {
        deletedAt: null,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
        accessToken: encAccess,
        ...(encRefresh ? { refreshToken: encRefresh } : {}),
        tokenExpiresAt,
        syncStatus: SyncStatus.ACTIVE,
        colorTag,
      },
    });
    accountId = updated.id;
  } else {
    const created = await prisma.linkedEmailAccount.create({
      data: {
        userId: input.userId,
        providerType: ProviderType.GOOGLE,
        providerAccountEmail: email,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
        accessToken: encAccess,
        refreshToken: encRefresh ?? null,
        tokenExpiresAt,
        syncStatus: SyncStatus.ACTIVE,
        colorTag,
        isPrimary: false,
      },
    });
    accountId = created.id;
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { primaryAccountId: true },
  });

  if (!user?.primaryAccountId) {
    await prisma.linkedEmailAccount.updateMany({
      where: { userId: input.userId },
      data: { isPrimary: false },
    });
    await prisma.linkedEmailAccount.update({
      where: { id: accountId },
      data: { isPrimary: true },
    });
    await prisma.user.update({
      where: { id: input.userId },
      data: { primaryAccountId: accountId },
    });
  }

  return { ok: true, accountId };
}
