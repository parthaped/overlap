import type { FocusBucket, MessageThread } from "@prisma/client";

type MinimalMessage = {
  subject: string;
  bodyText: string | null;
  snippet: string | null;
  direction: "INBOUND" | "OUTBOUND";
};

export type ThreadAnalysis = {
  focusBucket: FocusBucket;
  aiPriorityScore: number;
  needsReply: boolean;
  waitingOnOther: boolean;
  summary: string;
  reasons: string[];
  actionItems: string[];
};

const newsletterPattern = /newsletter|unsubscribe|digest|promo|promotion|sale/i;
const urgencyPattern = /urgent|deadline|friday|today|tomorrow|asap|confirm/i;
const meetingPattern = /meeting|schedule|availability|time slot|calendar/i;
const financePattern = /invoice|bill|payment|expense|receipt/i;

export function analyzeThread(
  thread: Pick<MessageThread, "normalizedSubject">,
  messages: MinimalMessage[],
  preferredSignals: string[] = [],
): ThreadAnalysis {
  const latest = messages[0];
  const inbound = messages.find((message) => message.direction === "INBOUND");
  const subjectAndBody = `${thread.normalizedSubject}\n${messages
    .map((message) => `${message.subject}\n${message.bodyText ?? message.snippet ?? ""}`)
    .join("\n")}`;

  const reasons: string[] = [];
  const actionItems: string[] = [];
  let score = 40;
  let needsReply = Boolean(inbound);
  let waitingOnOther = latest?.direction === "OUTBOUND";
  let bucket: FocusBucket = "OTHER";

  if (newsletterPattern.test(subjectAndBody)) {
    score -= 25;
    reasons.push("Looks like a newsletter or bulk update");
    needsReply = false;
    waitingOnOther = false;
  }

  if (urgencyPattern.test(subjectAndBody)) {
    score += 22;
    reasons.push("Mentions a time-sensitive deadline");
  }

  if (meetingPattern.test(subjectAndBody)) {
    score += 18;
    reasons.push("Contains a scheduling or meeting request");
    actionItems.push("Reply with availability");
  }

  if (financePattern.test(subjectAndBody)) {
    score += 16;
    reasons.push("Relates to finance or billing");
  }

  if (preferredSignals.some((signal) => subjectAndBody.toLowerCase().includes(signal.toLowerCase()))) {
    score += 12;
    reasons.push("Matches your priority preferences");
  }

  if (latest?.direction === "INBOUND" && needsReply) {
    bucket = "NEEDS_REPLY";
    score += 8;
  } else if (waitingOnOther) {
    bucket = "WAITING_ON";
    reasons.push("You sent the latest message and may be waiting on a response");
  } else if (score >= 75) {
    bucket = "FOCUS";
  }

  if (newsletterPattern.test(subjectAndBody)) {
    bucket = "OTHER";
  }

  const summary =
    latest?.snippet ??
    latest?.bodyText?.slice(0, 180) ??
    "A cross-provider conversation inside your unified inbox.";

  return {
    focusBucket: bucket,
    aiPriorityScore: Math.max(8, Math.min(100, score)),
    needsReply,
    waitingOnOther,
    summary,
    reasons,
    actionItems,
  };
}
