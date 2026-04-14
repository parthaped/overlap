"use server";

import { InboxStyle, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signUpSchema } from "@/lib/validators";

export type SignUpState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  /** Set when account was created; client redirects to sign-in. */
  success?: boolean;
  email?: string;
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

  try {
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

    /** Client-side navigation avoids `redirect()` + `useActionState` edge cases on Vercel. */
    return { success: true, email };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "An account with this email already exists." };
    }

    console.error("signUp failed:", error);
    return {
      error:
        "We could not create your account. Check your connection and database, then try again.",
    };
  }
}
