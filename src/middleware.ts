import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { env } from "@/lib/env";
import { checkAuthRouteRateLimit } from "@/lib/rate-limit-edge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    const limit = checkAuthRouteRateLimit(request);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.retryAfterSec),
            "Cache-Control": "no-store",
          },
        },
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/inbox")) {
    const token = await getToken({
      req: request,
      secret: env.AUTH_SECRET,
    });

    if (!token) {
      const signIn = new URL("/signin", request.url);
      signIn.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(signIn);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/inbox/:path*", "/api/auth/:path*"],
};
