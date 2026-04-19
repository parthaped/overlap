import type { DraftSuggestion, EmailMessage, MessageThread, UploadedContextFile } from "@prisma/client";
import OpenAI from "openai";

import { env } from "@/lib/env";
import { analyzeThread, deriveSenderFromMessage } from "@/services/thread-analysis";

const openai = env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })
  : null;

type ThreadWithMessages = Pick<MessageThread, "normalizedSubject" | "aiSummary"> & {
  messages: Array<
    Pick<EmailMessage, "subject" | "bodyText" | "snippet" | "direction"> & {
      fromJson?: unknown;
    }
  >;
};

function buildContextSnippets(files: UploadedContextFile[]) {
  return files.slice(0, 2).map((file) => ({
    fileName: file.originalName,
    snippet: file.extractedText.slice(0, 220),
  }));
}

async function tryGenerateWithOpenAI(prompt: string) {
  if (!openai) {
    return null;
  }

  try {
    const response = await openai.responses.create({
      model: env.OPENAI_MODEL,
      input: prompt,
    });

    return response.output_text || null;
  } catch (error) {
    console.error("OpenAI generation failed, falling back to deterministic mode.", error);
    return null;
  }
}

export async function generateThreadSummary(thread: ThreadWithMessages) {
  const enrichedMessages = thread.messages.map((message) => {
    const sender = deriveSenderFromMessage(
      "fromJson" in message ? { fromJson: message.fromJson } : undefined,
    );
    return {
      subject: message.subject,
      bodyText: message.bodyText,
      snippet: message.snippet,
      direction: message.direction,
      fromEmail: sender.email,
      fromName: sender.name,
    };
  });

  const heuristic = analyzeThread(
    { normalizedSubject: thread.normalizedSubject } as MessageThread,
    enrichedMessages,
  );

  const prompt = [
    "Summarize this email thread in 2 sentences.",
    `Subject: ${thread.normalizedSubject}`,
    ...thread.messages.slice(0, 6).map((message, index) => {
      return `Message ${index + 1} (${message.direction}): ${message.bodyText ?? message.snippet ?? ""}`;
    }),
  ].join("\n");

  const aiSummary = await tryGenerateWithOpenAI(prompt);
  return aiSummary || heuristic.summary;
}

export async function generateDraftSuggestions(params: {
  thread: ThreadWithMessages;
  preferredTone: string;
  files: UploadedContextFile[];
  availability: {
    slots: Array<{ label: string; startsAt: string; endsAt: string }>;
  };
}) {
  const latestInbound = params.thread.messages.find(
    (message) => message.direction === "INBOUND",
  );
  const contextSnippets = buildContextSnippets(params.files);
  const scheduleText = params.availability.slots
    .map((slot) => `- ${slot.label}`)
    .join("\n");

  const fallbackBodies = [
    {
      tone: "short reply",
      subject: `Re: ${params.thread.normalizedSubject}`,
      body: `Hi there,\n\nThanks for the note. ${latestInbound?.snippet ?? "I saw your message."} I can make the following times work:\n${scheduleText}\n\nBest,\nAlex`,
    },
    {
      tone: "professional reply",
      subject: `Re: ${params.thread.normalizedSubject}`,
      body: `Hi,\n\nThanks for reaching out. I reviewed your note and these windows should work well on my side:\n${scheduleText}\n\nIf one of those is convenient, I’m happy to lock it in.\n\nBest,\nAlex`,
    },
    {
      tone: "friendly reply",
      subject: `Re: ${params.thread.normalizedSubject}`,
      body: `Hi,\n\nHappy to do it. I can make one of these windows next week:\n${scheduleText}\n\nIf another time is easier, send it over and I’ll see what I can shift.\n\nThanks,\nAlex`,
    },
    {
      tone: "detailed reply",
      subject: `Re: ${params.thread.normalizedSubject}`,
      body: `Hi,\n\nThanks for the detailed note. I reviewed the thread${contextSnippets.length ? " and the supporting material you shared" : ""}. Based on that, the best options on my calendar are:\n${scheduleText}\n\nIf you’d like, I can also send a short agenda beforehand so we can make the session more useful.\n\nBest,\nAlex`,
    },
  ];

  const prompt = [
    "Return a valid JSON array with four email draft suggestions.",
    "Each item must contain: tone, subject, body, reasoning.",
    `Thread subject: ${params.thread.normalizedSubject}`,
    `Preferred tone: ${params.preferredTone}`,
    `Latest inbound content: ${latestInbound?.bodyText ?? latestInbound?.snippet ?? "N/A"}`,
    contextSnippets.length
      ? `Context files:\n${contextSnippets
          .map((snippet) => `- ${snippet.fileName}: ${snippet.snippet}`)
          .join("\n")}`
      : "No file context.",
    `Availability slots:\n${scheduleText}`,
  ].join("\n");

  const aiText = await tryGenerateWithOpenAI(prompt);

  if (aiText) {
    try {
      const parsed = JSON.parse(aiText) as Array<{
        tone: string;
        subject: string;
        body: string;
        reasoning: string;
      }>;

      return parsed.map((draft, index) => ({
        generatedSubject: draft.subject,
        generatedBody: draft.body,
        tone: draft.tone,
        contextSourcesJson: {
          contextSnippets,
          availability: params.availability.slots,
          source: "openai",
          reasoning: draft.reasoning,
          rank: index + 1,
        },
      }));
    } catch (error) {
      console.error("Failed to parse OpenAI draft JSON, using fallback drafts.", error);
    }
  }

  return fallbackBodies.map((draft, index) => ({
    generatedSubject: draft.subject,
    generatedBody: draft.body,
    tone: draft.tone,
    contextSourcesJson: {
      contextSnippets,
      availability: params.availability.slots,
      source: "heuristic",
      reasoning:
        index === 0
          ? "Optimized for speed."
          : index === 1
            ? "Optimized for polished clarity."
            : index === 2
              ? "Optimized for warmth."
              : "Optimized for more context and reassurance.",
    },
  }));
}

export function buildDraftPreview(
  draft: Pick<DraftSuggestion, "generatedBody" | "generatedSubject" | "tone">,
) {
  return {
    title: draft.generatedSubject,
    preview: draft.generatedBody.slice(0, 160),
    tone: draft.tone,
  };
}
