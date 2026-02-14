"use client";

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RevengePanel } from "@/components/game/revenge-panel";
import { StatusBanner } from "@/components/ui/status-banner";
import type { PlayerView } from "@/components/ui/player-grid";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { mapAppErrorKey } from "@/lib/error-message";

interface BoyRevengeProps {
  gameId: Id<"games">;
  aliveTargets: PlayerView[];
}

export function BoyRevenge({ gameId, aliveTargets }: BoyRevengeProps) {
  const ct = useTranslations("common");
  const et = useTranslations("errors");
  const t = useTranslations("resolution");

  const runBoyRevenge = useMutation(api.resolution.useBoyRevenge);

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRevenge() {
    if (!selectedTargetId) return;
    setActing(true);
    setError(null);
    try {
      await runBoyRevenge({
        gameId,
        targetPlayerId: selectedTargetId as Id<"players">,
      });
      setSelectedTargetId(null);
    } catch (e) {
      setError(et(mapAppErrorKey(e)));
    } finally {
      setActing(false);
    }
  }

  return (
    <>
      <RevengePanel
        players={aliveTargets}
        selectedId={selectedTargetId}
        onSelect={(playerId) => {
          setSelectedTargetId(playerId);
          setError(null);
        }}
        onConfirm={handleRevenge}
        confirmLabel={acting ? ct("loading") : t("boyPrompt.confirm")}
        loading={acting}
        disabled={acting}
      />
      {error && (
        <StatusBanner message={error} variant="error" className="text-center" />
      )}
    </>
  );
}
