/**
 * Backfill: re-classifies every existing thread with the new classifier so
 * Promotions / Newsletters / Social / Updates buckets and senderEmail / senderDomain
 * columns are populated. Safe to run multiple times.
 *
 *   npx tsx prisma/backfill-classification.ts
 */
import { prisma } from "../src/lib/db";
import { analyzeThread, deriveSenderFromMessage } from "../src/services/thread-analysis";

type UserSignals = {
  vipEmails: string[];
  vipDomains: string[];
  priorityKeywords: string[];
  mutedDomains: string[];
  mutedKeywords: string[];
};

function readSignals(value: unknown): Partial<UserSignals> {
  if (!value) return {};
  if (Array.isArray(value)) return { priorityKeywords: value as string[] };
  if (typeof value === "object") return value as Partial<UserSignals>;
  return {};
}

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, prioritizeJson: true, deprioritizeJson: true },
  });

  let touchedThreads = 0;
  let touchedMessages = 0;

  for (const user of users) {
    const preferred = readSignals(user.prioritizeJson);
    const muted = readSignals(user.deprioritizeJson);

    const threads = await prisma.messageThread.findMany({
      where: { userId: user.id, deletedAt: null },
      select: {
        id: true,
        normalizedSubject: true,
        messages: {
          where: { deletedAt: null },
          orderBy: [{ receivedAt: "desc" }, { sentAt: "desc" }],
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
          category: analysis.category,
          aiPriorityScore: analysis.aiPriorityScore,
          needsReply: analysis.needsReply,
          waitingOnOther: analysis.waitingOnOther,
          aiSummary: analysis.summary,
          aiReasoningJson: {
            reasons: analysis.reasons,
            chips: analysis.chips,
            actionItems: analysis.actionItems,
          },
        },
      });
      touchedThreads += 1;

      for (const m of thread.messages) {
        const sender = deriveSenderFromMessage({ fromJson: m.fromJson });
        await prisma.emailMessage.update({
          where: { id: m.id },
          data: {
            senderEmail: sender.email,
            senderDomain: sender.domain,
          },
        });
        touchedMessages += 1;
      }
    }
  }

  console.log(`Backfill complete. Threads: ${touchedThreads}, messages: ${touchedMessages}.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
