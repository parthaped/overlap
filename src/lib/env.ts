import { z } from "zod";

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
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
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
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
});

if (!parsed.success) {
  console.error(parsed.error.flatten());
  throw new Error("Invalid environment configuration");
}

const data = parsed.data;

/** On Vercel builds/runtime, reject default dev-only secrets and require HTTPS app URL. */
if (process.env.VERCEL === "1") {
  const devAuth = "development-auth-secret-change-me-please";
  const devEnc = "development-encryption-key-change-me";
  if (data.AUTH_SECRET === devAuth) {
    throw new Error("AUTH_SECRET must be set to a strong random value in production (Vercel).");
  }
  if (data.APP_ENCRYPTION_KEY === devEnc) {
    throw new Error("APP_ENCRYPTION_KEY must be set to a strong random value in production (Vercel).");
  }
  if (!data.NEXTAUTH_URL.startsWith("https://")) {
    throw new Error("NEXTAUTH_URL must use https in production (Vercel).");
  }
  if (!data.APP_URL.startsWith("https://")) {
    throw new Error("APP_URL must use https in production (Vercel).");
  }
}

export const env = data;
