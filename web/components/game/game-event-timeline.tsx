"use client";

import { useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface GameEventTimelineProps {
  gameId: Id<"games">;
  open: boolean;
  onUnreadCountChange?: (count: number) => void;
  className?: string;
}

function formatRelativeTime(timestamp: number, locale: string) {
  const diffMs = timestamp - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSec);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (absSec < 60) return rtf.format(diffSec, "second");

  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");

  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");

  const diffDay = Math.round(diffHour / 24);
  return rtf.format(diffDay, "day");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getHighlightCandidates(params: unknown) {
  if (!params || typeof params !== "object") return [] as string[];
  const payload = params as Record<string, unknown>;
  const player =
    typeof payload.player === "string" && payload.player.trim().length > 0
      ? [payload.player]
      : [];
  const players =
    typeof payload.players === "string"
      ? payload.players
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      : [];

  return [...player, ...players].sort(
    (left, right) => right.length - left.length,
  );
}

function renderHighlightedText(text: string, candidates: string[]) {
  if (candidates.length === 0) return text;

  const pattern = candidates.map(escapeRegExp).join("|");
  if (!pattern) return text;

  const parts = text.split(new RegExp(`(${pattern})`, "g"));
  const occurrenceCount = new Map<string, number>();
  return parts.map((part) => {
    const count = (occurrenceCount.get(part) ?? 0) + 1;
    occurrenceCount.set(part, count);
    const key = `${part}-${count}`;
    const highlighted = candidates.some((candidate) => candidate === part);
    if (!highlighted) return <span key={key}>{part}</span>;

    return (
      <strong key={key} className="font-semibold text-white">
        <bdi>{part}</bdi>
      </strong>
    );
  });
}

function toTranslationValues(
  params?: Record<string, unknown>,
): Record<string, string | number | Date> {
  if (!params) return {};
  const normalized: Record<string, string | number | Date> = {};
  for (const [key, value] of Object.entries(params)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      value instanceof Date
    ) {
      normalized[key] = value;
    }
  }
  return normalized;
}

export function GameEventTimeline({
  gameId,
  open,
  onUnreadCountChange,
  className,
}: GameEventTimelineProps) {
  const t = useTranslations("events");
  const locale = useLocale();
  const events = useQuery(api.gameEvents.getGameEvents, { gameId });

  const unreadCount = useMemo(() => {
    if (!events || events.length === 0) return 0;
    return open ? 0 : events.length;
  }, [events, open]);

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [onUnreadCountChange, unreadCount]);

  const content = useMemo(() => {
    if (!events) return null;

    if (events.length === 0) {
      return (
        <output className="px-3 py-4 text-sm text-text-tertiary">
          {t("timeline.empty")}
        </output>
      );
    }

    return (
      <ul className="divide-y divide-white/10">
        {events.map((event) => {
          const messageKey = event.messageKey.startsWith("events.")
            ? event.messageKey.slice("events.".length)
            : event.messageKey;

          const message = t(
            messageKey,
            toTranslationValues(
              event.messageParams as Record<string, unknown> | undefined,
            ),
          );
          const highlighted = renderHighlightedText(
            message,
            getHighlightCandidates(event.messageParams),
          );

          return (
            <li
              key={String(event._id)}
              className="flex items-start gap-3 px-3 py-2.5"
            >
              <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-white/80">
                {t("timeline.round", { round: event.round })}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <p
                  className="text-sm leading-relaxed text-text-secondary"
                  dir="auto"
                >
                  {highlighted}
                </p>
                <p className="text-[11px] text-text-muted">
                  {formatRelativeTime(event.timestamp, locale)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }, [events, locale, t]);

  return (
    <section
      aria-label={t("timeline.title")}
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all",
        open ? "max-h-64 opacity-100" : "max-h-0 opacity-0",
        className,
      )}
    >
      <header className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <h3 className="text-sm font-semibold text-white">
          {t("timeline.title")}
        </h3>
      </header>
      <div className="max-h-64 overflow-y-auto pb-2">{content}</div>
    </section>
  );
}
