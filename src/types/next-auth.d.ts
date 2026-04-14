import type { InboxStyle } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      primaryAccountId: string | null;
      preferredTone: string;
      inboxStyle: InboxStyle;
      onboardedAt: string | null;
      rememberSessionPreference: boolean;
      sessionExpiresAt: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    preferredTone?: string;
    inboxStyle?: InboxStyle;
    primaryAccountId?: string | null;
    rememberSessionPreference?: boolean;
    onboardedAt?: string | null;
    sessionExpiresAt?: string | null;
  }
}
