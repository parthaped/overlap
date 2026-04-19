"use server";

import OpenAI from "openai";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import {
  archiveThread,
  bulkTriage,
  dailyBrief,
  draftReply,
  markRead,
  muteDomain,
  setVip,
  snoozeThread,
  summarizeThread,
} from "@/actions/ai";

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

export type InboxAiToolCall = {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
};

export type InboxAiMessageOut = {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolCalls?: InboxAiToolCall[];
  createdAt: string;
};

export type InboxAiResponse = {
  ok: boolean;
  conversationId: string;
  reply: string;
  toolCalls: InboxAiToolCall[];
  error?: string;
};

const askSchema = z.object({
  question: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
  threadId: z.string().optional(),
});

const TOOL_SCHEMAS = [
  {
    type: "function" as const,
    function: {
      name: "list_top_priorities",
      description: "Return today's top 5 priority threads from the inbox.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "summarize_thread",
      description: "Generate or refresh an AI summary for a single thread.",
      parameters: {
        type: "object",
        properties: { threadId: { type: "string" } },
        required: ["threadId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "draft_reply",
      description: "Generate a draft reply for a thread. Returns subject + body.",
      parameters: {
        type: "object",
        properties: {
          threadId: { type: "string" },
          tone: { type: "string", description: "Optional preferred tone." },
        },
        required: ["threadId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "bulk_triage",
      description: "Archive / mark-read / delete / snooze every thread in a bucket.",
      parameters: {
        type: "object",
        properties: {
          bucket: {
            type: "string",
            enum: [
              "FOCUS",
              "OTHER",
              "NEEDS_REPLY",
              "WAITING_ON",
              "PROMOTIONS",
              "UPDATES",
              "SOCIAL",
              "NEWSLETTERS",
            ],
          },
          action: { type: "string", enum: ["archive", "mark_read", "delete", "snooze"] },
        },
        required: ["bucket", "action"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "snooze_thread",
      description: "Snooze a thread for a number of hours.",
      parameters: {
        type: "object",
        properties: {
          threadId: { type: "string" },
          hours: { type: "number" },
        },
        required: ["threadId", "hours"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "archive_thread",
      description: "Archive a single thread.",
      parameters: {
        type: "object",
        properties: { threadId: { type: "string" } },
        required: ["threadId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "mark_read",
      description: "Mark a thread as read.",
      parameters: {
        type: "object",
        properties: { threadId: { type: "string" } },
        required: ["threadId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "set_vip",
      description: "Add an email or domain to the user's VIP list (boosts priority).",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string" },
          domain: { type: "string" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "mute_domain",
      description: "Mute a sender domain so its mail goes to Promotions.",
      parameters: {
        type: "object",
        properties: { domain: { type: "string" } },
        required: ["domain"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_threads",
      description: "Search threads by a substring of the subject or sender.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
];

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  userId: string,
): Promise<unknown> {
  switch (name) {
    case "list_top_priorities":
      return await dailyBrief();
    case "summarize_thread":
      return await summarizeThread({ threadId: String(args.threadId) });
    case "draft_reply":
      return await draftReply({
        threadId: String(args.threadId),
        tone: args.tone ? String(args.tone) : undefined,
      });
    case "bulk_triage":
      return await bulkTriage({
        bucket: args.bucket as never,
        action: args.action as never,
      });
    case "snooze_thread":
      return await snoozeThread({
        threadId: String(args.threadId),
        hours: Number(args.hours),
      });
    case "archive_thread":
      return await archiveThread({ threadId: String(args.threadId) });
    case "mark_read":
      return await markRead({ threadId: String(args.threadId) });
    case "set_vip":
      return await setVip({
        email: args.email ? String(args.email) : undefined,
        domain: args.domain ? String(args.domain) : undefined,
      });
    case "mute_domain":
      return await mute_domain_safe(String(args.domain));
    case "search_threads":
      return await searchThreads(userId, String(args.query));
    default:
      return { ok: false, error: `Unknown tool: ${name}` };
  }
}

async function mute_domain_safe(domain: string) {
  return await muteDomain({ domain });
}

async function searchThreads(userId: string, query: string) {
  const q = query.trim().toLowerCase();
  const threads = await prisma.messageThread.findMany({
    where: {
      userId,
      deletedAt: null,
      OR: [
        { normalizedSubject: { contains: q, mode: "insensitive" } },
        {
          messages: {
            some: {
              OR: [
                { senderEmail: { contains: q, mode: "insensitive" } },
                { senderDomain: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    },
    take: 10,
    orderBy: { lastMessageAt: "desc" },
    select: { id: true, normalizedSubject: true, focusBucket: true, aiPriorityScore: true },
  });
  return { ok: true, data: { threads } };
}

// ============================================================================
// Deterministic fallback when OPENAI_API_KEY is unset
// ============================================================================

async function deterministicReply(
  question: string,
  userId: string,
): Promise<{ reply: string; toolCalls: InboxAiToolCall[] }> {
  const lower = question.toLowerCase();
  const toolCalls: InboxAiToolCall[] = [];

  if (/import|priorit|today|brief|catch up/.test(lower)) {
    const result = await dailyBrief();
    toolCalls.push({ name: "list_top_priorities", args: {}, result });
    if (result.ok) {
      const lines = result.data.priorities
        .map((p, i) => `${i + 1}. ${p.subject} — ${p.reason} (score ${p.score})`)
        .join("\n");
      return {
        reply: `${result.data.oneLiner}\n\n${lines || "Inbox is clear right now."}`,
        toolCalls,
      };
    }
  }

  if (/clear|triage|archive|promo|newsletter|social|update/.test(lower)) {
    let bucket: "PROMOTIONS" | "NEWSLETTERS" | "SOCIAL" | "UPDATES" = "PROMOTIONS";
    if (/newsletter/.test(lower)) bucket = "NEWSLETTERS";
    else if (/social/.test(lower)) bucket = "SOCIAL";
    else if (/update/.test(lower)) bucket = "UPDATES";
    const result = await bulkTriage({ bucket, action: "archive" });
    toolCalls.push({ name: "bulk_triage", args: { bucket, action: "archive" }, result });
    if (result.ok) {
      return {
        reply: `Archived ${result.data.count} ${bucket.toLowerCase()} threads.`,
        toolCalls,
      };
    }
  }

  if (/wait|owe|stuck/.test(lower)) {
    const waiting = await prisma.messageThread.findMany({
      where: { userId, deletedAt: null, focusBucket: "WAITING_ON", isArchived: false },
      orderBy: { lastMessageAt: "asc" },
      take: 5,
      select: { normalizedSubject: true, lastMessageAt: true },
    });
    return {
      reply: waiting.length
        ? `You're waiting on ${waiting.length} threads:\n${waiting
            .map(
              (t) =>
                `• ${t.normalizedSubject} (since ${t.lastMessageAt.toDateString()})`,
            )
            .join("\n")}`
        : "You're not waiting on anyone right now.",
      toolCalls,
    };
  }

  return {
    reply:
      "I can summarize your inbox, draft replies, triage promotions, or surface what you're waiting on. Try: \"What's important today?\" or \"Clear all promotions.\"",
    toolCalls,
  };
}

// ============================================================================
// askInboxAi — entry point
// ============================================================================

export async function askInboxAi(
  input: z.infer<typeof askSchema>,
): Promise<InboxAiResponse> {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return {
      ok: false,
      conversationId: "",
      reply: "",
      toolCalls: [],
      error: "You must be signed in.",
    };
  }
  const userId = session.user.id;

  const parsed = askSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      conversationId: "",
      reply: "",
      toolCalls: [],
      error: "Invalid request.",
    };
  }

  const conversationId =
    parsed.data.conversationId ??
    `conv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

  await prisma.copilotMessage.create({
    data: {
      userId,
      conversationId,
      role: "user",
      content: parsed.data.question,
    },
  });

  let reply: string;
  let toolCalls: InboxAiToolCall[];

  if (!openai) {
    const det = await deterministicReply(parsed.data.question, userId);
    reply = det.reply;
    toolCalls = det.toolCalls;
  } else {
    try {
      ({ reply, toolCalls } = await runWithOpenAI(parsed.data.question, userId, parsed.data.threadId));
    } catch (error) {
      console.error("Overlap AI (OpenAI) run failed; falling back.", error);
      const det = await deterministicReply(parsed.data.question, userId);
      reply = det.reply;
      toolCalls = det.toolCalls;
    }
  }

  await prisma.copilotMessage.create({
    data: {
      userId,
      conversationId,
      role: "assistant",
      content: reply,
      toolCallsJson: toolCalls.length ? (toolCalls as never) : undefined,
    },
  });

  revalidatePath("/inbox");
  return { ok: true, conversationId, reply, toolCalls };
}

async function runWithOpenAI(
  question: string,
  userId: string,
  contextThreadId?: string,
): Promise<{ reply: string; toolCalls: InboxAiToolCall[] }> {
  if (!openai) throw new Error("OpenAI not configured");

  const recent = await prisma.messageThread.findMany({
    where: { userId, deletedAt: null, isArchived: false },
    take: 12,
    orderBy: { aiPriorityScore: "desc" },
    select: {
      id: true,
      normalizedSubject: true,
      focusBucket: true,
      aiPriorityScore: true,
    },
  });

  const systemPrompt = `You are Overlap, the in-product AI assistant for the user's unified inbox.
You can call tools to read, summarize, draft replies, triage, snooze, mute, and VIP.
Always be terse — one to three short sentences plus a list when listing items.
When the user asks about importance/priority, call list_top_priorities first.
When the user asks to clear or archive a category, call bulk_triage.
Never fabricate threads — only refer to ones returned by tools or in the snapshot below.

Inbox snapshot (top 12 by AI priority score):
${recent.map((t) => `- [${t.focusBucket}] ${t.normalizedSubject} (id=${t.id}, score=${Math.round(t.aiPriorityScore)})`).join("\n")}
${contextThreadId ? `\nUser is currently viewing thread id=${contextThreadId}.` : ""}`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: question },
  ];

  const collectedToolCalls: InboxAiToolCall[] = [];

  for (let step = 0; step < 4; step += 1) {
    const completion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages,
      tools: TOOL_SCHEMAS,
      tool_choice: "auto",
    });

    const choice = completion.choices[0];
    const message = choice?.message;
    if (!message) break;

    messages.push(message);

    if (!message.tool_calls?.length) {
      return { reply: message.content ?? "", toolCalls: collectedToolCalls };
    }

    for (const call of message.tool_calls) {
      if (call.type !== "function") continue;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }
      const result = await executeTool(call.function.name, args, userId);
      collectedToolCalls.push({ name: call.function.name, args, result });
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result).slice(0, 4000),
      });
    }
  }

  return {
    reply: "I ran out of reasoning steps. Try a more specific question.",
    toolCalls: collectedToolCalls,
  };
}

// ============================================================================
// loadInboxAiConversation — for hydrating the drawer
// ============================================================================

export async function loadInboxAiConversation(
  conversationId: string,
): Promise<InboxAiMessageOut[]> {
  const session = await getCurrentSession();
  if (!session?.user?.id) return [];

  const messages = await prisma.copilotMessage.findMany({
    where: { userId: session.user.id, conversationId },
    orderBy: { createdAt: "asc" },
  });

  return messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant" | "tool",
    content: m.content,
    toolCalls: (m.toolCallsJson as InboxAiToolCall[] | null) ?? undefined,
    createdAt: m.createdAt.toISOString(),
  }));
}
