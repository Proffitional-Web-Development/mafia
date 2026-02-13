"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface RoleRevealPhaseProps {
  gameId: Id<"games">;
}

const ROLE_ICONS: Record<string, string> = {
  mafia: "🔪",
  citizen: "🏠",
  sheikh: "🛡️",
  girl: "🔍",
  boy: "💣",
};

const ROLE_BG: Record<string, string> = {
  mafia: "from-red-950 to-red-900",
  citizen: "from-blue-950 to-blue-900",
  sheikh: "from-emerald-950 to-emerald-900",
  girl: "from-purple-950 to-purple-900",
  boy: "from-amber-950 to-amber-900",
};

export function RoleRevealPhase({ gameId }: RoleRevealPhaseProps) {
  const t = useTranslations("roleReveal");
  const rt = useTranslations("roles");
  const myRole = useQuery(api.cardDistribution.getMyRole, { gameId });
  const mafiaTeammates = useQuery(api.cardDistribution.getMafiaTeammates, {
    gameId,
  });
  const advancePhase = useMutation(api.stateMachine.advancePhase);

  const [revealed, setRevealed] = useState(false);
  const [ready, setReady] = useState(false);

  if (!myRole) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-500 animate-pulse">
          Distributing cards...
        </p>
      </div>
    );
  }

  const role = myRole.role;
  const roleKey = role as string;
  const icon = ROLE_ICONS[role] ?? "🎭";
  const bgGradient = ROLE_BG[role] ?? "from-zinc-950 to-zinc-900";

  async function handleReady() {
    setReady(true);
    try {
      // Owner can advance from cardDistribution to discussion
      await advancePhase({ gameId, ownerOverride: true });
    } catch {
      // Not owner or phase already advanced — that's fine
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
      {/* Card */}
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className={cn(
          "relative flex h-72 w-52 flex-col items-center justify-center rounded-2xl border-2 shadow-xl transition-all duration-500",
          revealed
            ? `bg-gradient-to-b ${bgGradient} border-white/10`
            : "bg-zinc-900 border-zinc-700 hover:border-zinc-500 cursor-pointer",
        )}
        aria-label={revealed ? rt(roleKey) : t("tapToReveal")}
      >
        {revealed ? (
          <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
            <span className="text-5xl">{icon}</span>
            <span className="text-xl font-bold text-white">{rt(roleKey)}</span>
            <p className="text-xs text-white/60 text-center px-4 leading-relaxed">
              {t(`abilityDescription.${role}`)}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl">🃏</span>
            <span className="text-sm text-zinc-400">{t("tapToReveal")}</span>
          </div>
        )}
      </button>

      {/* Mafia teammates */}
      {revealed && mafiaTeammates && mafiaTeammates.length > 0 && (
        <div className="w-full max-w-xs space-y-2 rounded-xl border border-red-900/50 bg-red-950/30 p-4">
          <h3 className="text-sm font-semibold text-red-400">
            {t("mafiaTeammates")}
          </h3>
          <ul className="space-y-1">
            {mafiaTeammates.map((mate) => (
              <li
                key={mate.playerId}
                className="text-sm text-red-300 flex items-center gap-2"
              >
                <span>🔪</span>
                <span>{mate.username}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ready button */}
      {revealed && !ready && (
        <Button size="lg" onClick={handleReady}>
          {t("ready")}
        </Button>
      )}
      {ready && (
        <p className="text-sm text-zinc-500">{t("waitingForOthers")}</p>
      )}
    </div>
  );
}
