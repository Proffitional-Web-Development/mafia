"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { GameReportRow } from "@/components/game/game-report-row";
import { Badge } from "@/components/ui/badge";
import { BottomActionBar } from "@/components/ui/bottom-action-bar";
import { LoadingState } from "@/components/ui/loading-state";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";

interface FinishedPhaseProps {
  gameId: Id<"games">;
  currentUserId: Id<"users">;
}

export function FinishedPhase({ gameId, currentUserId }: FinishedPhaseProps) {
  const t = useTranslations("gameOver");
  const rt = useTranslations("roles");
  const ct = useTranslations("common");
  const router = useRouter();

  const gameState = useQuery(api.stateMachine.getGameState, { gameId });
  const roomState = useQuery(
    api.rooms.getRoomState,
    gameState ? { roomId: gameState.game.roomId } : "skip",
  );
  const playAgain = useMutation(api.rooms.playAgain);

  if (!gameState) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingState label={ct("loading")} compact className="max-w-xs" />
      </div>
    );
  }

  const winner = gameState.game.winnerFaction;
  const myRole = gameState.me.role;
  const didWin =
    winner === "mafia" ? myRole === "mafia" : winner === "citizens" ? myRole !== "mafia" : false;
  const isOwner = roomState?.ownerId === currentUserId;

  async function handlePlayAgain() {
    if (!isOwner || !roomState) {
      return;
    }
    await playAgain({ roomId: roomState.roomId });
  }

  return (
    <div className="flex flex-1 flex-col gap-5 pb-28 pt-2">
      <div className="rounded-2xl border p-5 text-center space-y-2 bg-gradient-to-b from-zinc-900 to-zinc-800">
        <div className="text-4xl" aria-hidden>
          {winner === "mafia" ? "🔪" : "🛡️"}
        </div>
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <p className="text-sm text-zinc-300">
          {winner ? t("winner", { faction: winner === "mafia" ? t("mafia") : t("citizens") }) : t("unknownWinner")}
        </p>
        <div className="flex justify-center">
          <Badge variant="phase">{winner === "mafia" ? t("mafia") : t("citizens")}</Badge>
        </div>
      </div>

      <section className="rounded-xl border p-3 space-y-2">
        <h3 className="text-sm font-semibold">{t("personalTitle")}</h3>
        <p className="text-sm text-zinc-500">
          {t("personalSummary", {
            role: rt(myRole as "citizen" | "mafia" | "sheikh" | "girl" | "boy"),
            result: didWin ? t("resultWin") : t("resultLose"),
          })}
        </p>
      </section>

      <section className="rounded-xl border p-3 space-y-2">
        <h3 className="text-sm font-semibold">{t("rolesTitle")}</h3>
        <div className="space-y-2">
          {gameState.players.map((player) => (
            <GameReportRow
              key={player.playerId}
              username={player.username}
              avatarUrl={player.avatarUrl ?? undefined}
              role={
                player.role
                  ? rt(player.role as "citizen" | "mafia" | "sheikh" | "girl" | "boy")
                  : t("roleHidden")
              }
              alive={player.isAlive}
              isYou={player.userId === currentUserId}
              isMafia={player.role === "mafia"}
            />
          ))}
        </div>
      </section>

      {gameState.players.some((player) => player.role === undefined) && (
        <p className="text-xs text-zinc-500 text-center">{t("revealPending")}</p>
      )}

      <BottomActionBar layout="split">
        <PrimaryButton onClick={handlePlayAgain} disabled={!isOwner} icon="refresh">
          {t("playAgain")}
        </PrimaryButton>
        <SecondaryButton variant="outline" onClick={() => router.push("/")} icon="logout">
          {t("leave")}
        </SecondaryButton>
      </BottomActionBar>

      {!isOwner && (
        <p className="text-xs text-zinc-500 text-center">{t("waitingOwner")}</p>
      )}
    </div>
  );
}
