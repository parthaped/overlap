import { z } from "zod";

/**
 * Vercel sets `VERCEL_URL` (no scheme) for the current deployment. If `NEXTAUTH_URL` / `APP_URL`
 * are unset, NextAuth defaults and our HTTPS checks break the build. Fill from `VERCEL_URL`
 * so Preview and first-time Production deploys work without manual copy-paste.
 * Override in the Vercel dashboard when using a custom domain.
 */
const DEV_AUTH = "development-auth-secret-change-me-please";
const DEV_ENC = "development-encryption-key-change-me";

if (process.env.VERCEL === "1" && process.env.VERCEL_URL) {
  const origin = `https://${process.env.VERCEL_URL}`;
  if (!process.env.NEXTAUTH_URL?.trim()) {
    process.env.NEXTAUTH_URL = origin;
  }
  if (!process.env.APP_URL?.trim()) {
    process.env.APP_URL = origin;
  }
}

/**
 * If only `AUTH_SECRET` is set in Vercel (common), Zod would still default `APP_ENCRYPTION_KEY`
 * to the dev placeholder and fail the production check. Reuse the same secret material when
 * `APP_ENCRYPTION_KEY` is omitted and `AUTH_SECRET` is already a non-default value.
 * (AES key is derived via SHA-256 in `lib/crypto.ts`.)
 */
if (process.env.VERCEL === "1") {
  const auth = process.env.AUTH_SECRET?.trim();
  const enc = process.env.APP_ENCRYPTION_KEY?.trim();
  if (!enc && auth && auth !== DEV_AUTH && auth.length >= 32) {
    process.env.APP_ENCRYPTION_KEY = auth;
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/overlap"),
  REDIS_URL: z.string().optional(),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(32).default("development-auth-secret-change-me-please"),
  APP_ENCRYPTION_KEY: z
    .string()
    .min(32)
    .default("development-encryption-key-change-me"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  /** Google Cloud OAuth web client (Gmail). See `.env.example`; connect flow not implemented yet. */
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  /** Microsoft Entra app registration (Outlook). See `.env.example`; connect flow not implemented yet. */
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  /** e.g. `common` or tenant GUID — reserved for Azure AD provider when wired. */
  MICROSOFT_TENANT_ID: z.string().optional(),
  SMTP_FROM_NAME: z.string().default("Overlap"),
});

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  APP_URL: process.env.APP_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  APP_ENCRYPTION_KEY: process.env.APP_ENCRYPTION_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
  MICROSOFT_TENANT_ID: process.env.MICROSOFT_TENANT_ID,
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
});

if (!parsed.success) {
  console.error(parsed.error.flatten());
  throw new Error("Invalid environment configuration");
}

const data = parsed.data;

/** On Vercel builds/runtime, reject default dev-only secrets and require HTTPS app URL. */
if (process.env.VERCEL === "1") {
  if (data.AUTH_SECRET === DEV_AUTH) {
    throw new Error(
      "AUTH_SECRET must be set to a strong random value in production (Vercel project → Environment Variables).",
    );
  }
  if (data.APP_ENCRYPTION_KEY === DEV_ENC) {
    throw new Error(
      "APP_ENCRYPTION_KEY must be set to a strong random value in production (Vercel), or set AUTH_SECRET and omit APP_ENCRYPTION_KEY so it can reuse that value.",
    );
  }
  if (!data.NEXTAUTH_URL.startsWith("https://")) {
    throw new Error("NEXTAUTH_URL must use https in production (Vercel).");
  }
  if (!data.APP_URL.startsWith("https://")) {
    throw new Error("APP_URL must use https in production (Vercel).");
  }
}

export const env = data;
