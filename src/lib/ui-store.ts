"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BucketId =
  | "ALL"
  | "FOCUS"
  | "NEEDS_REPLY"
  | "WAITING_ON"
  | "UPDATES"
  | "PROMOTIONS"
  | "SOCIAL"
  | "NEWSLETTERS"
  | "SNOOZED"
  | "STARRED";

type UIState = {
  selectedThreadId: string | null;
  currentBucket: BucketId;
  selectedAccountId: string;
  overlapAiOpen: boolean;
  commandPaletteOpen: boolean;
  shortcutsOpen: boolean;
  overlapAiConversationId: string | null;

  setSelectedThread: (id: string | null) => void;
  setBucket: (bucket: BucketId) => void;
  setAccount: (id: string) => void;
  toggleOverlapAi: () => void;
  setOverlapAiOpen: (v: boolean) => void;
  setCommandPaletteOpen: (v: boolean) => void;
  toggleCommandPalette: () => void;
  setShortcutsOpen: (v: boolean) => void;
  setOverlapAiConversationId: (id: string | null) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedThreadId: null,
      currentBucket: "FOCUS",
      selectedAccountId: "all",
      overlapAiOpen: false,
      commandPaletteOpen: false,
      shortcutsOpen: false,
      overlapAiConversationId: null,
      setSelectedThread: (id) => set({ selectedThreadId: id }),
      setBucket: (bucket) => set({ currentBucket: bucket }),
      setAccount: (id) => set({ selectedAccountId: id }),
      toggleOverlapAi: () => set((s) => ({ overlapAiOpen: !s.overlapAiOpen })),
      setOverlapAiOpen: (v) => set({ overlapAiOpen: v }),
      setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
      toggleCommandPalette: () =>
        set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
      setShortcutsOpen: (v) => set({ shortcutsOpen: v }),
      setOverlapAiConversationId: (id) => set({ overlapAiConversationId: id }),
    }),
    {
      name: "overlap-ui-state-v2",
      partialize: (s) => ({
        currentBucket: s.currentBucket,
        selectedAccountId: s.selectedAccountId,
        overlapAiOpen: s.overlapAiOpen,
        overlapAiConversationId: s.overlapAiConversationId,
      }),
    },
  ),
);
