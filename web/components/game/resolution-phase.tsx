"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PhaseTimer } from "@/components/ui/phase-timer";
import { PlayerGrid } from "@/components/ui/player-grid";
import { StatusBanner } from "@/components/ui/status-banner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface ResolutionPhaseProps {
  gameId: Id<"games">;
  currentUserId: Id<"users">;
  deadlineAt?: number;
}

export function ResolutionPhase({
  gameId,
  currentUserId,
  deadlineAt,
}: ResolutionPhaseProps) {
  const t = useTranslations("resolution");
  const ct = useTranslations("common");

  const resolutionState = useQuery(api.resolution.getResolutionState, { gameId });
  const runBoyRevenge = useMutation(api.resolution.useBoyRevenge);

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!resolutionState) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-500 animate-pulse">{ct("loading")}</p>
      </div>
    );
  }

  const eliminatedByMainResolution = resolutionState.eliminated;
  const baseEliminatedSet = new Set(
    eliminatedByMainResolution.map((item) => item.playerId),
  );

  const revengeEliminated = resolutionState.players.filter(
    (player) =>
      player.eliminatedAtRound === resolutionState.round &&
      !baseEliminatedSet.has(String(player.playerId)),
  );

  const aliveTargets = resolutionState.players.filter(
    (player) => player.isAlive && player.userId !== currentUserId,
  );

  async function handleBoyRevenge() {
    if (!selectedTargetId) {
      return;
    }
    setActing(true);
    setError(null);
    try {
      await runBoyRevenge({
        gameId,
        targetPlayerId: selectedTargetId as Id<"players">,
      });
      setSelectedTargetId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setActing(false);
    }
  }

  const canActAsBoy = resolutionState.isCurrentPlayerPendingBoy;
  const pendingBoyCount = resolutionState.pendingBoyRevengeIds.length;
  const hasEliminations =
    eliminatedByMainResolution.length > 0 || revengeEliminated.length > 0;

  return (
    <div className="flex flex-1 flex-col gap-5 py-2">
      <PhaseTimer
        deadlineAt={resolutionState.phaseDeadlineAt ?? deadlineAt}
        size="md"
      />

      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-zinc-500">{t("subtitle")}</p>
      </div>

      {!hasEliminations ? (
        <StatusBanner variant="info" message={t("noElimination")} />
      ) : (
        <section className="rounded-xl border p-3 space-y-2">
          <h3 className="text-sm font-semibold">{t("resultsTitle")}</h3>
          <ul className="space-y-2">
            {eliminatedByMainResolution.map((item) => (
              <li
                key={item.playerId}
                className="rounded-lg border px-2 py-1.5 text-sm flex items-center justify-between gap-2"
              >
                <span>{t("eliminated", { name: item.username })}</span>
                <span className="text-xs text-zinc-500">
                  {item.causes.length > 0
                    ? item.causes
                        .map((cause) => t(`cause.${cause}`))
                        .join(" • ")
                    : t("cause.unknown")}
                </span>
              </li>
            ))}

            {revengeEliminated.map((player) => (
              <li
                key={String(player.playerId)}
                className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-sm dark:border-amber-800 dark:bg-amber-950"
              >
                {t("boyRevengeEliminated", { name: player.username })}
              </li>
            ))}
          </ul>
        </section>
      )}

      {canActAsBoy && (
        <section className="rounded-xl border p-3 space-y-3">
          <h3 className="text-sm font-semibold">{t("boyPrompt.title")}</h3>
          <p className="text-xs text-zinc-500">{t("boyPrompt.subtitle")}</p>

          <PlayerGrid
            players={aliveTargets}
            currentUserId={currentUserId}
            selectedId={selectedTargetId}
            onSelect={(playerId) => {
              setSelectedTargetId(playerId);
              setError(null);
            }}
            selectable
            showOwnerBadge={false}
          />

          <div className="flex justify-center">
            <Button
              onClick={handleBoyRevenge}
              disabled={!selectedTargetId || acting}
            >
              {acting ? ct("loading") : t("boyPrompt.confirm")}
            </Button>
          </div>
        </section>
      )}

      {!canActAsBoy && pendingBoyCount > 0 && (
        <StatusBanner variant="warning" message={t("boyPrompt.waiting")} />
      )}

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase text-zinc-500">
          {ct("players")}
        </h3>
        <PlayerGrid
          players={resolutionState.players}
          currentUserId={currentUserId}
          showOwnerBadge={false}
        />
      </section>

      <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
        <span className="animate-pulse" aria-hidden>
          ⚖️
        </span>
        <span>{t("transition")}</span>
        <span className="animate-pulse [animation-delay:200ms]" aria-hidden>
          ⏭️
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
