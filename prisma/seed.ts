import { FocusBucket, InboxStyle, MessageDirection, ProviderType, SyncStatus } from "@prisma/client";

import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";

async function main() {
  const passwordHash = await hashPassword("password123");

  const user = await prisma.user.upsert({
    where: { email: "demo@overlap.app" },
    update: {},
    create: {
      name: "Alex Mercer",
      email: "demo@overlap.app",
      passwordHash,
      preferredTone: "Professional but warm",
      inboxStyle: InboxStyle.BALANCED,
      rememberSessionPreference: true,
      prioritizeJson: [
        "work / professional",
        "urgent / deadlines",
        "people I reply to often",
      ],
      deprioritizeJson: ["promotions", "cold outreach", "low-value newsletters"],
      aiPreferencesJson: {
        replyFormality: "Balanced",
        sendTimeSuggestions: true,
        allowFileContext: true,
      },
      onboardedAt: new Date(),
    },
  });

  const googleAccount = await prisma.linkedEmailAccount.upsert({
    where: {
      providerType_providerAccountEmail: {
        providerType: ProviderType.GOOGLE,
        providerAccountEmail: "alex@atelier.studio",
      },
    },
    update: {},
    create: {
      userId: user.id,
      providerType: ProviderType.GOOGLE,
      providerAccountEmail: "alex@atelier.studio",
      displayName: "Atelier Studio",
      isPrimary: true,
      syncStatus: SyncStatus.ACTIVE,
      lastSyncedAt: new Date(),
      colorTag: "#5bbabd",
    },
  });

  const microsoftAccount = await prisma.linkedEmailAccount.upsert({
    where: {
      providerType_providerAccountEmail: {
        providerType: ProviderType.MICROSOFT,
        providerAccountEmail: "alex@consulting.team",
      },
    },
    update: {},
    create: {
      userId: user.id,
      providerType: ProviderType.MICROSOFT,
      providerAccountEmail: "alex@consulting.team",
      displayName: "Consulting Team",
      syncStatus: SyncStatus.ACTIVE,
      lastSyncedAt: new Date(),
      colorTag: "#f68d4f",
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { primaryAccountId: googleAccount.id },
  });

  const thread = await prisma.messageThread.upsert({
    where: { id: "demo-thread-meeting" },
    update: {},
    create: {
      id: "demo-thread-meeting",
      userId: user.id,
      normalizedSubject: "Q2 roadmap working session",
      lastMessageAt: new Date("2026-04-12T15:30:00.000Z"),
      needsReply: true,
      waitingOnOther: false,
      aiSummary:
        "John wants to book a 45-minute roadmap session next week and prefers Tuesday or Wednesday afternoon.",
      aiPriorityScore: 92,
      focusBucket: FocusBucket.NEEDS_REPLY,
      aiReasoningJson: {
        reasons: ["Contains a meeting request", "High-signal sender", "Mentions next week timing"],
      },
    },
  });

  await prisma.emailMessage.upsert({
    where: {
      linkedAccountId_providerMessageId: {
        linkedAccountId: googleAccount.id,
        providerMessageId: "gmail-1",
      },
    },
    update: {},
    create: {
      threadId: thread.id,
      linkedAccountId: googleAccount.id,
      providerMessageId: "gmail-1",
      providerThreadId: "gmail-thread-1",
      fromJson: { name: "John Park", email: "john@northstarhq.com" },
      toJson: [{ name: "Alex Mercer", email: "alex@atelier.studio" }],
      subject: "Q2 roadmap working session",
      snippet: "Could you send a few times next week?",
      bodyText:
        "Hey Alex, could you send a few times next week for a 45-minute roadmap working session? Tuesday or Wednesday afternoon would be ideal.",
      direction: MessageDirection.INBOUND,
      receivedAt: new Date("2026-04-12T15:30:00.000Z"),
      isRead: false,
      rawFolderLabelsJson: ["INBOX", "IMPORTANT"],
      aiPriorityScore: 92,
      aiClassificationJson: {
        needsReply: true,
        timeSensitive: true,
        category: "meeting",
      },
      needsReply: true,
    },
  });

  await prisma.uploadedContextFile.createMany({
    data: [
      {
        userId: user.id,
        originalName: "Availability Preferences.md",
        mimeType: "text/markdown",
        extractedText:
          "Prefer Tuesday and Wednesday afternoons for external meetings. Avoid Friday after 2pm.",
        storagePath: "seed/availability-preferences.md",
      },
      {
        userId: user.id,
        originalName: "Consulting Capabilities.txt",
        mimeType: "text/plain",
        extractedText:
          "Overlap Consulting specializes in product strategy, AI workflow design, and stakeholder facilitation.",
        storagePath: "seed/capabilities.txt",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.calendarConnection.upsert({
    where: { id: "demo-calendar-google" },
    update: {},
    create: {
      id: "demo-calendar-google",
      userId: user.id,
      providerType: ProviderType.GOOGLE,
      syncStatus: SyncStatus.ACTIVE,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "seed.demo_bootstrap",
      metadataJson: {
        accounts: [googleAccount.providerAccountEmail, microsoftAccount.providerAccountEmail],
      },
    },
  });
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
