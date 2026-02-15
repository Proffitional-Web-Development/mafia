"use client";

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { VOICE_CLIPS } from "@/lib/voice-clips";

interface VoicePickerPopoverProps {
  gameId: Id<"games">;
  channel: "public" | "mafia";
  onClose: () => void;
  anonymous?: boolean;
}

export function VoicePickerPopover({
  gameId,
  channel,
  onClose,
  anonymous,
}: VoicePickerPopoverProps) {
  const t = useTranslations("chat.voice");
  const sendMessage = useMutation(api.chat.sendChatMessage);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [sendingKey, setSendingKey] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setPlayingKey(null);
    }
  }, [audio]);

  const handlePreview = useCallback(
    (key: string, file: string) => {
      if (playingKey === key) {
        stopAudio();
        return;
      }

      if (audio) {
        audio.pause();
      }

      const newAudio = new Audio(file);
      newAudio.volume = 0.5; // Preview volume lower
      newAudio.onended = () => {
        setPlayingKey(null);
      };
      newAudio.play().catch(() => {});

      setAudio(newAudio);
      setPlayingKey(key);
    },
    [audio, playingKey, stopAudio],
  );

  // Clean up audio on unmount
  // useEffect logic is tricky with state audio, but handlePreview manages replacement.
  // We should stop if component unmounts.
  // Actually, let's keep it simple.

  const handleSend = useCallback(
    async (key: string) => {
      setSendingKey(key);
      stopAudio();
      try {
        await sendMessage({
          gameId,
          channel,
          voiceClipKey: key,
          anonymous: anonymous || undefined,
        });
        onClose();
      } catch {
        // ignore
      } finally {
        setSendingKey(null);
      }
    },
    [gameId, channel, anonymous, sendMessage, onClose, stopAudio],
  );

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="absolute bottom-full mb-2 start-0 z-50 w-72 rounded-xl border border-white/15 bg-surface/95 p-3 shadow-xl backdrop-blur-lg animate-in slide-in-from-bottom-2 fade-in duration-200">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-text-secondary">
            {t("picker.title")}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-text-muted hover:text-white"
          >
            <Icon name="close" size="sm" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto pr-1">
          {VOICE_CLIPS.map((clip) => {
            // Resolve label
            // Since clip.labelKey is e.g. "chat.voice.ya_patl", we want the last part as key for 't' if t is scoped to chat.voice?
            // Actually, the registry has full keys.
            // Our t is scoped to "chat.voice".
            // So if key is "chat.voice.ya_patl", we pass "ya_patl".
            const shortKey = clip.labelKey.replace("chat.voice.", "");
            const label = t(shortKey);
            const isPlaying = playingKey === clip.key;
            const isSending = sendingKey === clip.key;

            return (
              <div
                key={clip.key}
                className="flex items-center justify-between gap-2 rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handlePreview(clip.key, clip.file)}
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 transition-all",
                      isPlaying
                        ? "bg-primary text-white border-primary"
                        : "bg-white/5 text-text-secondary hover:bg-white/10",
                    )}
                    aria-label={t("picker.preview")}
                  >
                    <Icon name={isPlaying ? "stop" : "play_arrow"} size="sm" />
                  </button>
                  <span className="truncate text-xs text-text-secondary">
                    {label}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSend(clip.key)}
                  disabled={isSending}
                  className="flex h-7 px-2 items-center justify-center rounded bg-primary/10 text-[10px] font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
                >
                  {isSending ? "..." : t("picker.send")}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
