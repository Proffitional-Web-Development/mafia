"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RoleRevealCard } from "@/components/game/role-reveal-card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { PrimaryButton } from "@/components/ui/primary-button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

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
        <LoadingState label="Distributing cards..." compact className="max-w-xs" />
      </div>
    );
  }

  const role = myRole.role;
  const roleKey = role as string;
  const icon = ROLE_ICONS[role] ?? "🎭";

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
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-25" />

      <Badge variant="phase">Card Distribution</Badge>

      {/* Card */}
      <RoleRevealCard
        revealed={revealed}
        roleName={rt(roleKey)}
        roleIcon={icon}
        description={t(`abilityDescription.${role}`)}
        onReveal={() => setRevealed(true)}
        revealLabel={rt(roleKey)}
        hiddenLabel={t("tapToReveal")}
      />

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
        <PrimaryButton icon="check" onClick={handleReady}>
          {t("ready")}
        </PrimaryButton>
      )}
      {ready && (
        <p className="text-sm text-zinc-500">{t("waitingForOthers")}</p>
      )}
    </div>
  );
}
