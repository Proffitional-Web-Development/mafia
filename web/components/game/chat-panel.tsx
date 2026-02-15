"use client";

import { useMutation, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatInput } from "@/components/game/chat-input";
import { TemplatePickerPopover } from "@/components/game/template-picker-popover";
import { VoicePickerPopover } from "@/components/game/voice-picker-popover";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { Icon } from "@/components/ui/icon";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { VOICE_CLIPS } from "@/lib/voice-clips";

type Channel = "public" | "mafia";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(timestamp: number, locale: string) {
  const diffMs = timestamp - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (absSec < 60) return rtf.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  return rtf.format(diffHour, "hour");
}

// ---------------------------------------------------------------------------
// ChatPanel
// ---------------------------------------------------------------------------

interface ChatPanelProps {
  gameId: Id<"games">;
  roomId: Id<"rooms">;
  currentUserId: Id<"users">;
  isOwner: boolean;
  open: boolean;
  onClose: () => void;
  className?: string;
}

export function ChatPanel({
  gameId,
  roomId,
  currentUserId,
  isOwner,
  open,
  onClose,
  className,
}: ChatPanelProps) {
  const t = useTranslations("chat");
  const tt = useTranslations("chat.template");
  const tVoice = useTranslations("chat.voice");
  const locale = useLocale();

  // ── State ─────────────────────────────────────────────────────────────
  const [channel, setChannel] = useState<Channel>("public");
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [playingClip, setPlayingClip] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Queries ───────────────────────────────────────────────────────────
  const chatState = useQuery(api.chat.getChatState, { gameId });
  const messages = useQuery(api.chat.getChatMessages, { gameId, channel });
  const gameState = useQuery(api.stateMachine.getGameState, { gameId });
  const sendMessage = useMutation(api.chat.sendChatMessage);
  const toggleChat = useMutation(api.chat.toggleChat);
  const muteAll = useMutation(api.chat.muteAllChat);

  const isMafia = chatState?.isMafia ?? false;
  const isAlive = chatState?.isAlive ?? true;
  const chatEnabled = chatState?.chatEnabled ?? true;
  const chatMuted = chatState?.chatMuted ?? false;

  // ── Derived ───────────────────────────────────────────────────────────
  const canSend =
    isAlive && (channel === "mafia" || (chatEnabled && !chatMuted));

  const showAnonymousToggle = isMafia && channel === "public";
  const effectiveAnonymous = showAnonymousToggle ? isAnonymous : false;

  const disabledReason:
    | "muted"
    | "disabled"
    | "eliminated"
    | "rateLimited"
    | undefined = !isAlive
    ? "eliminated"
    : rateLimited
      ? "rateLimited"
      : channel === "public" && chatMuted
        ? "muted"
        : channel === "public" && !chatEnabled
          ? "disabled"
          : undefined;

  // Players for template picker (alive, excluding self)
  const templatePlayers =
    gameState?.players
      .filter((p) => p.isAlive && p.userId !== currentUserId)
      .map((p) => ({
        playerId: p.playerId,
        username: p.username,
        avatarUrl: p.avatarUrl ?? undefined,
      })) ?? [];

  // ── Auto-scroll on new messages ───────────────────────────────────────
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (content: string) => {
      try {
        await sendMessage({
          gameId,
          channel,
          content,
          anonymous: effectiveAnonymous ? true : undefined,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("RATE_LIMITED")) {
          setRateLimited(true);
          setTimeout(() => setRateLimited(false), 5000);
        }
        throw err;
      }
    },
    [gameId, channel, sendMessage, effectiveAnonymous],
  );

  const handleToggleChat = useCallback(async () => {
    try {
      await toggleChat({ roomId, enabled: !chatEnabled });
    } catch {
      // silently ignore
    }
  }, [roomId, chatEnabled, toggleChat]);

  const handleMuteAll = useCallback(async () => {
    try {
      await muteAll({ gameId, muted: !chatMuted });
    } catch {
      // silently ignore
    }
  }, [gameId, chatMuted, muteAll]);

  const playVoiceClip = useCallback((key: string) => {
    const clip = VOICE_CLIPS.find((c) => c.key === key);
    if (!clip) return;

    const audio = new Audio(clip.file);
    audio.volume = 0.5;

    setPlayingClip(key);

    audio.onended = () => setPlayingClip(null);
    audio.play().catch(() => setPlayingClip(null));
  }, []);

  // Resolve template messages via i18n
  function resolveContent(msg: {
    content: string;
    isTemplate?: boolean;
    templateKey?: string;
    templateParams?: Record<string, string>;
  }) {
    if (msg.isTemplate && msg.templateKey) {
      const shortKey = msg.templateKey.replace("chat.template.", "");
      try {
        const params = msg.templateParams ?? {};
        return tt(shortKey, params);
      } catch {
        return msg.content; // fallback to English
      }
    }
    return msg.content;
  }

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-y-0 end-0 z-50 flex w-full flex-col border-s border-white/10 bg-background/95 backdrop-blur-xl sm:w-80",
        "motion-safe:animate-[slide-in_200ms_ease-out]",
        className,
      )}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">{t("title")}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-text-muted hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Close"
        >
          <Icon name="close" variant="round" size="sm" />
        </button>
      </header>

      {/* ── Channel tabs ─────────────────────────────────────────────── */}
      <div className="flex border-b border-white/10">
        <button
          type="button"
          onClick={() => setChannel("public")}
          className={cn(
            "flex-1 py-2 text-xs font-medium transition-colors",
            channel === "public"
              ? "border-b-2 border-primary text-primary"
              : "text-text-muted hover:text-white",
          )}
        >
          {t("channel.public")}
        </button>
        {isMafia && (
          <button
            type="button"
            onClick={() => setChannel("mafia")}
            className={cn(
              "flex-1 py-2 text-xs font-medium transition-colors",
              channel === "mafia"
                ? "border-b-2 border-danger text-danger"
                : "text-text-muted hover:text-white",
            )}
          >
            {t("channel.mafia")}
          </button>
        )}
      </div>

      {/* ── Owner controls ───────────────────────────────────────────── */}
      {isOwner && channel === "public" && (
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
          <button
            type="button"
            onClick={handleToggleChat}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-colors",
              chatEnabled
                ? "border-success/40 bg-success/15 text-success"
                : "border-white/15 bg-white/5 text-text-muted",
            )}
          >
            {t("enableChat")}
          </button>
          <button
            type="button"
            onClick={handleMuteAll}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-colors",
              chatMuted
                ? "border-danger/40 bg-danger/15 text-danger"
                : "border-white/15 bg-white/5 text-text-muted",
            )}
          >
            {t("muteAll")}
          </button>
        </div>
      )}

      {/* ── Messages ─────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-2"
      >
        {!messages || messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-text-muted">
            {t("empty")}
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            // Note: server sends isAnonymous=true effectively, but we check prop here too
            // If anonymous, render with mafia style
            const isAnon = msg.isAnonymous;
            const isVoice = msg.isVoice;
            const voiceKey = msg.voiceClipKey;

            // Resolve voice label
            let voiceLabel = null;
            if (isVoice && voiceKey) {
              try {
                voiceLabel = tVoice(voiceKey);
              } catch {
                voiceLabel = tVoice("fallback");
              }
            }

            return (
              <div
                key={msg._id}
                className={cn(
                  "flex gap-2",
                  isMe && !isAnon && "flex-row-reverse",
                )}
              >
                {isAnon ? (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger text-white">
                    <Icon
                      name="visibility_off"
                      size="sm"
                      className="text-[14px]"
                    />
                  </div>
                ) : (
                  <AvatarCircle
                    username={msg.senderUsername}
                    size={24}
                    className="shrink-0 mt-0.5"
                  />
                )}

                {isVoice && voiceKey ? (
                  <button
                    type="button"
                    className={cn(
                      "max-w-[75%] rounded-xl px-3 py-1.5 transition-colors text-start",
                      isAnon
                        ? "bg-danger/20 text-danger-light border border-danger/30"
                        : isMe
                          ? "bg-primary/20 text-white"
                          : "bg-white/5 text-text-secondary",
                      msg.isTemplate && !isAnon && "border border-white/10",
                      "cursor-pointer hover:bg-white/10",
                    )}
                    onClick={() => playVoiceClip(voiceKey)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        playVoiceClip(voiceKey);
                      }
                    }}
                  >
                    <p
                      className={cn(
                        "text-[10px] font-semibold mb-0.5",
                        isAnon ? "text-danger" : "text-text-muted",
                      )}
                    >
                      {isAnon ? t("anonymous.alias") : msg.senderUsername}
                    </p>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
                          playingClip === voiceKey
                            ? "bg-primary text-white"
                            : "bg-white/10 text-white group-hover:bg-white/20",
                        )}
                      >
                        <Icon
                          name={
                            playingClip === voiceKey ? "stop" : "play_arrow"
                          }
                          size="sm"
                        />
                      </span>
                      <span className="text-xs italic select-none">
                        {voiceLabel}
                      </span>
                    </div>

                    <p
                      className={cn(
                        "mt-0.5 text-end text-[9px]",
                        isAnon ? "text-danger/60" : "text-text-muted",
                      )}
                    >
                      {formatRelativeTime(msg.timestamp, locale)}
                    </p>
                  </button>
                ) : (
                  <div
                    className={cn(
                      "max-w-[75%] rounded-xl px-3 py-1.5 transition-colors", // Added transition
                      isAnon
                        ? "bg-danger/20 text-danger-light border border-danger/30"
                        : isMe
                          ? "bg-primary/20 text-white"
                          : "bg-white/5 text-text-secondary",
                      msg.isTemplate && !isAnon && "border border-white/10",
                    )}
                  >
                    <p
                      className={cn(
                        "text-[10px] font-semibold mb-0.5",
                        isAnon ? "text-danger" : "text-text-muted",
                      )}
                    >
                      {isAnon ? t("anonymous.alias") : msg.senderUsername}
                    </p>

                    <p
                      className="text-xs leading-relaxed break-words"
                      dir="auto"
                    >
                      {msg.isTemplate && (
                        <Icon
                          name="bolt"
                          variant="round"
                          size="sm"
                          className="inline-block me-1 text-warning align-text-bottom"
                        />
                      )}
                      {resolveContent(msg)}
                    </p>

                    <p
                      className={cn(
                        "mt-0.5 text-end text-[9px]",
                        isAnon ? "text-danger/60" : "text-text-muted",
                      )}
                    >
                      {formatRelativeTime(msg.timestamp, locale)}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Input area ───────────────────────────────────────────────── */}
      <div className="relative border-t border-white/10 p-3">
        {templatePickerOpen && (
          <TemplatePickerPopover
            gameId={gameId}
            channel={channel}
            players={templatePlayers}
            onClose={() => setTemplatePickerOpen(false)}
            anonymous={effectiveAnonymous}
          />
        )}

        {voicePickerOpen && (
          <VoicePickerPopover
            gameId={gameId}
            channel={channel}
            onClose={() => setVoicePickerOpen(false)}
            anonymous={effectiveAnonymous}
          />
        )}

        <ChatInput
          onSend={handleSend}
          disabled={!canSend}
          disabledReason={disabledReason}
          onOpenTemplates={
            canSend
              ? () => {
                  setTemplatePickerOpen((o) => !o);
                  setVoicePickerOpen(false);
                }
              : undefined
          }
          onOpenVoice={
            canSend
              ? () => {
                  setVoicePickerOpen((o) => !o);
                  setTemplatePickerOpen(false);
                }
              : undefined
          }
          anonymous={showAnonymousToggle ? isAnonymous : undefined}
          onToggleAnonymous={showAnonymousToggle ? setIsAnonymous : undefined}
        />
      </div>
    </div>
  );
}
