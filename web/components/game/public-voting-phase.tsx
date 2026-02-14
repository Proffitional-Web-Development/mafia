"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { Badge } from "@/components/ui/badge";
import { PlayerCard } from "@/components/ui/player-card";
import { BottomActionBar } from "@/components/ui/bottom-action-bar";
import { EmojiReactionBadge } from "@/components/game/emoji-reaction-badge";
import { EmojiReactionPicker } from "@/components/game/emoji-reaction-picker";
import { LoadingState } from "@/components/ui/loading-state";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { StatusBanner } from "@/components/ui/status-banner";
import { TimerDisplay } from "@/components/ui/timer-display";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { mapAppErrorKey } from "@/lib/error-message";
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
  const et = useTranslations("errors");

  const gameState = useQuery(api.stateMachine.getGameState, { gameId });
  const votesData = useQuery(api.publicVoting.getPublicVotes, { gameId });
  const runoffState = useQuery(api.publicVoting.getPublicVotingRunoffState, {
    gameId,
  });
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
        <LoadingState label={ct("loading")} compact className="max-w-xs" />
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

  const tiedCandidateIds = new Set(
    (runoffState?.tiedCandidates ?? []).map((candidate) => candidate.playerId),
  );
  const isRunoff = Boolean(runoffState?.isRunoff);

  // Filter alive players (excluding self) as vote targets
  const alivePlayers = players.filter(
    (p) => p.isAlive && p.playerId !== me.playerId,
  );
  const voteTargets = isRunoff
    ? alivePlayers.filter((player) => tiedCandidateIds.has(player.playerId))
    : alivePlayers;

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
      setError(et(mapAppErrorKey(e)));
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    setError(null);
    try {
      await confirmVoting({ gameId });
    } catch (e) {
      setError(et(mapAppErrorKey(e)));
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5 pb-28 pt-2">
      {/* Timer */}
      <TimerDisplay deadlineAt={deadlineAt} variant="progress-bar" />

      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-white glow-effect">{t("title")}</h2>
        <p className="text-sm text-white/60">
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

      {isRunoff ? (
        <StatusBanner
          message={t("runoffBanner", {
            round: (runoffState?.subRound ?? 0) + 1,
          })}
          variant="warning"
        />
      ) : null}

      {/* Dead banner */}
      {!isAlive && (
        <StatusBanner message={t("deadCannotVote")} variant="dead" />
      )}

      {/* Voting grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {voteTargets.map((player) => {
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
            <PlayerCard
              key={player.playerId}
              username={player.username}
              avatarUrl={player.avatarUrl}
              isSelected={isSelected}
              selectable={isAlive}
              onClick={() => handleVoteFor(player.playerId)}
              disabled={!isAlive}
              variant={isSelected ? "selected" : "voting"}
              showVoteCount={voteCount > 0}
              voteCount={voteCount}
              trailing={
                <>
                  {player.emojiReaction && (
                    <EmojiReactionBadge emoji={player.emojiReaction} />
                  )}
                  {votersForPlayer.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 mt-2 w-full">
                      {votersForPlayer.map((voter) => (
                        <span
                          key={voter.id}
                          className="text-[9px] bg-white/10 text-white/70 rounded px-1.5 py-0.5"
                        >
                          {voter.name}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              }
            />
          );
        })}

        {isAlive && !isRunoff && (
          <button
            type="button"
            onClick={() => handleVoteFor("skip")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border border-dashed p-3 transition-all cursor-pointer backdrop-blur-sm",
              "hover:bg-white/5 border-white/20",
              mySelectedTargetId === "skip" &&
                "border-warning bg-warning/20 shadow-[0_0_15px_rgba(234,179,8,0.3)]",
                mySelectedTargetId !== "skip" && "bg-surface/20"
            )}
          >
            <span className="text-3xl filter drop-shadow-md">🚫</span>
            <span className="text-xs font-medium text-white/80">{t("skipVote")}</span>
            {votesData.skipCount > 0 && (
              <Badge variant="vote-count" className="absolute -top-1 -end-1 bg-warning text-black">
                {votesData.skipCount}
              </Badge>
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
        <BottomActionBar>
          <PrimaryButton onClick={handleConfirm} disabled={confirming} icon="gavel" loading={confirming}>
            {confirming ? ct("loading") : t("confirmResults")}
          </PrimaryButton>
        </BottomActionBar>
      )}

      {isAlive && !isRunoff ? (
        <SecondaryButton variant="dashed" icon="block" onClick={() => handleVoteFor("skip") }>
          {t("skipVote")}
        </SecondaryButton>
      ) : null}

      {isAlive ? (
        <section className="space-y-2 rounded-2xl border border-white/10 bg-surface/50 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            {t("votesAgainstYou", { count: votesData.votesAgainstMe.length })}
          </h3>

          {votesData.votesAgainstMe.length === 0 ? (
            <p className="text-xs text-text-muted">{t("noVotesAgainstYou")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {votesData.votesAgainstMe.map((vote) => (
                <div
                  key={vote.voterId}
                  className="inline-flex items-center gap-1.5 rounded-full border border-danger/40 bg-danger/10 px-2 py-1 text-xs text-danger motion-safe:animate-pulse"
                >
                  <AvatarCircle
                    username={vote.voterUsername}
                    avatarUrl={vote.voterAvatarUrl ?? undefined}
                    size={20}
                  />
                  <span>{vote.voterUsername}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {/* Error */}
      {error && (
        <StatusBanner message={error} variant="error" className="text-center" />
      )}

      {/* Emoji reaction picker for alive players */}
      {isAlive && (
        <div className="flex justify-center">
          <EmojiReactionPicker
            gameId={gameId}
            currentEmoji={
              gameState.players.find((p) => p.playerId === me.playerId)
                ?.emojiReaction ?? undefined
            }
          />
        </div>
      )}
    </div>
  );
}
