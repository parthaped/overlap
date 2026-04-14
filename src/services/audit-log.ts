import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function recordAuditLog(
  userId: string,
  action: string,
  metadataJson?: Record<string, unknown>,
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      metadataJson: metadataJson as Prisma.InputJsonValue | undefined,
    },
  });
}
