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
  copilotOpen: boolean;
  commandPaletteOpen: boolean;
  shortcutsOpen: boolean;
  copilotConversationId: string | null;

  setSelectedThread: (id: string | null) => void;
  setBucket: (bucket: BucketId) => void;
  setAccount: (id: string) => void;
  toggleCopilot: () => void;
  setCopilotOpen: (v: boolean) => void;
  setCommandPaletteOpen: (v: boolean) => void;
  toggleCommandPalette: () => void;
  setShortcutsOpen: (v: boolean) => void;
  setCopilotConversationId: (id: string | null) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedThreadId: null,
      currentBucket: "FOCUS",
      selectedAccountId: "all",
      copilotOpen: false,
      commandPaletteOpen: false,
      shortcutsOpen: false,
      copilotConversationId: null,
      setSelectedThread: (id) => set({ selectedThreadId: id }),
      setBucket: (bucket) => set({ currentBucket: bucket }),
      setAccount: (id) => set({ selectedAccountId: id }),
      toggleCopilot: () => set((s) => ({ copilotOpen: !s.copilotOpen })),
      setCopilotOpen: (v) => set({ copilotOpen: v }),
      setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
      toggleCommandPalette: () =>
        set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
      setShortcutsOpen: (v) => set({ shortcutsOpen: v }),
      setCopilotConversationId: (id) => set({ copilotConversationId: id }),
    }),
    {
      name: "overlap-ui-state",
      partialize: (s) => ({
        currentBucket: s.currentBucket,
        selectedAccountId: s.selectedAccountId,
        copilotOpen: s.copilotOpen,
        copilotConversationId: s.copilotConversationId,
      }),
    },
  ),
);
