"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { DiscussionPhase } from "@/components/game/discussion-phase";
import { PhaseHeader } from "@/components/game/phase-header";
import { PublicVotingPhase } from "@/components/game/public-voting-phase";
import { RoleRevealPhase } from "@/components/game/role-reveal-phase";
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
        <p className="text-sm text-zinc-500 animate-pulse">Loading game...</p>
      </main>
    );
  }

  const { game, me } = gameState;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-4 gap-4">
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

      {(game.phase === "abilityPhase" ||
        game.phase === "mafiaVoting" ||
        game.phase === "resolution" ||
        game.phase === "endCheck") && (
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
        <div className="flex flex-1 items-center justify-center flex-col gap-4">
          <h2 className="text-2xl font-bold">{pt("finished")}</h2>
          {game.winnerFaction && (
            <p className="text-lg">
              🏆 {game.winnerFaction === "mafia" ? "Mafia" : "Citizens"} win!
            </p>
          )}
        </div>
      )}
    </main>
  );
}
