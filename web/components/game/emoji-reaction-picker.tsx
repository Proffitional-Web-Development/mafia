"use client";

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

/**
 * Keep in sync with ALLOWED_EMOJIS in convex/reactions.ts.
 * Duplicated here to avoid importing server code into client bundle.
 */
const ALLOWED_EMOJIS = [
  "😂",
  "🤣",
  "😭",
  "😢",
  "😤",
  "😡",
  "😱",
  "🤔",
  "🤨",
  "🧐",
  "😏",
  "😈",
  "👀",
  "🤫",
  "🤥",
  "💀",
  "☠️",
  "🔥",
  "❤️",
  "💔",
  "👍",
  "👎",
  "👏",
  "🙏",
  "✌️",
  "🤞",
  "🫡",
  "🫣",
  "😬",
  "🤡",
] as const;

interface EmojiReactionPickerProps {
  gameId: Id<"games">;
  /** The emoji the current player already has active (if any) */
  currentEmoji?: string;
  className?: string;
}

export function EmojiReactionPicker({
  gameId,
  currentEmoji,
  className,
}: EmojiReactionPickerProps) {
  const t = useTranslations("reactions");
  const setReaction = useMutation(api.reactions.setEmojiReaction);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSelect = useCallback(
    async (emoji: string | null) => {
      setSending(true);
      try {
        await setReaction({ gameId, emoji });
        setOpen(false);
      } catch {
        // silently ignore — backend validates
      } finally {
        setSending(false);
      }
    },
    [gameId, setReaction]
  );

  return (
    <div className={cn("relative inline-flex", className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
          currentEmoji
            ? "border-primary/40 bg-primary/15 text-white"
            : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
        )}
        aria-label={t("pickEmoji")}
      >
        {currentEmoji ? (
          <span className="text-base">{currentEmoji}</span>
        ) : (
          <>
            <Icon name="add_reaction" variant="round" size="sm" />
            <span>{t("pickEmoji")}</span>
          </>
        )}
      </button>

      {/* Emoji grid popover */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            role="button"
            tabIndex={-1}
            aria-label="Close picker"
          />

          <div className="absolute bottom-full mb-2 start-0 z-50 w-[260px] rounded-xl border border-white/15 bg-surface/95 p-2 shadow-xl backdrop-blur-lg">
            {/* Header */}
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-text-secondary">
                {t("pickEmoji")}
              </span>
              {currentEmoji && (
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  disabled={sending}
                  className="text-[10px] text-text-muted hover:text-white transition-colors"
                >
                  {t("clear")}
                </button>
              )}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-6 gap-1">
              {ALLOWED_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  disabled={sending}
                  onClick={() =>
                    handleSelect(emoji === currentEmoji ? null : emoji)
                  }
                  className={cn(
                    "flex items-center justify-center rounded-lg p-1.5 text-xl transition-all hover:bg-white/10 active:scale-90",
                    emoji === currentEmoji &&
                      "bg-primary/20 ring-1 ring-primary/50"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
