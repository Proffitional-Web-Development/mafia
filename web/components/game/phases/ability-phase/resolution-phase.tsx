"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { BoyRevenge } from "@/components/game/phases/ability-phase/boy-revenge";
import { EliminationCard } from "@/components/game/elimination-card";
import { LoadingState } from "@/components/ui/loading-state";
import { PlayerGrid } from "@/components/ui/player-grid";
import { StatusBanner } from "@/components/ui/status-banner";
import { TimerDisplay } from "@/components/ui/timer-display";
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

  if (!resolutionState) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingState label={ct("loading")} compact className="max-w-xs" />
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

  const canActAsBoy = resolutionState.isCurrentPlayerPendingBoy;
  const pendingBoyCount = resolutionState.pendingBoyRevengeIds.length;
  const hasEliminations =
    eliminatedByMainResolution.length > 0 || revengeEliminated.length > 0;

  return (
    <div className="flex flex-1 flex-col gap-5 py-2">
      <TimerDisplay
        deadlineAt={resolutionState.phaseDeadlineAt ?? deadlineAt}
        variant="progress-bar"
      />

      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-zinc-500">{t("subtitle")}</p>
      </div>

      {!hasEliminations ? (
        <StatusBanner variant="info" message={t("noElimination")} />
      ) : (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{t("resultsTitle")}</h3>
          {eliminatedByMainResolution.map((item) => (
            <EliminationCard
              key={item.playerId}
              name={item.username}
              cause={
                item.causes.length > 0
                  ? item.causes.map((cause) => t(`cause.${cause}`)).join(" • ")
                  : t("cause.unknown")
              }
            />
          ))}
          {revengeEliminated.map((player) => (
            <StatusBanner
              key={String(player.playerId)}
              variant="warning"
              message={t("boyRevengeEliminated", { name: player.username })}
            />
          ))}
        </section>
      )}

      {canActAsBoy && <BoyRevenge gameId={gameId} aliveTargets={aliveTargets} />}

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
    </div>
  );
}
