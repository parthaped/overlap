import crypto from "node:crypto";

import { encryptSecret, decryptSecret } from "@/lib/crypto";

export type GoogleLinkCookiePayload = {
  userId: string;
  nonce: string;
  exp: number;
};

const COOKIE_NAME = "overlap_google_oauth";
const TTL_MS = 10 * 60 * 1000;

export function createGoogleLinkCookieValue(userId: string) {
  const nonce = crypto.randomBytes(24).toString("hex");
  const payload: GoogleLinkCookiePayload = {
    userId,
    nonce,
    exp: Date.now() + TTL_MS,
  };
  return { cookieValue: encryptSecret(JSON.stringify(payload)), nonce };
}

export function parseGoogleLinkCookie(cookieValue: string): GoogleLinkCookiePayload | null {
  try {
    const raw = decryptSecret(cookieValue);
    const data = JSON.parse(raw) as GoogleLinkCookiePayload;
    if (
      typeof data.userId !== "string" ||
      typeof data.nonce !== "string" ||
      typeof data.exp !== "number"
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function googleLinkCookieName() {
  return COOKIE_NAME;
}

export function googleLinkCookieOptions(expired = false) {
  return {
    name: COOKIE_NAME,
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: expired ? 0 : Math.floor(TTL_MS / 1000),
  };
}
