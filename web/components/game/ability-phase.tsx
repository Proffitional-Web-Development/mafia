"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { InvestigationLog } from "@/components/game/investigation-log";
import { LoadingState } from "@/components/ui/loading-state";
import { PlayerGrid } from "@/components/ui/player-grid";
import { PrimaryButton } from "@/components/ui/primary-button";
import { StatusBanner } from "@/components/ui/status-banner";
import { TimerDisplay } from "@/components/ui/timer-display";
import { WaitingOverlay } from "@/components/ui/waiting-overlay";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { mapAppErrorKey } from "@/lib/error-message";

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
  const et = useTranslations("errors");

  const abilityState = useQuery(api.abilityPhase.getAbilityPhaseState, {
    gameId,
  });
  const runSheikhAbility = useMutation(api.abilityPhase.useSheikhAbility);
  const runGirlAbility = useMutation(api.abilityPhase.useGirlAbility);

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [girlProtectedMessage, setGirlProtectedMessage] = useState<string | null>(
    null,
  );

  if (!abilityState) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingState label={ct("loading")} compact className="max-w-xs" />
      </div>
    );
  }

  const effectiveDeadline = abilityState.phaseDeadlineAt ?? deadlineAt;

  async function handleSheikhInvestigate() {
    if (!selectedTargetId) {
      return;
    }
    setActing(true);
    setError(null);
    try {
      await runSheikhAbility({
        gameId,
        targetPlayerId: selectedTargetId as Id<"players">,
      });
    } catch (e) {
      setError(et(mapAppErrorKey(e)));
    } finally {
      setActing(false);
    }
  }

  async function handleGirlProtect() {
    if (!selectedTargetId) {
      return;
    }
    setActing(true);
    setError(null);
    try {
      await runGirlAbility({
        gameId,
        targetPlayerId: selectedTargetId as Id<"players">,
      });
      setGirlProtectedMessage(t("girl.confirmed"));
    } catch (e) {
      setError(et(mapAppErrorKey(e)));
    } finally {
      setActing(false);
    }
  }

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

  if (abilityState.roleView === "sheikh") {
    const lastResultLabel =
      abilityState.lastResult === "mafia"
        ? t("result.mafia")
        : abilityState.lastResult === "citizens"
          ? t("result.citizens")
          : null;

    const canSubmit = abilityState.canAct && Boolean(selectedTargetId) && !acting;

    return (
      <div className="flex flex-1 flex-col gap-5 py-2">
        <TimerDisplay deadlineAt={effectiveDeadline} variant="inline" />

        <div className="text-center space-y-1">
          <h2 className="text-lg font-semibold">{t("sheikh.title")}</h2>
          <p className="text-sm text-zinc-500">
            {abilityState.canAct ? t("sheikh.selectTarget") : t("sheikh.alreadyUsed")}
          </p>
        </div>

        <PlayerGrid
          players={abilityState.players}
          currentUserId={currentUserId}
          selectedId={selectedTargetId}
          onSelect={(playerId) => {
            setSelectedTargetId(playerId);
            setError(null);
          }}
          selectable={abilityState.canAct}
          showOwnerBadge={false}
        />

        <div className="flex justify-center">
          <PrimaryButton onClick={handleSheikhInvestigate} disabled={!canSubmit} icon="search" loading={acting}>
            {acting ? ct("loading") : t("sheikh.investigate")}
          </PrimaryButton>
        </div>

        {lastResultLabel && (
          <StatusBanner
            variant={abilityState.lastResult === "mafia" ? "warning" : "info"}
            message={t("result.reveal", { faction: lastResultLabel })}
          />
        )}

        <InvestigationLog
          title={t("history.title")}
          emptyLabel={t("history.empty")}
          items={abilityState.investigationHistory.map((item) => ({
            round: item.round,
            targetUsername: item.targetUsername,
            faction:
              item.faction === "mafia" ? "mafia" : "citizens",
          }))}
        />

        {error && (
          <StatusBanner message={error} variant="error" className="text-center" />
        )}
      </div>
    );
  }

  const canProtect = abilityState.canAct && Boolean(selectedTargetId) && !acting;

  return (
    <div className="flex flex-1 flex-col gap-5 py-2">
      <TimerDisplay deadlineAt={effectiveDeadline} variant="inline" />

      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold">{t("girl.title")}</h2>
        <p className="text-sm text-zinc-500">
          {abilityState.canAct ? t("girl.selectTarget") : t("girl.alreadyUsed")}
        </p>
      </div>

      <PlayerGrid
        players={abilityState.players}
        currentUserId={currentUserId}
        selectedId={selectedTargetId}
        onSelect={(playerId) => {
          setSelectedTargetId(playerId);
          setError(null);
          setGirlProtectedMessage(null);
        }}
        selectable={abilityState.canAct}
        showOwnerBadge={false}
      />

      <div className="flex justify-center">
        <PrimaryButton onClick={handleGirlProtect} disabled={!canProtect} icon="health_and_safety" loading={acting}>
          {acting ? ct("loading") : t("girl.protect")}
        </PrimaryButton>
      </div>

      {girlProtectedMessage && (
        <StatusBanner variant="info" message={girlProtectedMessage} />
      )}

      {error && (
        <StatusBanner message={error} variant="error" className="text-center" />
      )}
    </div>
  );
}

export const AbilityPhaseNightTransition = function AbilityPhaseNightTransition() {
  const t = useTranslations("ability");

  return (
    <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
      <span className="animate-pulse">🌙</span>
      <span>{t("transition")}</span>
      <span className="animate-pulse [animation-delay:200ms]">🔪</span>
    </div>
  );
};