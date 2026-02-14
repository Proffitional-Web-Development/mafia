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
  className?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  disabledReason,
  onOpenTemplates,
  className,
}: ChatInputProps) {
  const t = useTranslations("chat");
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
    <div className={cn("space-y-1", className)}>
      {/* Status banner */}
      {bannerText && (
        <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-center text-xs text-text-muted">
          {bannerText}
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
            className="h-10 w-full rounded-lg border border-white/10 bg-surface/70 px-3 pe-10 text-sm text-text-primary placeholder:text-text-disabled outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/30 disabled:opacity-40"
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
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-all hover:bg-primary-dark active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          aria-label={t("send")}
        >
          <Icon name="send" variant="round" size="sm" />
        </button>
      </div>
    </div>
  );
}
