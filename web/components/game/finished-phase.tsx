"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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
        <p className="text-sm text-zinc-500 animate-pulse">{ct("loading")}</p>
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
    <div className="flex flex-1 flex-col gap-5 py-2">
      <div className="rounded-2xl border p-5 text-center space-y-2 bg-gradient-to-b from-zinc-900 to-zinc-800">
        <div className="text-4xl" aria-hidden>
          {winner === "mafia" ? "🔪" : "🛡️"}
        </div>
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <p className="text-sm text-zinc-300">
          {winner ? t("winner", { faction: winner === "mafia" ? t("mafia") : t("citizens") }) : t("unknownWinner")}
        </p>
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 border-b">
                <th className="text-start py-2">{ct("players")}</th>
                <th className="text-start py-2">{t("role")}</th>
                <th className="text-start py-2">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {gameState.players.map((player) => (
                <tr key={player.playerId} className="border-b border-zinc-800/60">
                  <td className="py-2">{player.username}</td>
                  <td className="py-2">
                    {player.role
                      ? rt(player.role as "citizen" | "mafia" | "sheikh" | "girl" | "boy")
                      : t("roleHidden")}
                  </td>
                  <td className="py-2">{player.isAlive ? ct("alive") : ct("dead")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {gameState.players.some((player) => player.role === undefined) && (
        <p className="text-xs text-zinc-500 text-center">{t("revealPending")}</p>
      )}

      <div className="flex gap-3">
        <Button className="flex-1" onClick={handlePlayAgain} disabled={!isOwner}>
          {t("playAgain")}
        </Button>
        <Button
          className="flex-1"
          variant="outline"
          onClick={() => router.push("/")}
        >
          {t("leave")}
        </Button>
      </div>

      {!isOwner && (
        <p className="text-xs text-zinc-500 text-center">{t("waitingOwner")}</p>
      )}
    </div>
  );
}
