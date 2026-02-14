"use client";

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AbilityPanel } from "@/components/game/phases/ability-phase/ability-panel";
import { StatusBanner } from "@/components/ui/status-banner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { mapAppErrorKey } from "@/lib/error-message";
import type { GirlAbilityState } from "./types";

interface GirlAbilityProps {
  gameId: Id<"games">;
  currentUserId: Id<"users">;
  abilityState: GirlAbilityState;
}

export function GirlAbility({
  gameId,
  currentUserId,
  abilityState,
}: GirlAbilityProps) {
  const t = useTranslations("ability");
  const ct = useTranslations("common");
  const et = useTranslations("errors");

  const runGirlAbility = useMutation(api.abilityPhase.useGirlAbility);
  const confirmAbilityAction = useMutation(
    api.abilityPhase.confirmAbilityAction
  );

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [protectedMessage, setProtectedMessage] = useState<string | null>(null);

  async function handleProtect() {
    if (!selectedTargetId) return;
    setActing(true);
    setError(null);
    try {
      await runGirlAbility({
        gameId,
        targetPlayerId: selectedTargetId as Id<"players">,
      });
      setProtectedMessage(t("girl.confirmed"));
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

  const canProtect =
    abilityState.canAct && Boolean(selectedTargetId) && !acting;
  const canConfirm = abilityState.canConfirm && !confirming;

  return (
    <AbilityPanel
      title={t("girl.title")}
      subtitle={
        abilityState.canAct ? t("girl.selectTarget") : t("girl.alreadyUsed")
      }
      players={abilityState.players}
      currentUserId={currentUserId}
      selectedTargetId={selectedTargetId}
      onSelectTarget={(playerId) => {
        setSelectedTargetId(playerId);
        setError(null);
        setProtectedMessage(null);
      }}
      selectable={abilityState.canAct}
      actionLabel={acting ? ct("loading") : t("girl.protect")}
      actionIcon="health_and_safety"
      onAction={handleProtect}
      actionDisabled={!canProtect}
      actionLoading={acting}
      canConfirm={abilityState.canConfirm}
      confirmLabel={confirming ? ct("loading") : ct("confirm")}
      onConfirm={handleConfirm}
      confirmDisabled={!canConfirm}
      confirmLoading={confirming}
      error={error}
    >
      {protectedMessage && (
        <StatusBanner variant="info" message={protectedMessage} />
      )}
    </AbilityPanel>
  );
}
