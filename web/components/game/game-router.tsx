"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import {
  AbilityPhase,
  AbilityPhaseNightTransition,
} from "@/components/game/ability-phase";
import { DiscussionPhase } from "@/components/game/discussion-phase";
import { FinishedPhase } from "@/components/game/finished-phase";
import { PhaseTransitionController } from "@/components/game/phase-transition-controller";
import { MafiaVotingPhase } from "@/components/game/mafia-voting-phase";
import { PhaseHeader } from "@/components/game/phase-header";
import { PlayerGraveyard } from "@/components/game/player-graveyard";
import { PublicVotingPhase } from "@/components/game/public-voting-phase";
import { ResolutionPhase } from "@/components/game/resolution-phase";
import { RoleRevealPhase } from "@/components/game/role-reveal-phase";
import { LoadingState } from "@/components/ui/loading-state";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface GameRouterProps {
  gameId: Id<"games">;
  currentUserId: Id<"users">;
}

export function GameRouter({ gameId, currentUserId }: GameRouterProps) {
  const gameState = useQuery(api.stateMachine.getGameState, { gameId });
  const pt = useTranslations("phases");

  if (!gameState) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingState label="Loading game..." compact className="max-w-xs" />
      </main>
    );
  }

  const { game, me } = gameState;

  const deadPlayers = gameState.players.filter((player) => !player.isAlive);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-4 gap-4">
      <PhaseTransitionController phase={game.phase} />
      <PhaseHeader
        phase={game.phase}
        round={game.round}
        isAlive={me.isAlive}
        role={me.role}
      />

      {/* Phase-specific content */}
      {game.phase === "cardDistribution" && <RoleRevealPhase gameId={gameId} />}

      {game.phase === "discussion" && (
        <DiscussionPhase
          gameId={gameId}
          currentUserId={currentUserId}
          deadlineAt={game.phaseDeadlineAt ?? undefined}
        />
      )}

      {game.phase === "publicVoting" && (
        <PublicVotingPhase
          gameId={gameId}
          currentUserId={currentUserId}
          deadlineAt={game.phaseDeadlineAt ?? undefined}
        />
      )}

      {game.phase === "abilityPhase" && (
        <>
          <AbilityPhase
            gameId={gameId}
            currentUserId={currentUserId}
            deadlineAt={game.phaseDeadlineAt ?? undefined}
          />
          <AbilityPhaseNightTransition />
        </>
      )}

      {game.phase === "mafiaVoting" && (
        <MafiaVotingPhase
          gameId={gameId}
          currentUserId={currentUserId}
          deadlineAt={game.phaseDeadlineAt ?? undefined}
        />
      )}

      {game.phase === "resolution" && (
        <ResolutionPhase
          gameId={gameId}
          currentUserId={currentUserId}
          deadlineAt={game.phaseDeadlineAt ?? undefined}
        />
      )}

      {game.phase === "endCheck" && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-zinc-500 text-sm">
            {pt(
              game.phase as
                | "abilityPhase"
                | "mafiaVoting"
                | "resolution"
                | "endCheck",
            )}
            ...
          </p>
        </div>
      )}

      {game.phase === "finished" && (
        <FinishedPhase gameId={gameId} currentUserId={currentUserId} />
      )}

      {game.phase !== "finished" && (
        <PlayerGraveyard
          players={deadPlayers.map((player) => ({
            playerId: String(player.playerId),
            username: player.username,
            avatarUrl: player.avatarUrl ?? undefined,
          }))}
        />
      )}
    </main>
  );
}
