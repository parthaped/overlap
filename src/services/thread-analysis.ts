import type { FocusBucket, MessageThread, ThreadCategory } from "@prisma/client";

type MinimalMessage = {
  subject: string;
  bodyText: string | null;
  snippet: string | null;
  direction: "INBOUND" | "OUTBOUND";
  fromEmail?: string | null;
  fromName?: string | null;
};

export type UserSignals = {
  vipEmails: string[];
  vipDomains: string[];
  priorityKeywords: string[];
  mutedDomains: string[];
  mutedKeywords: string[];
};

export type ThreadAnalysis = {
  focusBucket: FocusBucket;
  category: ThreadCategory;
  aiPriorityScore: number;
  needsReply: boolean;
  waitingOnOther: boolean;
  summary: string;
  reasons: string[];
  actionItems: string[];
  chips: string[];
};

const PROMO_DOMAINS = new Set([
  "mailchimp.com",
  "mailchimpapp.com",
  "sendgrid.net",
  "marketo.com",
  "mktomail.com",
  "hubspot.com",
  "hubspotemail.net",
  "sparkpostmail.com",
  "constantcontact.com",
  "campaignmonitor.com",
  "klaviyomail.com",
  "amazonses.com",
  "icontact.com",
]);

const SHOPPING_DOMAINS = new Set([
  "amazon.com",
  "amazon.co.uk",
  "shopify.com",
  "etsy.com",
  "ebay.com",
  "walmart.com",
  "bestbuy.com",
  "target.com",
  "wayfair.com",
  "doordash.com",
  "ubereats.com",
  "instacart.com",
]);

const SOCIAL_DOMAINS = new Set([
  "linkedin.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "facebook.com",
  "facebookmail.com",
  "meta.com",
  "tiktok.com",
  "pinterest.com",
  "reddit.com",
  "discord.com",
  "snapchat.com",
]);

const UPDATE_DOMAINS = new Set([
  "github.com",
  "gitlab.com",
  "bitbucket.org",
  "atlassian.com",
  "atlassian.net",
  "notion.so",
  "slack.com",
  "figma.com",
  "linear.app",
  "trello.com",
  "asana.com",
  "monday.com",
  "stripe.com",
  "vercel.com",
  "netlify.com",
  "supabase.com",
  "render.com",
  "datadog.com",
  "sentry.io",
  "pagerduty.com",
]);

const NEWSLETTER_HOSTS = new Set([
  "substack.com",
  "beehiiv.com",
  "convertkit.com",
  "ck.page",
  "revue.co",
  "buttondown.email",
  "ghost.io",
  "morningbrew.com",
]);

const NO_REPLY_LOCAL_PARTS = new Set([
  "no-reply",
  "noreply",
  "do-not-reply",
  "donotreply",
  "notifications",
  "notify",
  "alerts",
  "updates",
  "support",
  "billing",
  "receipts",
  "team",
  "hello",
  "info",
]);

const tier1Keywords = [
  "contract",
  "legal",
  "lawsuit",
  "subpoena",
  "board meeting",
  "term sheet",
  "offer letter",
  "incident",
  "outage",
  "down",
  "p0",
  "p1",
  "sev1",
  "sev-1",
  "production",
  "security",
  "breach",
  "vulnerability",
  "fraud",
  "wire transfer",
  "ceo",
  "cfo",
  "investor",
];

const urgencyPattern = /\burgent\b|\basap\b|\bdeadline\b|\bby (?:eod|today|tomorrow|friday|monday|tuesday|wednesday|thursday)\b|\bplease confirm\b|\btime[- ]sensitive\b/i;
const meetingPattern = /\bmeeting\b|\bschedule\b|\bavailability\b|\btime slot\b|\bcalendar\b|\bcalendly\b|\b\d{1,2}(:\d{2})?\s?(am|pm)\b/i;
const financePattern = /\binvoice\b|\bpayment\b|\bbill(ing)?\b|\breceipt\b|\bexpense\b|\brefund\b|\bcharged?\b/i;
const newsletterHints = /unsubscribe|view in browser|email preferences|manage preferences|you are receiving this/i;
const promoHints = /\b\d+%\s?off\b|\bsale\b|\bdeal\b|\bcoupon\b|\bdiscount\b|\bpromo\b|\bblack friday\b|\bcyber monday\b|\blimited time\b/i;
const socialHints = /\binvite(d)? you\b|\btagged you\b|\bcommented on\b|\bnew connection\b|\bfollowed you\b|\bliked your\b|\bfriend request\b/i;
const updateHints = /\bdeployed\b|\bbuild (succeeded|failed)\b|\bnew comment\b|\bassigned to you\b|\bmerged your pull request\b|\bopened (a|an) (issue|pull request)\b|\bnew login\b|\bsecurity alert\b/i;

function parseDomain(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  return email.slice(at + 1).toLowerCase().trim();
}

function localPart(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at < 0) return email.toLowerCase();
  return email.slice(0, at).toLowerCase();
}

function rootDomain(domain: string | null): string | null {
  if (!domain) return null;
  const parts = domain.split(".").filter(Boolean);
  if (parts.length <= 2) return domain;
  // Heuristic: take last 2 segments (foo.bar.com -> bar.com).
  return parts.slice(-2).join(".");
}

function matchAnyDomain(domain: string | null, set: Set<string>): boolean {
  if (!domain) return false;
  const root = rootDomain(domain);
  return set.has(domain) || (root !== null && set.has(root));
}

function matchUserDomainList(domain: string | null, list: string[]): boolean {
  if (!domain) return false;
  const root = rootDomain(domain);
  const norm = list.map((d) => d.toLowerCase().trim()).filter(Boolean);
  return norm.includes(domain) || (root !== null && norm.includes(root));
}

function matchUserEmailList(email: string | null, list: string[]): boolean {
  if (!email) return false;
  const norm = list.map((e) => e.toLowerCase().trim()).filter(Boolean);
  return norm.includes(email.toLowerCase());
}

function ensureSignals(input?: Partial<UserSignals> | string[] | null): UserSignals {
  if (!input) {
    return {
      vipEmails: [],
      vipDomains: [],
      priorityKeywords: [],
      mutedDomains: [],
      mutedKeywords: [],
    };
  }
  // Backwards compat: a plain string array used to mean priority keywords.
  if (Array.isArray(input)) {
    return {
      vipEmails: [],
      vipDomains: [],
      priorityKeywords: input,
      mutedDomains: [],
      mutedKeywords: [],
    };
  }
  return {
    vipEmails: input.vipEmails ?? [],
    vipDomains: input.vipDomains ?? [],
    priorityKeywords: input.priorityKeywords ?? [],
    mutedDomains: input.mutedDomains ?? [],
    mutedKeywords: input.mutedKeywords ?? [],
  };
}

export function analyzeThread(
  thread: Pick<MessageThread, "normalizedSubject">,
  messages: MinimalMessage[],
  preferred?: Partial<UserSignals> | string[] | null,
  muted?: Partial<UserSignals> | string[] | null,
): ThreadAnalysis {
  const signals = ensureSignals(preferred);
  if (Array.isArray(muted)) {
    signals.mutedKeywords.push(...muted);
  } else if (muted) {
    signals.mutedDomains.push(...(muted.mutedDomains ?? []));
    signals.mutedKeywords.push(...(muted.mutedKeywords ?? []));
  }

  const latest = messages[0];
  const inbound = messages.find((m) => m.direction === "INBOUND") ?? null;
  const fromEmail = (inbound?.fromEmail ?? latest?.fromEmail ?? null)?.toLowerCase() ?? null;
  const fromDomain = parseDomain(fromEmail);
  const fromLocal = localPart(fromEmail);

  const subjectAndBody = `${thread.normalizedSubject}\n${messages
    .map((m) => `${m.subject}\n${m.bodyText ?? m.snippet ?? ""}`)
    .join("\n")}`;
  const lower = subjectAndBody.toLowerCase();

  const reasons: string[] = [];
  const actionItems: string[] = [];
  const chips: string[] = [];

  let score = 40;
  let needsReply = Boolean(inbound) && latest?.direction === "INBOUND";
  let waitingOnOther = latest?.direction === "OUTBOUND";
  let bucket: FocusBucket = "OTHER";
  let category: ThreadCategory = "PRIMARY";

  // ---- 1. Hard overrides: VIP first, then mute. ----
  const isVipEmail = matchUserEmailList(fromEmail, signals.vipEmails);
  const isVipDomain = matchUserDomainList(fromDomain, signals.vipDomains);
  const isMutedDomain = matchUserDomainList(fromDomain, signals.mutedDomains);

  // ---- 2. Sender-domain category detection. ----
  if (matchAnyDomain(fromDomain, PROMO_DOMAINS) || matchAnyDomain(fromDomain, SHOPPING_DOMAINS)) {
    category = "PROMOTIONAL";
    chips.push("Promotional");
    score -= 20;
    needsReply = false;
    waitingOnOther = false;
  } else if (matchAnyDomain(fromDomain, SOCIAL_DOMAINS)) {
    category = "SOCIAL";
    chips.push("Social");
    score -= 15;
    needsReply = false;
    waitingOnOther = false;
  } else if (matchAnyDomain(fromDomain, UPDATE_DOMAINS)) {
    category = "UPDATE";
    chips.push("Update");
    score -= 8;
    needsReply = false;
  } else if (matchAnyDomain(fromDomain, NEWSLETTER_HOSTS)) {
    category = "NEWSLETTER";
    chips.push("Newsletter");
    score -= 22;
    needsReply = false;
    waitingOnOther = false;
  }

  // ---- 3. Mailbox local-part heuristics (no-reply/notifications). ----
  if (fromLocal && NO_REPLY_LOCAL_PARTS.has(fromLocal)) {
    if (category === "PRIMARY") {
      category = "UPDATE";
      chips.push("Automated");
    }
    score -= 10;
    needsReply = false;
  }

  // ---- 4. Body-content fallbacks. ----
  if (category === "PRIMARY" && newsletterHints.test(lower)) {
    category = "NEWSLETTER";
    chips.push("Newsletter");
    score -= 18;
    needsReply = false;
  }
  if (category === "PRIMARY" && promoHints.test(lower)) {
    category = "PROMOTIONAL";
    chips.push("Promotional");
    score -= 22;
    needsReply = false;
  }
  if (category === "PRIMARY" && socialHints.test(lower)) {
    category = "SOCIAL";
    chips.push("Social");
    score -= 12;
    needsReply = false;
  }
  if (category === "PRIMARY" && updateHints.test(lower)) {
    category = "UPDATE";
    chips.push("Update");
    score -= 5;
  }

  // ---- 5. Mute override: forces into Promotions even if classifier disagrees. ----
  if (isMutedDomain) {
    category = "PROMOTIONAL";
    chips.push("Muted sender");
    score = Math.min(score, 18);
    needsReply = false;
    waitingOnOther = false;
  }
  if (signals.mutedKeywords.some((k) => k && lower.includes(k.toLowerCase()))) {
    score -= 10;
    if (category === "PRIMARY") category = "PROMOTIONAL";
  }

  // ---- 6. Tier-1 keywords. ----
  const lowerStripped = ` ${lower} `;
  const tier1Hits = tier1Keywords.filter((k) => lowerStripped.includes(` ${k} `));
  if (tier1Hits.length > 0) {
    score += 30;
    reasons.push(`Mentions ${tier1Hits.slice(0, 2).join(", ")}`);
    chips.push("High-stakes");
    if (category !== "PRIMARY") {
      // Override category back to PRIMARY since this is too important to bury.
      category = "PRIMARY";
    }
  }

  // ---- 7. Tier-2 keyword bumps. ----
  if (urgencyPattern.test(subjectAndBody)) {
    score += 18;
    reasons.push("Mentions a time-sensitive deadline");
    chips.push("Deadline");
  }
  if (meetingPattern.test(subjectAndBody)) {
    score += 14;
    reasons.push("Contains a scheduling or meeting request");
    actionItems.push("Reply with availability");
    chips.push("Meeting");
  }
  if (financePattern.test(subjectAndBody)) {
    score += 12;
    reasons.push("Relates to finance or billing");
    chips.push("Finance");
  }
  if (
    signals.priorityKeywords.some(
      (k) => k && lower.includes(k.toLowerCase()),
    )
  ) {
    score += 12;
    reasons.push("Matches your priority preferences");
  }

  // ---- 8. VIP override. ----
  if (isVipEmail || isVipDomain) {
    score += 30;
    reasons.push("From a VIP sender");
    chips.unshift("VIP");
    category = "PRIMARY";
  }

  // ---- 9. Bucket assignment from category + score + reply state. ----
  if (category === "PROMOTIONAL") {
    bucket = "PROMOTIONS";
  } else if (category === "NEWSLETTER") {
    bucket = "NEWSLETTERS";
  } else if (category === "SOCIAL") {
    bucket = "SOCIAL";
  } else if (category === "UPDATE") {
    bucket = "UPDATES";
  } else if (latest?.direction === "INBOUND" && needsReply) {
    bucket = "NEEDS_REPLY";
    score += 8;
  } else if (waitingOnOther) {
    bucket = "WAITING_ON";
    reasons.push("You sent the latest message and may be waiting on a response");
  } else if (score >= 75) {
    bucket = "FOCUS";
  } else {
    bucket = "OTHER";
  }

  // VIP always escalates to FOCUS or NEEDS_REPLY and floors the score.
  if (isVipEmail || isVipDomain) {
    bucket = needsReply ? "NEEDS_REPLY" : "FOCUS";
    score = Math.max(score, 75);
  }

  const summary =
    latest?.snippet ??
    latest?.bodyText?.slice(0, 180) ??
    "A cross-provider conversation inside your unified inbox.";

  // De-duplicate chips while preserving order.
  const uniqueChips = Array.from(new Set(chips));

  return {
    focusBucket: bucket,
    category,
    aiPriorityScore: Math.max(5, Math.min(100, Math.round(score))),
    needsReply,
    waitingOnOther,
    summary,
    reasons,
    actionItems,
    chips: uniqueChips,
  };
}

export function deriveSenderFromMessage(
  message: { fromJson: unknown } | null | undefined,
): { email: string | null; domain: string | null; name: string | null } {
  if (!message?.fromJson) return { email: null, domain: null, name: null };
  const raw = message.fromJson as
    | { name?: string | null; email?: string | null }
    | Array<{ name?: string | null; email?: string | null }>;
  const first = Array.isArray(raw) ? raw[0] : raw;
  const email = first?.email?.toLowerCase().trim() ?? null;
  return {
    email,
    domain: parseDomain(email),
    name: first?.name ?? null,
  };
}
