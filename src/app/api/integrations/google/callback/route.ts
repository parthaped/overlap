import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import {
  googleLinkCookieName,
  googleLinkCookieOptions,
  parseGoogleLinkCookie,
} from "@/lib/google-link-cookie";
import {
  exchangeGoogleAuthorizationCode,
  fetchGoogleUserProfile,
  isGoogleOAuthConfigured,
} from "@/lib/google-oauth";
import { persistGoogleLinkedAccount } from "@/lib/persist-google-account";

function redirectAccounts(search: string) {
  return NextResponse.redirect(new URL(`/inbox/accounts${search}`, env.APP_URL));
}

export async function GET(request: NextRequest) {
  const err = request.nextUrl.searchParams.get("error");
  if (err === "access_denied") {
    const res = redirectAccounts("?error=google_denied");
    res.cookies.set({ ...googleLinkCookieOptions(true), name: googleLinkCookieName(), value: "" });
    return res;
  }

  if (!isGoogleOAuthConfigured()) {
    return redirectAccounts("?error=google_not_configured");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieRaw = request.cookies.get(googleLinkCookieName())?.value;

  if (!code || !state || !cookieRaw) {
    const res = redirectAccounts("?error=google_invalid");
    res.cookies.set({ ...googleLinkCookieOptions(true), name: googleLinkCookieName(), value: "" });
    return res;
  }

  const payload = parseGoogleLinkCookie(cookieRaw);
  if (!payload || payload.nonce !== state || Date.now() > payload.exp) {
    const res = redirectAccounts("?error=google_invalid");
    res.cookies.set({ ...googleLinkCookieOptions(true), name: googleLinkCookieName(), value: "" });
    return res;
  }

  const tokenResult = await exchangeGoogleAuthorizationCode(code);
  if (!tokenResult.ok) {
    console.error("Google token exchange failed", tokenResult.detail);
    const res = redirectAccounts("?error=google_token");
    res.cookies.set({ ...googleLinkCookieOptions(true), name: googleLinkCookieName(), value: "" });
    return res;
  }

  const profile = await fetchGoogleUserProfile(tokenResult.accessToken);
  if (!profile.ok) {
    console.error("Google userinfo failed", profile.detail);
    const res = redirectAccounts("?error=google_profile");
    res.cookies.set({ ...googleLinkCookieOptions(true), name: googleLinkCookieName(), value: "" });
    return res;
  }

  const persist = await persistGoogleLinkedAccount({
    userId: payload.userId,
    email: profile.email,
    displayName: profile.name,
    avatarUrl: profile.picture,
    accessToken: tokenResult.accessToken,
    refreshToken: tokenResult.refreshToken,
    expiresIn: tokenResult.expiresIn,
  });

  const res = persist.ok
    ? redirectAccounts("?success=google")
    : redirectAccounts("?error=google_already_linked");

  res.cookies.set({ ...googleLinkCookieOptions(true), name: googleLinkCookieName(), value: "" });
  return res;
}
