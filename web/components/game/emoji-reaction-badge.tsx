"use client";

import { cn } from "@/lib/utils";

interface EmojiReactionBadgeProps {
  emoji: string;
  className?: string;
}

/**
 * Floating emoji badge displayed on a player card during voting.
 * Renders with a scale-in animation on mount.
 */
export function EmojiReactionBadge({
  emoji,
  className,
}: EmojiReactionBadgeProps) {
  return (
    <span
      className={cn(
        "absolute -top-1 -start-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 text-base shadow-md ring-1 ring-white/15 backdrop-blur-sm",
        "motion-safe:animate-[scale-in_200ms_ease-out] motion-reduce:animate-none",
        className,
      )}
      aria-hidden
    >
      {emoji}
    </span>
  );
}
