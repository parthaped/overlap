"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const settingsSchema = z.object({
  preferredTone: z.string().min(3),
  inboxStyle: z.enum(["MINIMALIST", "BALANCED", "DETAILED"]),
});

export type SettingsState = {
  error?: string;
  success?: string;
};

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
  });

  if (!parsed.success) {
    return { error: "Please fill out all settings." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      preferredTone: parsed.data.preferredTone,
      inboxStyle: parsed.data.inboxStyle,
    },
  });

  revalidatePath("/inbox");
  revalidatePath("/inbox/settings");
  return { success: "Settings updated." };
}
