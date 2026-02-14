"use client";

import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
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

  const [lastSeenAt, setLastSeenAt] = useState(() => Date.now());
  const initialised = useRef(false);

  // Mark messages as read when the panel is opened
  useEffect(() => {
    if (isPanelOpen) {
      setLastSeenAt(Date.now());
    }
  }, [isPanelOpen]);

  // Prevent counting messages that existed before mount
  useEffect(() => {
    if (!initialised.current && (publicMessages || mafiaMessages)) {
      setLastSeenAt(Date.now());
      initialised.current = true;
    }
  }, [publicMessages, mafiaMessages]);

  const allMessages = [...(publicMessages ?? []), ...(mafiaMessages ?? [])];
  const unread = allMessages.filter((m) => m.timestamp > lastSeenAt).length;

  return unread;
}
