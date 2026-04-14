import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  rememberMe: z.boolean().default(true),
});

export const onboardingSchema = z.object({
  primaryIdentityLabel: z.string().min(2),
  prioritize: z.array(z.string()).min(1),
  deprioritize: z.array(z.string()).min(1),
  inboxStyle: z.enum(["MINIMALIST", "BALANCED", "DETAILED"]),
  preferredTone: z.string().min(3),
  replyFormality: z.string().min(3),
  suggestSendTimes: z.boolean().default(true),
  useFileContext: z.boolean().default(true),
});

export const connectAccountSchema = z.object({
  provider: z.enum(["GOOGLE", "MICROSOFT", "ICLOUD", "IMAP", "SMTP", "DEMO"]),
  mode: z.enum(["demo", "manual"]).default("demo"),
  displayName: z.string().min(2),
  email: z.string().email(),
});

export const generateDraftSchema = z.object({
  tone: z.string().default("Professional but warm"),
  includeSchedule: z.boolean().default(true),
  variantCount: z.number().min(1).max(4).default(4),
});

export const sendMessageSchema = z.object({
  linkedAccountId: z.string().min(1),
  threadId: z.string().optional(),
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).optional().default([]),
  subject: z.string().min(1),
  body: z.string().min(1),
});
