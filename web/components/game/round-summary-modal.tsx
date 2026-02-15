"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { PrimaryButton } from "@/components/ui/primary-button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { playRoundEndCue } from "@/lib/phase-audio";

interface RoundSummaryModalProps {
  gameId: Id<"games">;
  round: number;
  open: boolean;
  onClose: () => void;
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

function iconForEventType(eventType: string) {
  if (eventType === "VOTE_ELIMINATION" || eventType === "MAFIA_ELIMINATION") {
    return "dangerous";
  }
  if (eventType === "GIRL_PROTECTION" || eventType === "MAFIA_FAILED_ELIMINATION") {
    return "shield";
  }
  if (
    eventType === "SHEIKH_INVESTIGATION" ||
    eventType === "SHEIKH_INVESTIGATION_CITIZEN" ||
    eventType === "SHEIKH_INVESTIGATION_MAFIA"
  ) {
    return "visibility";
  }
  if (eventType === "ROUND_END") {
    return "check_circle";
  }
  if (eventType === "VOTE_TIE" || eventType === "MAFIA_VOTE_TIE_RANDOM") {
    return "balance";
  }
  if (eventType === "OWNER_PROMOTED_COORDINATOR") {
    return "star";
  }
  return "info";
}

export function RoundSummaryModal({
  gameId,
  round,
  open,
  onClose,
}: RoundSummaryModalProps) {
  const tGame = useTranslations("game.roundSummary");
  const tEvents = useTranslations("events");
  const tAbilityResult = useTranslations("ability.result");
  const user = useQuery(api.users.getCurrentUser);
  const summary = useQuery(
    api.gameEvents.getRoundSummary,
    open ? { gameId, round } : "skip",
  );

  const lastCueRoundRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    if (lastCueRoundRef.current === round) return;

    const isMusicEnabled = user?.musicEnabled ?? true;
    playRoundEndCue(isMusicEnabled);
    lastCueRoundRef.current = round;
  }, [open, round, user?.musicEnabled]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  function resolveEventMessage(event: {
    eventType: string;
    messageKey: string;
    messageParams?: Record<string, unknown>;
  }) {
    if (event.eventType === "SHEIKH_INVESTIGATION_MAFIA") {
      return tGame("sheikhFound", { faction: tAbilityResult("mafia") });
    }
    if (event.eventType === "SHEIKH_INVESTIGATION_CITIZEN") {
      return tGame("sheikhFound", { faction: tAbilityResult("citizens") });
    }
    if (event.eventType === "GIRL_PROTECTION") {
      return tGame("girlProtected");
    }

    const messageKey = event.messageKey.startsWith("events.")
      ? event.messageKey.slice("events.".length)
      : event.messageKey;

    return tEvents(
      messageKey,
      toTranslationValues(
        event.messageParams as Record<string, unknown> | undefined,
      ),
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={tGame("title", { round })}
    >
      <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-zinc-900/90 p-4 shadow-2xl">
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-white">
            {tGame("title", { round })}
          </h2>
        </header>

        <div className="max-h-[55vh] space-y-2 overflow-y-auto pe-1">
          {summary === undefined ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-sm text-text-tertiary">
              {tGame("loading")}
            </div>
          ) : summary.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-sm text-text-tertiary">
              {tGame("empty")}
            </div>
          ) : (
            <ul className="space-y-2">
              {summary.map((event) => {
                return (
                  <li
                    key={event.eventId}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5">
                      <Icon name={iconForEventType(event.eventType)} size="sm" />
                    </span>
                    <p className="text-sm text-text-secondary" dir="auto">
                      {resolveEventMessage(event)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-4">
          <PrimaryButton icon="arrow_forward" onClick={onClose}>
            {tGame("continue")}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
