"use server";

import { InboxStyle } from "@prisma/client";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signUpSchema } from "@/lib/validators";

export type SignUpState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function signUp(
  _prevState: SignUpState | undefined,
  formData: FormData,
): Promise<SignUpState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "on",
  };

  const parsed = signUpSchema.safeParse({
    name: raw.name,
    email: raw.email,
    password: raw.password,
    rememberMe: raw.rememberMe,
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      passwordHash,
      inboxStyle: InboxStyle.BALANCED,
    },
  });

  redirect(`/signin?registered=1&email=${encodeURIComponent(email)}`);
}
