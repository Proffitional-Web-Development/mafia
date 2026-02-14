"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { GirlAbility } from "@/components/game/phases/ability-phase/girl-ability";
import { SheikhAbility } from "@/components/game/phases/ability-phase/sheikh-ability";
import { LoadingState } from "@/components/ui/loading-state";
import { TimerDisplay } from "@/components/ui/timer-display";
import { WaitingOverlay } from "@/components/ui/waiting-overlay";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface AbilityPhaseProps {
  gameId: Id<"games">;
  currentUserId: Id<"users">;
  deadlineAt?: number;
}

export function AbilityPhase({
  gameId,
  currentUserId,
  deadlineAt,
}: AbilityPhaseProps) {
  const t = useTranslations("ability");
  const ct = useTranslations("common");

  const abilityState = useQuery(api.abilityPhase.getAbilityPhaseState, {
    gameId,
  });

  if (!abilityState) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingState label={ct("loading")} compact className="max-w-xs" />
      </div>
    );
  }

  const effectiveDeadline = abilityState.phaseDeadlineAt ?? deadlineAt;

  if (abilityState.roleView === "waiting") {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center gap-5 py-8 text-center">
        <TimerDisplay deadlineAt={effectiveDeadline} variant="ring" />
        <WaitingOverlay
          title={t("waiting.title")}
          subtitle={t("waiting.subtitle")}
          icon="dark_mode"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 py-2">
      <TimerDisplay deadlineAt={effectiveDeadline} variant="inline" />

      {abilityState.roleView === "sheikh" ? (
        <SheikhAbility
          gameId={gameId}
          currentUserId={currentUserId}
          abilityState={abilityState}
        />
      ) : (
        <GirlAbility
          gameId={gameId}
          currentUserId={currentUserId}
          abilityState={abilityState}
        />
      )}
    </div>
  );
}

export const AbilityPhaseNightTransition =
  function AbilityPhaseNightTransition() {
    const t = useTranslations("ability");

    return (
      <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
        <span className="animate-pulse">🌙</span>
        <span>{t("transition")}</span>
        <span className="animate-pulse [animation-delay:200ms]">🔪</span>
      </div>
    );
  };
