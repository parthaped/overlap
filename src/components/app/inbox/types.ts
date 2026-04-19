import type { FocusBucket, ThreadCategory } from "@prisma/client";

import type { BucketId } from "@/lib/ui-store";

export type InboxAccount = {
  id: string;
  providerType: string;
  providerAccountEmail: string;
  displayName: string;
  colorTag: string;
  isPrimary: boolean;
  syncStatus: string;
};

export type InboxThread = {
  id: string;
  subject: string;
  summary: string | null;
  preview: string;
  lastMessageAt: string;
  focusBucket: FocusBucket;
  category: ThreadCategory;
  needsReply: boolean;
  waitingOnOther: boolean;
  isUnread: boolean;
  isStarred: boolean;
  snoozeUntil: string | null;
  aiPriorityScore: number;
  chips: string[];
  reasons: string[];
  actionItems: string[];
  accountId: string;
  accountLabel: string;
  accountColor: string;
  senderName: string | null;
  senderEmail: string | null;
  senderDomain: string | null;
};

export type InboxMessage = {
  id: string;
  subject: string;
  bodyHtml: string | null;
  bodyText: string | null;
  direction: "INBOUND" | "OUTBOUND";
  receivedAt: string | null;
  sentAt: string | null;
  fromName: string | null;
  fromEmail: string | null;
  toJson: unknown;
};

export type ThreadDetail = {
  id: string;
  subject: string;
  summary: string | null;
  reasons: string[];
  actionItems: string[];
  chips: string[];
  category: ThreadCategory;
  focusBucket: FocusBucket;
  aiPriorityScore: number;
  messages: InboxMessage[];
};

export type InboxDraft = {
  id: string;
  threadSubject: string;
  tone: string;
  generatedSubject: string;
  generatedBody: string;
  createdAt: string;
  approvedAt: string | null;
  sentAt: string | null;
};

export type DailyBrief = {
  oneLiner: string;
  priorities: Array<{ id: string; subject: string; reason: string; score: number }>;
};

export type BucketCounts = Partial<Record<BucketId, number>>;
