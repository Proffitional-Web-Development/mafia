"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { Icon } from "@/components/ui/icon";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type Channel = "public" | "mafia";

interface TemplatePickerPopoverProps {
  gameId: Id<"games">;
  channel: Channel;
  /** Alive players for placeholder selection (excluding self) */
  players: Array<{
    playerId: Id<"players">;
    username: string;
    avatarUrl?: string;
  }>;
  onClose: () => void;
  anonymous?: boolean;
  className?: string;
}

/**
 * Two-step popover: pick a template, then optionally pick a player if the
 * template has a `{player}` placeholder.
 */
export function TemplatePickerPopover({
  gameId,
  channel,
  players,
  onClose,
  anonymous,
  className,
}: TemplatePickerPopoverProps) {
  const t = useTranslations("chat.template");
  const ct = useTranslations("chat");
  const templates = useQuery(api.chat.getTemplates, { gameId, channel });
  const sendMessage = useMutation(api.chat.sendChatMessage);

  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(
    null,
  );
  const [sending, setSending] = useState(false);

  const selectedTemplate = templates?.find(
    (tmpl) => tmpl.key === selectedTemplateKey,
  );
  const needsPlayer =
    selectedTemplate?.placeholders.includes("player") ?? false;

  const handleSelectTemplate = useCallback(
    async (key: string, placeholders: string[]) => {
      if (placeholders.includes("player")) {
        // Step 2: need player selection
        setSelectedTemplateKey(key);
      } else {
        // No placeholder — send immediately
        setSending(true);
        try {
          await sendMessage({
            gameId,
            channel,
            templateKey: key,
            templateParams: {},
            anonymous: anonymous || undefined,
          });
          onClose();
        } catch {
          // silently ignore
        } finally {
          setSending(false);
        }
      }
    },
    [gameId, channel, sendMessage, onClose, anonymous],
  );

  const handleSelectPlayer = useCallback(
    async (username: string) => {
      if (!selectedTemplateKey) return;
      setSending(true);
      try {
        await sendMessage({
          gameId,
          channel,
          templateKey: selectedTemplateKey,
          templateParams: { player: username },
          anonymous: anonymous || undefined,
        });
        onClose();
      } catch {
        // silently ignore
      } finally {
        setSending(false);
      }
    },
    [gameId, channel, selectedTemplateKey, sendMessage, onClose, anonymous],
  );

  /** Derive a short label from the template key: "chat.template.suspect" -> "suspect" */
  function templateLabel(key: string, placeholders: string[]): string {
    const shortKey = key.replace("chat.template.", "");
    try {
      // Provide placeholder defaults so next-intl doesn't throw for templates
      // like "I suspect {player}" when rendered as labels in the picker.
      const defaults: Record<string, string> = {};
      for (const ph of placeholders) {
        defaults[ph] = "___";
      }
      return t(shortKey, defaults);
    } catch {
      return shortKey;
    }
  }

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 z-40"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-label="Close"
      />

      <div
        className={cn(
          "absolute bottom-full mb-2 start-0 z-50 w-72 max-h-64 overflow-y-auto rounded-xl border border-white/15 bg-surface/95 p-2 shadow-xl backdrop-blur-lg",
          className,
        )}
      >
        {/* Step 2: Player selection */}
        {needsPlayer && selectedTemplate ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <button
                type="button"
                onClick={() => setSelectedTemplateKey(null)}
                className="text-text-muted hover:text-white transition-colors"
              >
                <Icon name="arrow_back" variant="round" size="sm" />
              </button>
              <span className="text-xs font-semibold text-text-secondary truncate">
                {templateLabel(
                  selectedTemplate.key,
                  selectedTemplate.placeholders,
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1">
              {players.map((player) => (
                <button
                  key={player.playerId}
                  type="button"
                  disabled={sending}
                  onClick={() => handleSelectPlayer(player.username)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-text-secondary transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
                >
                  <AvatarCircle
                    username={player.username}
                    avatarUrl={player.avatarUrl}
                    size={20}
                  />
                  <span className="truncate">{player.username}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Step 1: Template list */
          <div className="space-y-1">
            <span className="px-1 text-xs font-semibold text-text-secondary">
              {ct("title")}
            </span>
            {!templates ? (
              <p className="px-1 py-2 text-xs text-text-muted">…</p>
            ) : templates.length === 0 ? (
              <p className="px-1 py-2 text-xs text-text-muted">—</p>
            ) : (
              templates.map((tmpl) => (
                <button
                  key={tmpl.key}
                  type="button"
                  disabled={sending}
                  onClick={() =>
                    handleSelectTemplate(tmpl.key, tmpl.placeholders)
                  }
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start text-xs text-text-secondary transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
                >
                  {tmpl.placeholders.includes("player") && (
                    <Icon
                      name="person"
                      variant="round"
                      size="sm"
                      className="shrink-0 text-text-muted"
                    />
                  )}
                  <span dir="auto">
                    {templateLabel(tmpl.key, tmpl.placeholders)}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
