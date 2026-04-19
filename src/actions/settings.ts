"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { reclassifyUserThreads } from "@/actions/ai";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const settingsSchema = z.object({
  preferredTone: z.string().min(3),
  inboxStyle: z.enum(["MINIMALIST", "BALANCED", "DETAILED"]),
  vipEmails: z.array(z.string().email()).default([]),
  vipDomains: z.array(z.string().min(2)).default([]),
  priorityKeywords: z.array(z.string().min(1)).default([]),
  mutedDomains: z.array(z.string().min(2)).default([]),
  mutedKeywords: z.array(z.string().min(1)).default([]),
});

export type SettingsState = {
  error?: string;
  success?: string;
};

function parseList(value: FormDataEntryValue | null): string[] {
  if (!value || typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((v) => typeof v === "string");
  } catch {
    // fall back to comma-separated input
  }
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function updateUserSettings(
  _prev: SettingsState | undefined,
  formData: FormData,
): Promise<SettingsState> {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const parsed = settingsSchema.safeParse({
    preferredTone: formData.get("preferredTone"),
    inboxStyle: formData.get("inboxStyle"),
    vipEmails: parseList(formData.get("vipEmails")),
    vipDomains: parseList(formData.get("vipDomains")),
    priorityKeywords: parseList(formData.get("priorityKeywords")),
    mutedDomains: parseList(formData.get("mutedDomains")),
    mutedKeywords: parseList(formData.get("mutedKeywords")),
  });

  if (!parsed.success) {
    return { error: "Please fill out all settings." };
  }

  const prioritizeJson: Prisma.InputJsonValue = {
    vipEmails: parsed.data.vipEmails.map((e) => e.toLowerCase()),
    vipDomains: parsed.data.vipDomains.map((d) => d.toLowerCase()),
    priorityKeywords: parsed.data.priorityKeywords,
  };

  const deprioritizeJson: Prisma.InputJsonValue = {
    mutedDomains: parsed.data.mutedDomains.map((d) => d.toLowerCase()),
    mutedKeywords: parsed.data.mutedKeywords,
  };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      preferredTone: parsed.data.preferredTone,
      inboxStyle: parsed.data.inboxStyle,
      prioritizeJson,
      deprioritizeJson,
    },
  });

  // Fire-and-forget reclassify so VIP/mute changes apply immediately to existing threads.
  reclassifyUserThreads(session.user.id).catch((e) =>
    console.error("reclassify after settings save failed", e),
  );

  revalidatePath("/inbox");
  revalidatePath("/inbox/settings");
  return { success: "Settings saved. Reclassifying inbox…" };
}
