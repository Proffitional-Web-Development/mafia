"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PhaseTimer } from "@/components/ui/phase-timer";
import { PlayerGrid } from "@/components/ui/player-grid";
import { StatusBanner } from "@/components/ui/status-banner";
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
        <p className="text-sm text-zinc-500 animate-pulse">{ct("loading")}</p>
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
      setError(e instanceof Error ? e.message : String(e));
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
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setActing(false);
    }
  }

  if (abilityState.roleView === "waiting") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-8 text-center">
        <PhaseTimer deadlineAt={effectiveDeadline} size="md" />
        <div className="space-y-2">
          <div className="text-5xl animate-pulse" aria-hidden>
            🌙
          </div>
          <h2 className="text-lg font-semibold">{t("waiting.title")}</h2>
          <p className="text-sm text-zinc-500">{t("waiting.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 text-zinc-400" aria-hidden>
          <span className="animate-pulse [animation-delay:100ms]">✦</span>
          <span className="animate-pulse [animation-delay:250ms]">✦</span>
          <span className="animate-pulse [animation-delay:400ms]">✦</span>
        </div>
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
        <PhaseTimer deadlineAt={effectiveDeadline} size="md" />

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
          <Button onClick={handleSheikhInvestigate} disabled={!canSubmit}>
            {acting ? ct("loading") : t("sheikh.investigate")}
          </Button>
        </div>

        {lastResultLabel && (
          <StatusBanner
            variant={abilityState.lastResult === "mafia" ? "warning" : "info"}
            message={t("result.reveal", { faction: lastResultLabel })}
          />
        )}

        <section className="rounded-xl border p-3 space-y-2">
          <h3 className="text-sm font-semibold">{t("history.title")}</h3>
          {abilityState.investigationHistory.length === 0 ? (
            <p className="text-xs text-zinc-500">{t("history.empty")}</p>
          ) : (
            <ul className="space-y-2">
              {abilityState.investigationHistory.map((item) => (
                <li
                  key={`${item.round}-${item.targetPlayerId}`}
                  className="flex items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-xs"
                >
                  <span>
                    {t("history.round", { round: item.round })} · {item.targetUsername}
                  </span>
                  <span
                    className={
                      item.faction === "mafia"
                        ? "rounded-full bg-red-100 px-2 py-0.5 text-red-700 dark:bg-red-900 dark:text-red-200"
                        : "rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                    }
                  >
                    {item.faction === "mafia" ? t("result.mafia") : t("result.citizens")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {error && (
          <p className="text-sm text-red-500 text-center" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  const canProtect = abilityState.canAct && Boolean(selectedTargetId) && !acting;

  return (
    <div className="flex flex-1 flex-col gap-5 py-2">
      <PhaseTimer deadlineAt={effectiveDeadline} size="md" />

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
        <Button onClick={handleGirlProtect} disabled={!canProtect}>
          {acting ? ct("loading") : t("girl.protect")}
        </Button>
      </div>

      {girlProtectedMessage && (
        <StatusBanner variant="info" message={girlProtectedMessage} />
      )}

      {error && (
        <p className="text-sm text-red-500 text-center" role="alert">
          {error}
        </p>
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