import { env } from "@/lib/env";

/** Scopes for linking Gmail (read + send). Add modify later if you need labels/archive. */
export const GOOGLE_GMAIL_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
] as const;

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";

export function getGoogleOAuthRedirectUri() {
  const base = env.NEXTAUTH_URL.replace(/\/$/, "");
  return `${base}/api/integrations/google/callback`;
}

export function isGoogleOAuthConfigured() {
  return Boolean(
    env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

export function buildGoogleAuthorizeUrl(params: { state: string }) {
  const url = new URL(GOOGLE_AUTH);
  url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", getGoogleOAuthRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_GMAIL_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", params.state);
  return url.toString();
}

export async function exchangeGoogleAuthorizationCode(code: string) {
  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID!,
    client_secret: env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: getGoogleOAuthRedirectUri(),
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const json: unknown = await res.json();
  if (!res.ok) {
    return { ok: false as const, error: "token_error", detail: json };
  }

  const parsed = json as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
  };

  if (!parsed.access_token) {
    return { ok: false as const, error: "missing_access_token", detail: json };
  }

  return {
    ok: true as const,
    accessToken: parsed.access_token,
    refreshToken: parsed.refresh_token ?? null,
    expiresIn: typeof parsed.expires_in === "number" ? parsed.expires_in : undefined,
  };
}

export async function fetchGoogleUserProfile(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json: unknown = await res.json();
  if (!res.ok) {
    return { ok: false as const, detail: json };
  }
  const p = json as { email?: string; name?: string; picture?: string };
  if (!p.email) {
    return { ok: false as const, detail: json };
  }
  return {
    ok: true as const,
    email: p.email.toLowerCase(),
    name: p.name ?? p.email,
    picture: p.picture ?? null,
  };
}
