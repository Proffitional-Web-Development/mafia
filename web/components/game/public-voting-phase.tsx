"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PhaseTimer } from "@/components/ui/phase-timer";
import { StatusBanner } from "@/components/ui/status-banner";
import { UserAvatar } from "@/components/user-avatar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface PublicVotingPhaseProps {
  gameId: Id<"games">;
  currentUserId: Id<"users">;
  deadlineAt?: number;
}

export function PublicVotingPhase({
  gameId,
  currentUserId,
  deadlineAt,
}: PublicVotingPhaseProps) {
  const t = useTranslations("voting");
  const ct = useTranslations("common");

  const gameState = useQuery(api.stateMachine.getGameState, { gameId });
  const votesData = useQuery(api.publicVoting.getPublicVotes, { gameId });
  const roomState = useQuery(api.rooms.getRoomState, {
    roomId: gameState?.game.roomId as Id<"rooms">,
  });
  const castVote = useMutation(api.publicVoting.castPublicVote);
  const confirmVoting = useMutation(api.publicVoting.confirmVoting);

  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!gameState || !votesData) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-500 animate-pulse">{ct("loading")}</p>
      </div>
    );
  }

  const { me, players } = gameState;
  const isAlive = me.isAlive;
  const isOwner = roomState?.ownerId === currentUserId;

  // Build player map for display
  const playerMap = new Map(players.map((p) => [p.playerId, p]));

  // Get current user's vote from votesData
  const myVote = votesData.votes.find((v) => {
    const voter = playerMap.get(v.voterId);
    return voter?.userId === currentUserId;
  });

  const mySelectedTargetId = myVote?.isSkip
    ? "skip"
    : (myVote?.targetId ?? null);

  // Filter alive players (excluding self) as vote targets
  const alivePlayers = players.filter(
    (p) => p.isAlive && p.playerId !== me.playerId,
  );

  async function handleVoteFor(targetPlayerId: string) {
    setError(null);
    try {
      if (targetPlayerId === "skip") {
        await castVote({ gameId, isSkip: true });
      } else {
        await castVote({
          gameId,
          targetPlayerId: targetPlayerId as Id<"players">,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    setError(null);
    try {
      await confirmVoting({ gameId });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5 py-2">
      {/* Timer */}
      <PhaseTimer deadlineAt={deadlineAt} size="md" />

      {/* Title */}
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-zinc-500">
          {isAlive ? t("selectTarget") : t("deadCannotVote")}
        </p>
      </div>

      {/* Vote status */}
      <div className="text-center">
        <span className="text-xs text-zinc-400">
          {votesData.allVoted
            ? t("allVoted")
            : t("waitingForVotes", {
                voted: votesData.totalVoted,
                total: votesData.totalAlive,
              })}
        </span>
      </div>

      {/* Dead banner */}
      {!isAlive && (
        <StatusBanner message={t("deadCannotVote")} variant="dead" />
      )}

      {/* Voting grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {alivePlayers.map((player) => {
          const voteCount = votesData.tally[player.playerId] ?? 0;
          const isSelected = mySelectedTargetId === player.playerId;

          // Find who voted for this player
          const votersForPlayer = votesData.votes
            .filter((v) => v.targetId === player.playerId)
            .map((v) => {
              const voterPlayer = playerMap.get(v.voterId);
              return { id: v.voterId, name: voterPlayer?.username ?? "?" };
            });

          return (
            <button
              key={player.playerId}
              type="button"
              disabled={!isAlive}
              onClick={() => handleVoteFor(player.playerId)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
                isAlive &&
                  "cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800",
                isSelected &&
                  "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950",
                !isAlive && "opacity-50 cursor-default",
              )}
            >
              <UserAvatar
                username={player.username}
                avatarUrl={player.avatarUrl ?? undefined}
                size={48}
              />
              <span className="text-xs font-medium truncate max-w-full">
                {player.username}
              </span>

              {/* Vote count badge */}
              {voteCount > 0 && (
                <span className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {voteCount}
                </span>
              )}

              {/* Voter names */}
              {votersForPlayer.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-1">
                  {votersForPlayer.map((voter) => (
                    <span
                      key={voter.id}
                      className="text-[9px] bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded px-1"
                    >
                      {voter.name}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}

        {/* Skip vote option */}
        {isAlive && (
          <button
            type="button"
            onClick={() => handleVoteFor("skip")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border border-dashed p-3 transition-all cursor-pointer",
              "hover:bg-zinc-100 dark:hover:bg-zinc-800",
              mySelectedTargetId === "skip" &&
                "ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-950",
            )}
          >
            <span className="text-3xl">🚫</span>
            <span className="text-xs font-medium">{t("skipVote")}</span>
            {votesData.skipCount > 0 && (
              <span className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {votesData.skipCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Current vote indicator */}
      {myVote && (
        <p className="text-center text-xs text-zinc-500">
          {t("yourVote")}:{" "}
          {myVote.isSkip
            ? t("skipVote")
            : myVote.targetId
              ? (playerMap.get(myVote.targetId)?.username ?? "?")
              : "?"}
        </p>
      )}

      {/* Owner confirm button */}
      {isOwner && isAlive && (
        <div className="flex justify-center">
          <Button size="lg" onClick={handleConfirm} disabled={confirming}>
            {confirming ? ct("loading") : t("confirmResults")}
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
