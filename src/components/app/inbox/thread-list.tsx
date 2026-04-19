"use client";

import { Inbox } from "lucide-react";

import type { InboxThread } from "@/components/app/inbox/types";

import { ThreadRow } from "@/components/app/inbox/thread-row";

type ThreadListProps = {
  threads: InboxThread[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyMessage?: string;
};

export function ThreadList({ threads, selectedId, onSelect, emptyMessage }: ThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background">
          <Inbox className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
        </span>
        <p className="max-w-xs text-sm text-muted-foreground">
          {emptyMessage ?? "Nothing here. Try another bucket or ask Overlap AI."}
        </p>
      </div>
    );
  }

  return (
    <div role="list" className="divide-y divide-border/40">
      {threads.map((thread) => (
        <ThreadRow
          key={thread.id}
          thread={thread}
          active={thread.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
