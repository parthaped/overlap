import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  createGoogleLinkCookieValue,
  googleLinkCookieName,
  googleLinkCookieOptions,
} from "@/lib/google-link-cookie";
import { buildGoogleAuthorizeUrl, isGoogleOAuthConfigured } from "@/lib/google-oauth";

export async function GET() {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/inbox/accounts?error=google_not_configured", env.APP_URL),
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    const signIn = new URL("/signin", env.APP_URL);
    signIn.searchParams.set("callbackUrl", "/api/integrations/google/start");
    return NextResponse.redirect(signIn);
  }

  const { cookieValue, nonce } = createGoogleLinkCookieValue(session.user.id);
  const target = buildGoogleAuthorizeUrl({ state: nonce });

  const res = NextResponse.redirect(target);
  res.cookies.set({
    ...googleLinkCookieOptions(false),
    name: googleLinkCookieName(),
    value: cookieValue,
  });

  return res;
}
