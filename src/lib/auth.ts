import type { InboxStyle } from "@prisma/client";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { comparePassword } from "@/lib/password";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.union([z.literal("true"), z.literal("false")]).optional().default("true"),
});

type AuthUserPayload = {
  id: string;
  email: string;
  name: string;
  preferredTone: string;
  inboxStyle: InboxStyle;
  primaryAccountId: string | null;
  rememberSessionPreference: boolean;
  onboardedAt: string | null;
};

export const authOptions: NextAuthOptions = {
  secret: env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },
  pages: {
    signIn: "/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Overlap credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember me", type: "text" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const remember = parsed.data.rememberMe === "true";
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });

        if (!user) {
          return null;
        }

        const passwordMatches = await comparePassword(
          parsed.data.password,
          user.passwordHash,
        );

        if (!passwordMatches) {
          return null;
        }

        const payload: AuthUserPayload = {
          id: user.id,
          email: user.email,
          name: user.name,
          preferredTone: user.preferredTone,
          inboxStyle: user.inboxStyle,
          primaryAccountId: user.primaryAccountId,
          rememberSessionPreference: remember,
          onboardedAt: user.onboardedAt ? user.onboardedAt.toISOString() : null,
        };

        return payload;
      },
    }),
  ],
  callbacks: {
    /** Prevent open redirects: only same-origin or relative paths. */
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      try {
        const next = new URL(url);
        if (next.origin === new URL(baseUrl).origin) {
          return url;
        }
      } catch {
        return baseUrl;
      }
      return baseUrl;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const authUser = user as AuthUserPayload;
        token.email = authUser.email;
        token.name = authUser.name;
        token.preferredTone = authUser.preferredTone;
        token.inboxStyle = authUser.inboxStyle;
        token.primaryAccountId = authUser.primaryAccountId;
        token.rememberSessionPreference = authUser.rememberSessionPreference;
        token.onboardedAt = authUser.onboardedAt;
        token.sessionExpiresAt = new Date(
          Date.now() +
            (authUser.rememberSessionPreference
              ? 1000 * 60 * 60 * 24 * 30
              : 1000 * 60 * 60 * 12),
        ).toISOString();
      }

      if (trigger === "update" && session?.user) {
        token.preferredTone = session.user.preferredTone;
        token.inboxStyle = session.user.inboxStyle;
        token.primaryAccountId = session.user.primaryAccountId;
        token.onboardedAt = session.user.onboardedAt;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.primaryAccountId = (token.primaryAccountId as string | null) ?? null;
        session.user.preferredTone =
          (token.preferredTone as string | null) ?? "Professional but warm";
        session.user.inboxStyle =
          (token.inboxStyle as InboxStyle | null) ?? "BALANCED";
        session.user.onboardedAt = (token.onboardedAt as string | null) ?? null;
        session.user.rememberSessionPreference =
          (token.rememberSessionPreference as boolean | null) ?? true;
        session.user.sessionExpiresAt =
          (token.sessionExpiresAt as string | null) ?? session.expires;
      }

      return session;
    },
  },
};

export async function getCurrentSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  if (
    session.user.sessionExpiresAt &&
    new Date(session.user.sessionExpiresAt) < new Date()
  ) {
    return null;
  }

  return session;
}
