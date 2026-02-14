"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Tracks unread chat messages. Returns the count of messages received since
 * the panel was last opened (or since mount).
 */
export function useChatUnread(gameId: Id<"games">, isPanelOpen: boolean) {
  const publicMessages = useQuery(api.chat.getChatMessages, {
    gameId,
    channel: "public",
  });
  const mafiaMessages = useQuery(api.chat.getChatMessages, {
    gameId,
    channel: "mafia",
  });

  const allMessages = [...(publicMessages ?? []), ...(mafiaMessages ?? [])];
  const unread = isPanelOpen ? 0 : allMessages.length;

  return unread;
}
