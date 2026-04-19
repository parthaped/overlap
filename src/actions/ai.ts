"use server";

import { FocusBucket, type Prisma, ThreadCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/services/audit-log";
import { generateDraftSuggestions, generateThreadSummary } from "@/services/ai";
import { buildAvailabilitySlots } from "@/services/calendar-availability";
import {
  analyzeThread,
  deriveSenderFromMessage,
  type UserSignals,
} from "@/services/thread-analysis";

export type AIActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function readSignals(value: unknown): Partial<UserSignals> {
  if (!value) return {};
  if (Array.isArray(value)) return { priorityKeywords: value as string[] };
  if (typeof value === "object") return value as Partial<UserSignals>;
  return {};
}

async function requireUserId() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return null;
  }
  return session.user.id;
}

async function loadUserSignals(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { prioritizeJson: true, deprioritizeJson: true, preferredTone: true },
  });
  return {
    preferredTone: user?.preferredTone ?? "Professional but warm",
    preferred: readSignals(user?.prioritizeJson),
    muted: readSignals(user?.deprioritizeJson),
  };
}

// ============================================================================
// summarizeThread
// ============================================================================

const summarizeSchema = z.object({ threadId: z.string().min(1) });

export async function summarizeThread(
  input: z.infer<typeof summarizeSchema>,
): Promise<AIActionResult<{ summary: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const parsed = summarizeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const thread = await prisma.messageThread.findFirst({
    where: { id: parsed.data.threadId, userId, deletedAt: null },
    select: {
      id: true,
      normalizedSubject: true,
      aiSummary: true,
      messages: {
        where: { deletedAt: null },
        orderBy: [{ receivedAt: "desc" }, { sentAt: "desc" }, { createdAt: "desc" }],
        take: 8,
        select: {
          subject: true,
          bodyText: true,
          snippet: true,
          direction: true,
          fromJson: true,
        },
      },
    },
  });
  if (!thread) return { ok: false, error: "Thread not found." };

  const summary = await generateThreadSummary(thread);

  await prisma.messageThread.update({
    where: { id: thread.id },
    data: { aiSummary: summary },
  });

  revalidatePath("/inbox");
  return { ok: true, data: { summary } };
}

// ============================================================================
// draftReply
// ============================================================================

const draftReplySchema = z.object({
  threadId: z.string().min(1),
  tone: z.string().optional(),
});

export async function draftReply(
  input: z.infer<typeof draftReplySchema>,
): Promise<AIActionResult<{ draftId: string; subject: string; body: string; tone: string }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const parsed = draftReplySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const thread = await prisma.messageThread.findFirst({
    where: { id: parsed.data.threadId, userId, deletedAt: null },
    select: {
      id: true,
      normalizedSubject: true,
      aiSummary: true,
      messages: {
        where: { deletedAt: null },
        orderBy: [{ receivedAt: "desc" }, { sentAt: "desc" }, { createdAt: "desc" }],
        take: 6,
        select: {
          id: true,
          subject: true,
          bodyText: true,
          snippet: true,
          direction: true,
          fromJson: true,
        },
      },
    },
  });
  if (!thread) return { ok: false, error: "Thread not found." };

  const [{ preferredTone }, calendarConnections, contextFiles] = await Promise.all([
    loadUserSignals(userId),
    prisma.calendarConnection.findMany({
      where: { userId, deletedAt: null },
    }),
    prisma.uploadedContextFile.findMany({
      where: { userId, deletedAt: null, threadId: thread.id },
      take: 3,
    }),
  ]);

  const tone = parsed.data.tone?.trim() || preferredTone;
  const availability = buildAvailabilitySlots(calendarConnections, tone);

  const drafts = await generateDraftSuggestions({
    thread: {
      normalizedSubject: thread.normalizedSubject,
      aiSummary: thread.aiSummary,
      messages: thread.messages,
    },
    preferredTone: tone,
    files: contextFiles,
    availability,
  });

  const best =
    drafts.find((d) => d.tone.toLowerCase().includes(tone.toLowerCase().split(" ")[0])) ??
    drafts[0];
  const sourceMessage = thread.messages.find((m) => m.direction === "INBOUND") ?? thread.messages[0];

  const draft = await prisma.draftSuggestion.create({
    data: {
      userId,
      threadId: thread.id,
      sourceMessageId: sourceMessage?.id ?? null,
      generatedSubject: best.generatedSubject,
      generatedBody: best.generatedBody,
      tone: best.tone,
      contextSourcesJson: best.contextSourcesJson as Prisma.InputJsonValue,
    },
    select: { id: true, generatedSubject: true, generatedBody: true, tone: true },
  });

  await recordAuditLog(userId, "ai.draftReply", { threadId: thread.id, tone });
  revalidatePath("/inbox");
  revalidatePath("/inbox/drafts");
  return {
    ok: true,
    data: {
      draftId: draft.id,
      subject: draft.generatedSubject,
      body: draft.generatedBody,
      tone: draft.tone,
    },
  };
}

// ============================================================================
// bulkTriage
// ============================================================================

const bulkTriageSchema = z.object({
  bucket: z.enum([
    "FOCUS",
    "OTHER",
    "NEEDS_REPLY",
    "WAITING_ON",
    "SCHEDULED",
    "SENT",
    "DRAFTS",
    "TRASH",
    "PROMOTIONS",
    "UPDATES",
    "SOCIAL",
    "NEWSLETTERS",
  ]),
  action: z.enum(["archive", "mark_read", "delete", "snooze"]),
  snoozeHours: z.number().min(1).max(24 * 30).optional(),
});

export async function bulkTriage(
  input: z.infer<typeof bulkTriageSchema>,
): Promise<AIActionResult<{ count: number }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const parsed = bulkTriageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const where = {
    userId,
    deletedAt: null,
    isArchived: false,
    focusBucket: parsed.data.bucket as FocusBucket,
  };

  let count = 0;
  switch (parsed.data.action) {
    case "archive": {
      const result = await prisma.messageThread.updateMany({
        where,
        data: { isArchived: true, isUnread: false },
      });
      count = result.count;
      break;
    }
    case "mark_read": {
      const result = await prisma.messageThread.updateMany({
        where,
        data: { isUnread: false },
      });
      count = result.count;
      break;
    }
    case "delete": {
      const result = await prisma.messageThread.updateMany({
        where,
        data: { deletedAt: new Date() },
      });
      count = result.count;
      break;
    }
    case "snooze": {
      const hours = parsed.data.snoozeHours ?? 24;
      const until = new Date(Date.now() + hours * 60 * 60 * 1000);
      const result = await prisma.messageThread.updateMany({
        where,
        data: { snoozeUntil: until },
      });
      count = result.count;
      break;
    }
  }

  await recordAuditLog(userId, "ai.bulkTriage", {
    bucket: parsed.data.bucket,
    action: parsed.data.action,
    count,
  });
  revalidatePath("/inbox");
  return { ok: true, data: { count } };
}

// ============================================================================
// snoozeThread
// ============================================================================

const snoozeSchema = z.object({
  threadId: z.string().min(1),
  hours: z.number().min(0).max(24 * 365).optional(),
  until: z.string().datetime().optional(),
});

export async function snoozeThread(
  input: z.infer<typeof snoozeSchema>,
): Promise<AIActionResult<{ snoozeUntil: string | null }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const parsed = snoozeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const owned = await prisma.messageThread.findFirst({
    where: { id: parsed.data.threadId, userId, deletedAt: null },
    select: { id: true },
  });
  if (!owned) return { ok: false, error: "Thread not found." };

  let snoozeUntil: Date | null = null;
  if (parsed.data.hours === 0) {
    snoozeUntil = null;
  } else if (parsed.data.until) {
    snoozeUntil = new Date(parsed.data.until);
  } else {
    const hours = parsed.data.hours ?? 4;
    snoozeUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  await prisma.messageThread.update({
    where: { id: owned.id },
    data: { snoozeUntil },
  });
  revalidatePath("/inbox");
  return { ok: true, data: { snoozeUntil: snoozeUntil?.toISOString() ?? null } };
}

// ============================================================================
// archive / unarchive / star / mark
// ============================================================================

const threadIdSchema = z.object({ threadId: z.string().min(1) });

export async function archiveThread(
  input: z.infer<typeof threadIdSchema>,
): Promise<AIActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };
  const parsed = threadIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  await prisma.messageThread.updateMany({
    where: { id: parsed.data.threadId, userId },
    data: { isArchived: true, isUnread: false },
  });
  revalidatePath("/inbox");
  return { ok: true, data: undefined };
}

export async function toggleStar(
  input: z.infer<typeof threadIdSchema>,
): Promise<AIActionResult<{ isStarred: boolean }>> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };
  const parsed = threadIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const thread = await prisma.messageThread.findFirst({
    where: { id: parsed.data.threadId, userId },
    select: { isStarred: true },
  });
  if (!thread) return { ok: false, error: "Thread not found." };

  const updated = await prisma.messageThread.update({
    where: { id: parsed.data.threadId },
    data: { isStarred: !thread.isStarred },
    select: { isStarred: true },
  });
  revalidatePath("/inbox");
  return { ok: true, data: { isStarred: updated.isStarred } };
}

export async function markRead(
  input: z.infer<typeof threadIdSchema>,
): Promise<AIActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };
  const parsed = threadIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  await prisma.messageThread.updateMany({
    where: { id: parsed.data.threadId, userId },
    data: { isUnread: false },
  });
  revalidatePath("/inbox");
  return { ok: true, data: undefined };
}

// ============================================================================
// dailyBrief
// ============================================================================

export async function dailyBrief(): Promise<
  AIActionResult<{
    oneLiner: string;
    priorities: Array<{ id: string; subject: string; reason: string; score: number }>;
    counts: Record<string, number>;
  }>
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const [topThreads, grouped] = await Promise.all([
    prisma.messageThread.findMany({
      where: {
        userId,
        deletedAt: null,
        isArchived: false,
        OR: [{ snoozeUntil: null }, { snoozeUntil: { lte: new Date() } }],
      },
      orderBy: [
        { aiPriorityScore: "desc" },
        { lastMessageAt: "desc" },
      ],
      take: 5,
      select: {
        id: true,
        normalizedSubject: true,
        aiPriorityScore: true,
        aiReasoningJson: true,
        focusBucket: true,
      },
    }),
    prisma.messageThread.groupBy({
      by: ["focusBucket"],
      where: { userId, deletedAt: null, isArchived: false },
      _count: { _all: true },
    }),
  ]);

  const counts: Record<string, number> = {};
  for (const row of grouped) {
    counts[row.focusBucket] = row._count._all;
  }

  const priorities = topThreads.map((t) => {
    const reasoning = (t.aiReasoningJson as { reasons?: string[] } | null)?.reasons ?? [];
    return {
      id: t.id,
      subject: t.normalizedSubject,
      reason: reasoning[0] ?? `${t.focusBucket.replace("_", " ").toLowerCase()} thread`,
      score: Math.round(t.aiPriorityScore),
    };
  });

  const needsReply = counts.NEEDS_REPLY ?? 0;
  const promos = counts.PROMOTIONS ?? 0;
  const focus = counts.FOCUS ?? 0;
  const oneLiner = priorities.length
    ? `${focus + needsReply} important to read · ${needsReply} need a reply · ${promos} promos to clear`
    : "Inbox zero. Nothing on fire.";

  return { ok: true, data: { oneLiner, priorities, counts } };
}

// ============================================================================
// VIP / mute management
// ============================================================================

const vipSchema = z.object({
  email: z.string().email().optional(),
  domain: z.string().min(2).optional(),
}).refine((v) => v.email || v.domain, "Provide an email or domain.");

export async function setVip(
  input: z.infer<typeof vipSchema>,
): Promise<AIActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };
  const parsed = vipSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { prioritizeJson: true },
  });
  const current = readSignals(user?.prioritizeJson);
  const next: Partial<UserSignals> = {
    vipEmails: current.vipEmails ?? [],
    vipDomains: current.vipDomains ?? [],
    priorityKeywords: current.priorityKeywords ?? [],
  };

  if (parsed.data.email) {
    const v = parsed.data.email.toLowerCase();
    if (!next.vipEmails!.includes(v)) next.vipEmails!.push(v);
  }
  if (parsed.data.domain) {
    const v = parsed.data.domain.toLowerCase().trim();
    if (!next.vipDomains!.includes(v)) next.vipDomains!.push(v);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { prioritizeJson: next as Prisma.InputJsonValue },
  });
  await reclassifyUserThreads(userId).catch((e) => console.error("reclassify failed", e));
  revalidatePath("/inbox");
  revalidatePath("/inbox/settings");
  return { ok: true, data: undefined };
}

export async function unsetVip(
  input: z.infer<typeof vipSchema>,
): Promise<AIActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };
  const parsed = vipSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { prioritizeJson: true },
  });
  const current = readSignals(user?.prioritizeJson);
  const next: Partial<UserSignals> = {
    vipEmails: (current.vipEmails ?? []).filter(
      (e) => e !== parsed.data.email?.toLowerCase(),
    ),
    vipDomains: (current.vipDomains ?? []).filter(
      (d) => d !== parsed.data.domain?.toLowerCase().trim(),
    ),
    priorityKeywords: current.priorityKeywords ?? [],
  };

  await prisma.user.update({
    where: { id: userId },
    data: { prioritizeJson: next as Prisma.InputJsonValue },
  });
  await reclassifyUserThreads(userId).catch((e) => console.error("reclassify failed", e));
  revalidatePath("/inbox");
  revalidatePath("/inbox/settings");
  return { ok: true, data: undefined };
}

const muteDomainSchema = z.object({ domain: z.string().min(2) });

export async function muteDomain(
  input: z.infer<typeof muteDomainSchema>,
): Promise<AIActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };
  const parsed = muteDomainSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { deprioritizeJson: true },
  });
  const current = readSignals(user?.deprioritizeJson);
  const next: Partial<UserSignals> = {
    mutedDomains: current.mutedDomains ?? [],
    mutedKeywords: current.mutedKeywords ?? [],
  };
  const v = parsed.data.domain.toLowerCase().trim();
  if (!next.mutedDomains!.includes(v)) next.mutedDomains!.push(v);

  await prisma.user.update({
    where: { id: userId },
    data: { deprioritizeJson: next as Prisma.InputJsonValue },
  });
  await reclassifyUserThreads(userId).catch((e) => console.error("reclassify failed", e));
  revalidatePath("/inbox");
  revalidatePath("/inbox/settings");
  return { ok: true, data: undefined };
}

// ============================================================================
// Reclassification helper
// ============================================================================

export async function reclassifyUserThreads(userId: string, limit = 200) {
  const { preferred, muted } = await loadUserSignals(userId);

  const threads = await prisma.messageThread.findMany({
    where: { userId, deletedAt: null },
    take: limit,
    orderBy: { lastMessageAt: "desc" },
    select: {
      id: true,
      normalizedSubject: true,
      messages: {
        where: { deletedAt: null },
        orderBy: [{ receivedAt: "desc" }, { sentAt: "desc" }, { createdAt: "desc" }],
        take: 5,
        select: {
          id: true,
          subject: true,
          bodyText: true,
          snippet: true,
          direction: true,
          fromJson: true,
        },
      },
    },
  });

  for (const thread of threads) {
    const enriched = thread.messages.map((m) => {
      const sender = deriveSenderFromMessage({ fromJson: m.fromJson });
      return {
        subject: m.subject,
        bodyText: m.bodyText,
        snippet: m.snippet,
        direction: m.direction,
        fromEmail: sender.email,
        fromName: sender.name,
      };
    });

    const analysis = analyzeThread(
      { normalizedSubject: thread.normalizedSubject },
      enriched,
      preferred,
      muted,
    );

    await prisma.messageThread.update({
      where: { id: thread.id },
      data: {
        focusBucket: analysis.focusBucket,
        category: analysis.category as ThreadCategory,
        aiPriorityScore: analysis.aiPriorityScore,
        needsReply: analysis.needsReply,
        waitingOnOther: analysis.waitingOnOther,
        aiReasoningJson: {
          reasons: analysis.reasons,
          chips: analysis.chips,
          actionItems: analysis.actionItems,
        },
      },
    });

    for (const m of thread.messages) {
      const sender = deriveSenderFromMessage({ fromJson: m.fromJson });
      await prisma.emailMessage.update({
        where: { id: m.id },
        data: { senderEmail: sender.email, senderDomain: sender.domain },
      });
    }
  }
}

// ============================================================================
// sendDraft (move draft into "sent" state and mark thread waiting/archived)
// ============================================================================

const sendDraftSchema = z.object({ draftId: z.string().min(1) });

export async function sendDraft(
  input: z.infer<typeof sendDraftSchema>,
): Promise<AIActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };
  const parsed = sendDraftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const draft = await prisma.draftSuggestion.findFirst({
    where: { id: parsed.data.draftId, userId },
    select: { id: true, threadId: true },
  });
  if (!draft) return { ok: false, error: "Draft not found." };

  await prisma.$transaction([
    prisma.draftSuggestion.update({
      where: { id: draft.id },
      data: { sentAt: new Date(), approvedAt: new Date() },
    }),
    prisma.messageThread.update({
      where: { id: draft.threadId },
      data: { needsReply: false, waitingOnOther: true, focusBucket: "WAITING_ON" },
    }),
  ]);

  await recordAuditLog(userId, "ai.sendDraft", { draftId: draft.id });
  revalidatePath("/inbox");
  revalidatePath("/inbox/drafts");
  return { ok: true, data: undefined };
}
