"use client";

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AbilityPanel } from "@/components/game/phases/ability-phase/ability-panel";
import { InvestigationLog } from "@/components/game/phases/ability-phase/investigation-log";
import { StatusBanner } from "@/components/ui/status-banner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { mapAppErrorKey } from "@/lib/error-message";
import type { SheikhAbilityState } from "./types";

interface SheikhAbilityProps {
  gameId: Id<"games">;
  currentUserId: Id<"users">;
  abilityState: SheikhAbilityState;
}

export function SheikhAbility({
  gameId,
  currentUserId,
  abilityState,
}: SheikhAbilityProps) {
  const t = useTranslations("ability");
  const ct = useTranslations("common");
  const et = useTranslations("errors");

  const runSheikhAbility = useMutation(api.abilityPhase.useSheikhAbility);
  const confirmAbilityAction = useMutation(
    api.abilityPhase.confirmAbilityAction,
  );

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvestigate() {
    if (!selectedTargetId) return;
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

  async function handleConfirm() {
    setConfirming(true);
    setError(null);
    try {
      await confirmAbilityAction({ gameId });
    } catch (e) {
      setError(et(mapAppErrorKey(e)));
    } finally {
      setConfirming(false);
    }
  }

  const lastResultLabel =
    abilityState.lastResult === "mafia"
      ? t("result.mafia")
      : abilityState.lastResult === "citizens"
        ? t("result.citizens")
        : null;

  const canSubmit =
    abilityState.canAct && Boolean(selectedTargetId) && !acting;
  const canConfirm = abilityState.canConfirm && !confirming;

  return (
    <AbilityPanel
      title={t("sheikh.title")}
      subtitle={
        abilityState.canAct
          ? t("sheikh.selectTarget")
          : t("sheikh.alreadyUsed")
      }
      players={abilityState.players}
      currentUserId={currentUserId}
      selectedTargetId={selectedTargetId}
      onSelectTarget={(playerId) => {
        setSelectedTargetId(playerId);
        setError(null);
      }}
      selectable={abilityState.canAct}
      actionLabel={acting ? ct("loading") : t("sheikh.investigate")}
      actionIcon="search"
      onAction={handleInvestigate}
      actionDisabled={!canSubmit}
      actionLoading={acting}
      canConfirm={abilityState.canConfirm}
      confirmLabel={confirming ? ct("loading") : ct("confirm")}
      onConfirm={handleConfirm}
      confirmDisabled={!canConfirm}
      confirmLoading={confirming}
      error={error}
    >
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
          faction: item.faction === "mafia" ? "mafia" : "citizens",
        }))}
      />
    </AbilityPanel>
  );
}
