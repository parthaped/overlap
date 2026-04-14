import { ProviderType } from "@prisma/client";

type DemoThread = {
  subject: string;
  normalizedSubject: string;
  bucket: "FOCUS" | "OTHER" | "NEEDS_REPLY" | "WAITING_ON";
  summary: string;
  score: number;
  labels: string[];
  messages: Array<{
    id: string;
    from: { name: string; email: string };
    to: Array<{ name: string; email: string }>;
    body: string;
    snippet: string;
    receivedAt?: string;
    sentAt?: string;
    direction: "INBOUND" | "OUTBOUND";
    isRead?: boolean;
    needsReply?: boolean;
  }>;
};

const baseThreads: Record<ProviderType, DemoThread[]> = {
  DEMO: [],
  GOOGLE: [
    {
      subject: "Quick check-in before the investor prep",
      normalizedSubject: "Quick check-in before the investor prep",
      bucket: "FOCUS",
      summary:
        "Priya sent final notes for the investor prep packet and asked for one confirmation before tonight.",
      score: 88,
      labels: ["IMPORTANT", "INBOX"],
      messages: [
        {
          id: "google-focus-1",
          from: { name: "Priya Shah", email: "priya@northbridge.vc" },
          to: [{ name: "Alex Mercer", email: "alex@atelier.studio" }],
          body:
            "Hi Alex, I folded your last edits into the investor prep packet. Could you confirm the revised metric headline before 7pm?",
          snippet: "Could you confirm the revised metric headline before 7pm?",
          receivedAt: "2026-04-13T12:15:00.000Z",
          direction: "INBOUND",
          isRead: false,
          needsReply: true,
        },
      ],
    },
    {
      subject: "April partner newsletter",
      normalizedSubject: "April partner newsletter",
      bucket: "OTHER",
      summary:
        "A low-priority newsletter with portfolio updates and event links.",
      score: 24,
      labels: ["PROMOTIONS"],
      messages: [
        {
          id: "google-other-1",
          from: { name: "Northstar News", email: "newsletter@northstarhq.com" },
          to: [{ name: "Alex Mercer", email: "alex@atelier.studio" }],
          body:
            "This month: partner highlights, three new launches, and a discount code for summit tickets.",
          snippet: "Partner highlights, launches, and summit tickets.",
          receivedAt: "2026-04-11T14:30:00.000Z",
          direction: "INBOUND",
          isRead: true,
        },
      ],
    },
  ],
  MICROSOFT: [
    {
      subject: "Following up on proposal timing",
      normalizedSubject: "Following up on proposal timing",
      bucket: "WAITING_ON",
      summary:
        "You sent the proposal on April 8 and are waiting for a response from Morgan's team.",
      score: 79,
      labels: ["SENT"],
      messages: [
        {
          id: "ms-waiting-1",
          from: { name: "Alex Mercer", email: "alex@consulting.team" },
          to: [{ name: "Morgan Lee", email: "morgan@aperture.io" }],
          body:
            "Thanks again for the conversation. Sharing the proposal here with the milestone breakdown and estimated timing.",
          snippet: "Sharing the proposal here with the milestone breakdown.",
          sentAt: "2026-04-08T16:10:00.000Z",
          direction: "OUTBOUND",
          isRead: true,
        },
      ],
    },
    {
      subject: "Board deck edits before Friday",
      normalizedSubject: "Board deck edits before Friday",
      bucket: "NEEDS_REPLY",
      summary:
        "An urgent deck review request with a Friday deadline and explicit action items.",
      score: 95,
      labels: ["IMPORTANT", "INBOX"],
      messages: [
        {
          id: "ms-reply-1",
          from: { name: "Marina Costa", email: "marina@aperture.io" },
          to: [{ name: "Alex Mercer", email: "alex@consulting.team" }],
          body:
            "Can you review the attached board deck before Friday morning? I especially need help tightening the AI operations slide and the KPI narrative.",
          snippet: "Need help tightening the AI operations slide and KPI narrative.",
          receivedAt: "2026-04-13T09:50:00.000Z",
          direction: "INBOUND",
          isRead: false,
          needsReply: true,
        },
      ],
    },
  ],
  ICLOUD: [],
  IMAP: [],
  SMTP: [],
};

export function getDemoThreads(provider: ProviderType) {
  return baseThreads[provider] ?? [];
}
