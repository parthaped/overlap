export const APP_NAME = "Overlap";

export const PRIORITIZE_OPTIONS = [
  "work / professional",
  "personal",
  "finance / bills",
  "school / academic",
  "urgent / deadlines",
  "people I reply to often",
  "newsletters I care about",
] as const;

export const DEPRIORITIZE_OPTIONS = [
  "promotions",
  "cold outreach",
  "low-value newsletters",
  "automated notifications",
  "receipts",
  "social updates",
] as const;

export const INBOX_STYLE_OPTIONS = [
  { id: "MINIMALIST", label: "Minimalist", description: "Low chrome, calm feed, fewer visual hints." },
  { id: "BALANCED", label: "Balanced", description: "Recommended mix of signal, context, and metadata." },
  { id: "DETAILED", label: "Detailed", description: "Expose more metadata and thread intelligence." },
] as const;

export const TONE_OPTIONS = [
  { id: "Professional but warm", label: "Professional", description: "Crisp, polished, and direct." },
  { id: "Friendly and conversational", label: "Friendly", description: "Human, relaxed, still thoughtful." },
  { id: "Detailed and reassuring", label: "Detailed", description: "More context and explicit next steps." },
] as const;

export const FOCUS_BUCKETS = [
  { id: "FOCUS", label: "Focus" },
  { id: "OTHER", label: "Other" },
  { id: "NEEDS_REPLY", label: "Needs Reply" },
  { id: "WAITING_ON", label: "Waiting On" },
  { id: "SCHEDULED", label: "Scheduled" },
  { id: "SENT", label: "Sent" },
  { id: "DRAFTS", label: "Drafts" },
  { id: "TRASH", label: "Trash" },
] as const;

export const DEMO_CREDENTIALS = {
  email: "demo@overlap.app",
  password: "password123",
};
