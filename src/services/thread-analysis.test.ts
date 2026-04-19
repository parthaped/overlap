import { describe, expect, it } from "vitest";

import { analyzeThread, deriveSenderFromMessage } from "@/services/thread-analysis";

function inboundMessage(opts: {
  body: string;
  fromEmail?: string;
  fromName?: string;
  subject?: string;
}) {
  return {
    subject: opts.subject ?? "Test subject",
    bodyText: opts.body,
    snippet: opts.body.slice(0, 80),
    direction: "INBOUND" as const,
    fromEmail: opts.fromEmail ?? "sender@example.com",
    fromName: opts.fromName ?? "Sender",
  };
}

describe("analyzeThread", () => {
  it("buckets a Mailchimp-domain newsletter into PROMOTIONS", () => {
    const result = analyzeThread(
      { normalizedSubject: "Spring sale: 30% off" },
      [
        inboundMessage({
          subject: "Spring sale: 30% off",
          body: "Don't miss our 30% off sale this weekend. Unsubscribe here.",
          fromEmail: "deals@news.mailchimp.com",
        }),
      ],
    );

    expect(result.category).toBe("PROMOTIONAL");
    expect(result.focusBucket).toBe("PROMOTIONS");
    expect(result.needsReply).toBe(false);
    expect(result.aiPriorityScore).toBeLessThan(50);
  });

  it("buckets GitHub notifications into UPDATES", () => {
    const result = analyzeThread(
      { normalizedSubject: "[repo] PR opened" },
      [
        inboundMessage({
          subject: "[repo] PR opened",
          body: "user opened a pull request in your-org/repo.",
          fromEmail: "notifications@github.com",
        }),
      ],
    );

    expect(result.category).toBe("UPDATE");
    expect(result.focusBucket).toBe("UPDATES");
  });

  it("buckets LinkedIn invites into SOCIAL", () => {
    const result = analyzeThread(
      { normalizedSubject: "John invited you to connect" },
      [
        inboundMessage({
          subject: "John invited you to connect",
          body: "John would like to connect with you on LinkedIn.",
          fromEmail: "invitations@linkedin.com",
        }),
      ],
    );

    expect(result.category).toBe("SOCIAL");
    expect(result.focusBucket).toBe("SOCIAL");
  });

  it("escalates VIP senders to FOCUS even when subject looks promotional", () => {
    const result = analyzeThread(
      { normalizedSubject: "Sale: 20% off our service" },
      [
        inboundMessage({
          body: "FYI our team launched a 20% off sale.",
          fromEmail: "ceo@northbridge.vc",
        }),
      ],
      { vipDomains: ["northbridge.vc"] },
    );

    expect(result.category).toBe("PRIMARY");
    expect(result.focusBucket).toBe("FOCUS");
    expect(result.chips).toContain("VIP");
    expect(result.aiPriorityScore).toBeGreaterThan(70);
  });

  it("escalates tier-1 keywords (contract, legal) regardless of sender", () => {
    const result = analyzeThread(
      { normalizedSubject: "Contract redlines for review" },
      [
        inboundMessage({
          subject: "Contract redlines for review",
          body: "Please review the contract redlines from our legal team before EOD.",
          fromEmail: "lawyer@randomfirm.com",
        }),
      ],
    );

    expect(result.aiPriorityScore).toBeGreaterThan(75);
    expect(result.chips).toContain("High-stakes");
  });

  it("forces muted domains into PROMOTIONS even if not obviously promo", () => {
    const result = analyzeThread(
      { normalizedSubject: "Weekly product update" },
      [
        inboundMessage({
          body: "Here is your weekly product update from us.",
          fromEmail: "team@noisy-vendor.com",
        }),
      ],
      undefined,
      { mutedDomains: ["noisy-vendor.com"] },
    );

    expect(result.focusBucket).toBe("PROMOTIONS");
    expect(result.chips).toContain("Muted sender");
  });

  it("flags meeting requests with the Meeting chip", () => {
    const result = analyzeThread(
      { normalizedSubject: "Quick chat next week?" },
      [
        inboundMessage({
          body: "Could we schedule a 30 minute meeting next Tuesday at 3pm?",
          fromEmail: "colleague@partner.io",
        }),
      ],
    );

    expect(result.chips).toContain("Meeting");
    expect(result.actionItems).toContain("Reply with availability");
  });

  it("classifies an outbound-only thread as WAITING_ON", () => {
    const result = analyzeThread(
      { normalizedSubject: "Following up" },
      [
        {
          subject: "Following up",
          bodyText: "Just bumping this back to the top.",
          snippet: "Just bumping this back to the top.",
          direction: "OUTBOUND",
          fromEmail: "me@mine.com",
        },
      ],
    );

    expect(result.focusBucket).toBe("WAITING_ON");
    expect(result.waitingOnOther).toBe(true);
  });
});

describe("deriveSenderFromMessage", () => {
  it("extracts email + domain from a single-object fromJson", () => {
    expect(
      deriveSenderFromMessage({
        fromJson: { name: "Jane", email: "Jane@Example.COM" },
      }),
    ).toEqual({ email: "jane@example.com", domain: "example.com", name: "Jane" });
  });

  it("extracts from an array fromJson", () => {
    expect(
      deriveSenderFromMessage({
        fromJson: [{ name: "A", email: "a@b.io" }, { name: "B", email: "b@c.io" }],
      }),
    ).toEqual({ email: "a@b.io", domain: "b.io", name: "A" });
  });

  it("returns nulls when fromJson is empty", () => {
    expect(deriveSenderFromMessage(null)).toEqual({
      email: null,
      domain: null,
      name: null,
    });
  });
});
