import type { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX = 80;

const buckets = new Map<string, Bucket>();

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? "unknown";
}

function prune(now: number) {
  if (buckets.size < 5000) {
    return;
  }
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

/**
 * Simple fixed-window limiter for Edge middleware. Mitigates casual abuse per isolate;
 * for distributed/high-traffic production, prefer Redis/Upstash or a WAF (e.g. Vercel Firewall).
 */
export function checkAuthRouteRateLimit(
  request: NextRequest,
  maxPerWindow: number = DEFAULT_MAX,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  prune(now);

  const ip = getClientIp(request);
  const key = `auth:${ip}`;
  const existing = buckets.get(key);

  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (existing.count >= maxPerWindow) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { ok: false, retryAfterSec };
  }

  existing.count += 1;
  return { ok: true };
}
