"use client";

import { useEffect, useMemo, useState } from "react";

import { useGlobalShortcuts } from "@/components/app/keyboard-shortcuts";
import { AccountFilter } from "@/components/app/inbox/account-filter";
import { BucketTabs } from "@/components/app/inbox/bucket-tabs";
import { DailyBriefBanner } from "@/components/app/inbox/daily-brief";
import { ThreadList } from "@/components/app/inbox/thread-list";
import { ThreadReader } from "@/components/app/inbox/thread-reader";
import { useUIStore, type BucketId } from "@/lib/ui-store";

import type {
  BucketCounts,
  DailyBrief,
  InboxAccount,
  InboxThread,
  ThreadDetail,
} from "@/components/app/inbox/types";

type InboxShellProps = {
  userName: string;
  preferredTone: string;
  accounts: InboxAccount[];
  threads: InboxThread[];
  threadDetails: Record<string, ThreadDetail>;
  brief: DailyBrief;
  counts: BucketCounts;
};

const BUCKET_FILTERS: Record<BucketId, (t: InboxThread) => boolean> = {
  ALL: () => true,
  FOCUS: (t) => t.focusBucket === "FOCUS",
  NEEDS_REPLY: (t) => t.focusBucket === "NEEDS_REPLY",
  WAITING_ON: (t) => t.focusBucket === "WAITING_ON",
  UPDATES: (t) => t.focusBucket === "UPDATES" || t.category === "UPDATE",
  PROMOTIONS: (t) => t.focusBucket === "PROMOTIONS" || t.category === "PROMOTIONAL",
  SOCIAL: (t) => t.focusBucket === "SOCIAL" || t.category === "SOCIAL",
  NEWSLETTERS: (t) => t.focusBucket === "NEWSLETTERS" || t.category === "NEWSLETTER",
  STARRED: (t) => t.isStarred,
  SNOOZED: (t) => Boolean(t.snoozeUntil && new Date(t.snoozeUntil) > new Date()),
};

export function InboxShell({
  userName,
  preferredTone,
  accounts,
  threads,
  threadDetails,
  brief,
  counts,
}: InboxShellProps) {
  const currentBucket = useUIStore((s) => s.currentBucket);
  const setBucket = useUIStore((s) => s.setBucket);
  const selectedThreadId = useUIStore((s) => s.selectedThreadId);
  const setSelectedThread = useUIStore((s) => s.setSelectedThread);
  const selectedAccountId = useUIStore((s) => s.selectedAccountId);
  const [mobileReaderOpen, setMobileReaderOpen] = useState(false);

  const filteredThreads = useMemo(() => {
    const matchesBucket = BUCKET_FILTERS[currentBucket] ?? (() => true);
    return threads.filter((t) => {
      if (!matchesBucket(t)) return false;
      if (selectedAccountId !== "all" && t.accountId !== selectedAccountId) return false;
      return true;
    });
  }, [threads, currentBucket, selectedAccountId]);

  useEffect(() => {
    if (filteredThreads.length === 0) {
      if (selectedThreadId !== null) setSelectedThread(null);
      return;
    }
    const stillVisible = filteredThreads.some((t) => t.id === selectedThreadId);
    if (!stillVisible) {
      setSelectedThread(filteredThreads[0].id);
    }
  }, [filteredThreads, selectedThreadId, setSelectedThread]);

  const detail =
    selectedThreadId && threadDetails[selectedThreadId]
      ? threadDetails[selectedThreadId]
      : null;

  function selectThread(id: string) {
    setSelectedThread(id);
    setMobileReaderOpen(true);
  }

  function jumpToBucket(bucket: BucketId) {
    setBucket(bucket);
    setMobileReaderOpen(false);
  }

  function moveSelection(delta: 1 | -1) {
    if (filteredThreads.length === 0) return;
    const idx = filteredThreads.findIndex((t) => t.id === selectedThreadId);
    const nextIdx =
      idx === -1
        ? 0
        : Math.min(filteredThreads.length - 1, Math.max(0, idx + delta));
    setSelectedThread(filteredThreads[nextIdx].id);
  }

  useGlobalShortcuts({
    onNextThread: () => moveSelection(1),
    onPrevThread: () => moveSelection(-1),
    onOpenThread: () => setMobileReaderOpen(true),
    onGoFocus: () => jumpToBucket("FOCUS"),
    onGoNeedsReply: () => jumpToBucket("NEEDS_REPLY"),
    onGoWaiting: () => jumpToBucket("WAITING_ON"),
    onGoPromos: () => jumpToBucket("PROMOTIONS"),
    onGoSocial: () => jumpToBucket("SOCIAL"),
    onGoUpdates: () => jumpToBucket("UPDATES"),
    onGoNewsletters: () => jumpToBucket("NEWSLETTERS"),
  });

  return (
    <div className="flex h-[calc(100vh-3.25rem)] min-h-0 flex-col md:h-screen">
      <DailyBriefBanner
        brief={brief}
        counts={counts}
        userName={userName}
        onSelectThread={selectThread}
      />
      <AccountFilter accounts={accounts} />
      <BucketTabs counts={counts} />

      <div className="flex min-h-0 flex-1">
        <div
          className={`min-h-0 flex-1 overflow-y-auto border-r border-border/60 bg-card/20 lg:max-w-[460px] xl:max-w-[440px] ${
            mobileReaderOpen ? "hidden md:block" : "block"
          }`}
        >
          <ThreadList
            threads={filteredThreads}
            selectedId={selectedThreadId}
            onSelect={selectThread}
          />
        </div>
        <div
          className={`min-h-0 flex-1 overflow-hidden bg-background ${
            mobileReaderOpen ? "block" : "hidden md:block"
          }`}
        >
          <ThreadReader
            detail={detail}
            preferredTone={preferredTone}
            onBack={() => setMobileReaderOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
