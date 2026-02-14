"use client";

import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 500;

interface ChatInputProps {
  onSend: (content: string) => void | Promise<void>;
  disabled?: boolean;
  disabledReason?: "muted" | "disabled" | "eliminated" | "rateLimited";
  onOpenTemplates?: () => void;
  onOpenVoice?: () => void;
  anonymous?: boolean;
  onToggleAnonymous?: (value: boolean) => void;
  className?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  disabledReason,
  onOpenTemplates,
  onOpenVoice,
  anonymous,
  onToggleAnonymous,
  className,
}: ChatInputProps) {
  const t = useTranslations("chat");
  const tAnon = useTranslations("chat.anonymous");
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const bannerText = disabledReason
    ? disabledReason === "muted"
      ? t("muted")
      : disabledReason === "disabled"
        ? t("disabled")
        : disabledReason === "eliminated"
          ? t("eliminated")
          : disabledReason === "rateLimited"
            ? t("rateLimited")
            : null
    : null;

  const handleSend = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setValue("");
      inputRef.current?.focus();
    } catch {
      // handled by parent
    } finally {
      setSending(false);
    }
  }, [value, disabled, sending, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className={cn("space-y-2", className)}>
      {/* Anonymous Toggle (Mafia only) */}
      {onToggleAnonymous && (
        <div className="flex items-center justify-between rounded-lg bg-surface/50 px-2 py-1.5 border border-white/5">
          <span className="text-[10px] text-text-muted font-medium">
            {tAnon("sendAs")}
          </span>
          <div className="flex items-center gap-1 rounded-md bg-black/20 p-0.5">
            <button
              type="button"
              onClick={() => onToggleAnonymous(false)}
              className={cn(
                "px-2 py-0.5 text-[10px] font-medium rounded transition-all",
                !anonymous
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-muted hover:text-white",
              )}
            >
              {tAnon("sendAsYou")}
            </button>
            <button
              type="button"
              onClick={() => onToggleAnonymous(true)}
              className={cn(
                "px-2 py-0.5 text-[10px] font-medium rounded transition-all",
                anonymous
                  ? "bg-danger text-white shadow-sm"
                  : "text-text-muted hover:text-white",
              )}
            >
              {tAnon("sendAsMafia")}
            </button>
          </div>
        </div>
      )}

      {/* Status banner */}
      {bannerText && (
        <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-center text-xs text-text-muted">
          {bannerText}
        </div>
      )}

      {/* Anonymous Active Indicator */}
      {anonymous && !bannerText && (
        <div className="flex items-center justify-center gap-1.5 rounded-lg bg-danger/10 border border-danger/20 px-3 py-1 text-[10px] text-danger font-medium animate-pulse">
          <Icon name="visibility_off" size="sm" className="text-[12px]" />
          {tAnon("active")}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {/* Template picker trigger */}
        {onOpenTemplates && (
          <button
            type="button"
            onClick={onOpenTemplates}
            disabled={disabled}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-text-secondary transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
            aria-label="Templates"
          >
            <Icon name="bolt" variant="round" size="sm" />
          </button>
        )}

        {/* Voice picker trigger */}
        {onOpenVoice && (
          <button
            type="button"
            onClick={onOpenVoice}
            disabled={disabled}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-text-secondary transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
            aria-label="Voice Messages"
          >
            <Icon name="mic" variant="round" size="sm" />
          </button>
        )}

        {/* Input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={t("placeholder")}
            className={cn(
              "h-10 w-full rounded-lg border bg-surface/70 px-3 pe-10 text-sm outline-none transition-all disabled:opacity-40",
              anonymous
                ? "border-danger/30 focus:border-danger/60 focus:ring-1 focus:ring-danger/30 text-danger placeholder:text-danger/40"
                : "border-white/10 text-text-primary placeholder:text-text-disabled focus:border-primary/50 focus:ring-1 focus:ring-primary/30",
            )}
            maxLength={MAX_LENGTH}
            dir="auto"
          />
          {/* Character counter */}
          {value.length > MAX_LENGTH * 0.8 && (
            <span className="absolute end-2 top-1/2 -translate-y-1/2 text-[10px] text-text-muted">
              {value.length}/{MAX_LENGTH}
            </span>
          )}
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !value.trim() || sending}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none",
            anonymous
              ? "bg-danger hover:bg-danger-dark"
              : "bg-primary hover:bg-primary-dark",
          )}
          aria-label={t("send")}
        >
          <Icon name="send" variant="round" size="sm" />
        </button>
      </div>
    </div>
  );
}
