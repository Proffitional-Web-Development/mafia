"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { BottomActionBar } from "@/components/ui/bottom-action-bar";
import { LoadingState } from "@/components/ui/loading-state";
import { PrimaryButton } from "@/components/ui/primary-button";
import { StatusBanner } from "@/components/ui/status-banner";
import { TimerDisplay } from "@/components/ui/timer-display";
import { WaitingOverlay } from "@/components/ui/waiting-overlay";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { mapAppErrorKey } from "@/lib/error-message";
import { cn } from "@/lib/utils";

interface MafiaVotingPhaseProps {
  gameId: Id<"games">;
  currentUserId: Id<"users">;
  deadlineAt?: number;
}

export function MafiaVotingPhase({
  gameId,
  deadlineAt,
}: MafiaVotingPhaseProps) {
  const t = useTranslations("mafiaVoting");
  const ct = useTranslations("common");
  const et = useTranslations("errors");

  const gameState = useQuery(api.stateMachine.getGameState, { gameId });
  const castMafiaVote = useMutation(api.mafiaVoting.castMafiaVote);
  const confirmMafiaVoting = useMutation(api.mafiaVoting.confirmMafiaVoting);

  const canSeeMafiaVotes =
    gameState?.game.phase === "mafiaVoting" &&
    gameState?.me.role === "mafia" &&
    gameState?.me.isAlive;

  const mafiaVotes = useQuery(
    api.mafiaVoting.getMafiaVotes,
    canSeeMafiaVotes ? { gameId } : "skip",
  );

  const [acting, setActing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!gameState) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingState label={ct("loading")} compact className="max-w-xs" />
      </div>
    );
  }

  const effectiveDeadline = gameState.game.phaseDeadlineAt ?? deadlineAt;

  if (!canSeeMafiaVotes) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center gap-5 py-8 text-center">
        <TimerDisplay deadlineAt={effectiveDeadline} variant="ring" />
        <WaitingOverlay title={t("waiting.title")} subtitle={t("waiting.subtitle")} />
      </div>
    );
  }

  if (!mafiaVotes) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingState label={ct("loading")} compact className="max-w-xs" />
      </div>
    );
  }

  const playerById = new Map(
    gameState.players.map((player) => [player.playerId, player]),
  );

  const myVoteTargetId =
    mafiaVotes.votes.find((vote) => vote.voterId === gameState.me.playerId)?.targetId ??
    null;

  const votesByTarget = mafiaVotes.aliveTargets.map((target) => {
    const voters = mafiaVotes.votes
      .filter((vote) => vote.targetId === target.playerId)
      .map((vote) => playerById.get(vote.voterId)?.username ?? "?");
    return {
      targetId: target.playerId,
      voters,
    };
  });

  async function handleVote(targetPlayerId: Id<"players">) {
    setActing(true);
    setError(null);
    try {
      await castMafiaVote({ gameId, targetPlayerId });
    } catch (e) {
      setError(et(mapAppErrorKey(e)));
    } finally {
      setActing(false);
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    setError(null);
    try {
      await confirmMafiaVoting({ gameId });
    } catch (e) {
      setError(et(mapAppErrorKey(e)));
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5 pb-28 pt-2">
      <TimerDisplay
        deadlineAt={mafiaVotes.phaseDeadlineAt ?? deadlineAt}
        variant="progress-bar"
      />

      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-zinc-500">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {mafiaVotes.aliveTargets.map((target) => {
          const isSelected = myVoteTargetId === target.playerId;
          const tallyCount = mafiaVotes.tally[target.playerId] ?? 0;
          const voters =
            votesByTarget.find((entry) => entry.targetId === target.playerId)?.voters ?? [];

          return (
            <button
              key={target.playerId}
              type="button"
              onClick={() => handleVote(target.playerId)}
              disabled={acting}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
                "cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800",
                isSelected && "ring-2 ring-red-500 bg-red-50 dark:bg-red-950",
              )}
            >
              <span className="text-sm font-medium truncate max-w-full">
                {target.username}
              </span>
              <span className="text-xs text-zinc-500">{t("tapToVote")}</span>

              {tallyCount > 0 && (
                <Badge variant="vote-count" className="absolute -top-1 -end-1">
                  {tallyCount}
                </Badge>
              )}

              {voters.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-1">
                  {voters.map((voterName) => (
                    <span
                      key={`${target.playerId}-${voterName}`}
                      className="text-[9px] bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded px-1"
                    >
                      {voterName}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-zinc-500">
        {myVoteTargetId
          ? t("yourVote", {
              name:
                mafiaVotes.aliveTargets.find((target) => target.playerId === myVoteTargetId)
                  ?.username ?? "?",
            })
          : t("noVoteYet")}
      </p>

      <BottomActionBar>
        <PrimaryButton onClick={handleConfirm} disabled={confirming} icon="my_location" variant="danger" shimmer loading={confirming}>
          {confirming ? ct("loading") : t("confirm")}
        </PrimaryButton>
      </BottomActionBar>

      <StatusBanner message={t("secrecyHint")} variant="warning" />

      {error && (
        <StatusBanner message={error} variant="error" className="text-center" />
      )}
    </div>
  );
}
