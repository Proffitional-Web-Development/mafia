"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChatPanel } from "@/components/game/chat-panel";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { PrimaryButton } from "@/components/ui/primary-button";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type GamePhaseKey = Doc<"games">["phase"];
type PlayerRoleKey = Doc<"players">["role"];

const advancePhaseLabelByPhase: Record<GamePhaseKey, string> = {
  lobby: "advancePhaseLabel.default",
  cardDistribution: "advancePhaseLabel.cardDistribution",
  discussion: "advancePhaseLabel.discussion",
  publicVoting: "advancePhaseLabel.publicVoting",
  abilityPhase: "advancePhaseLabel.abilityPhase",
  mafiaVoting: "advancePhaseLabel.mafiaVoting",
  resolution: "advancePhaseLabel.resolution",
  endCheck: "advancePhaseLabel.endCheck",
  finished: "advancePhaseLabel.finished",
};

function getActionDescriptionKey(role: "sheikh" | "girl" | "boy") {
  if (role === "sheikh") return "actionDescription.sheikh" as const;
  if (role === "girl") return "actionDescription.girl" as const;
  return "actionDescription.boy" as const;
}
interface CoordinatorPanelProps {
  gameId: Id<"games">;
  currentUserId: Id<"users">;
}

export function CoordinatorPanel({
  gameId,
  currentUserId,
}: CoordinatorPanelProps) {
  const t = useTranslations("game");
  const tCommon = useTranslations("common");
  const tCoord = useTranslations("game.coordinator");
  const tRoles = useTranslations("roles");
  const tPhases = useTranslations("phases");

  const coordState = useQuery(api.coordinator.getCoordinatorState, { gameId });
  const advancePhase = useMutation(api.stateMachine.advancePhase);
  const confirmVoting = useMutation(api.publicVoting.confirmVoting);
  const confirmMafiaVoting = useMutation(api.mafiaVoting.confirmMafiaVoting);

  const [activeTab, setActiveTab] = useState<"chat" | "players" | "actions">(
    "players",
  );
  const [advancing, setAdvancing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!coordState) {
    return <LoadingState label={t("loadingSession")} />;
  }

  const { game, players, votes, actions } = coordState;

  function handleAdvance() {
    setConfirmOpen(true);
  }

  async function handleConfirmAdvance() {
    setAdvancing(true);
    try {
      if (game.phase === "publicVoting") {
        await confirmVoting({ gameId });
      } else if (game.phase === "mafiaVoting") {
        await confirmMafiaVoting({ gameId });
      } else {
        await advancePhase({ gameId, ownerOverride: true });
      }
      setConfirmOpen(false);
    } finally {
      setAdvancing(false);
    }
  }

  const isManualControl = game.phaseDeadlineAt === undefined;

  const phaseButtonLabel = (() => {
    const key = advancePhaseLabelByPhase[game.phase as GamePhaseKey];
    return t(key);
  })();

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-background md:flex-row">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="border-b border-white/10 bg-surface/30 md:w-80 md:border-e md:border-b-0 flex flex-col">
        <header className="p-4 border-b border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Icon name="visibility" size="sm" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">
                {tCoord("title")}
              </h1>
              <p className="text-[10px] text-text-tertiary">
                {tCommon("round", { number: game.round })} •{" "}
                {tPhases(game.phase as GamePhaseKey)}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">
                {t("timer.manualControl")}
              </span>
              <Badge
                variant="status"
                className={cn(
                  "uppercase text-[10px]",
                  isManualControl
                    ? "text-warning border-warning/50 bg-warning/20"
                    : "",
                )}
              >
                {isManualControl ? tCoord("manual") : tCoord("auto")}
              </Badge>
            </div>

            <PrimaryButton
              onClick={handleAdvance}
              loading={advancing}
              variant="primary"
              icon="skip_next"
              fullWidth={true}
              className="py-2 min-h-9 text-xs"
            >
              {phaseButtonLabel}
            </PrimaryButton>
          </div>
        </header>

        {/* Mobile Tabs */}
        <div className="flex border-b border-white/10 md:hidden">
          <button
            type="button"
            onClick={() => setActiveTab("players")}
            className={cn(
              "flex-1 py-3 text-xs font-medium",
              activeTab === "players"
                ? "text-primary border-b-2 border-primary"
                : "text-text-muted",
            )}
          >
            {tCoord("playersTab")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("actions")}
            className={cn(
              "flex-1 py-3 text-xs font-medium",
              activeTab === "actions"
                ? "text-primary border-b-2 border-primary"
                : "text-text-muted",
            )}
          >
            {tCoord("activityTab")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex-1 py-3 text-xs font-medium",
              activeTab === "chat"
                ? "text-primary border-b-2 border-primary"
                : "text-text-muted",
            )}
          >
            {tCoord("chatTab")}
          </button>
        </div>

        {/* Desktop Sidebar Content (Players) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 hidden md:block">
          <h3 className="text-xs font-semibold uppercase text-text-tertiary mb-2">
            {tCoord("playersTab")}
          </h3>
          <div className="space-y-2">
            {players.map((p) => (
              <div
                key={p.playerId}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-2"
              >
                <AvatarCircle
                  username={p.username}
                  avatarUrl={p.avatarUrl}
                  size={32}
                  dead={!p.isAlive}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs font-medium truncate",
                        !p.isAlive && "text-text-muted line-through",
                      )}
                    >
                      {p.username}
                    </span>
                    {p.isCoordinator && (
                      <Icon
                        name="star"
                        size="sm"
                        className="text-warning text-[10px]"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span
                      className={cn(
                        "uppercase font-bold",
                        p.role === "mafia" ? "text-danger" : "text-success",
                      )}
                    >
                      {tRoles(p.role as PlayerRoleKey)}
                    </span>
                    {!p.isAlive && (
                      <span className="text-text-muted">
                        •{" "}
                        {tCoord("deadRound", {
                          round: p.eliminatedAtRound ?? 0,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main Area ────────────────────────────────────────────────────── */}
      <main className="flex-1 relative bg-surface/10 flex flex-col h-full overflow-hidden">
        {/* Mobile View: Render active tab */}
        <div className="md:hidden flex-1 overflow-hidden relative">
          {activeTab === "players" && (
            <div className="p-4 space-y-2 overflow-y-auto h-full">
              {players.map((p) => (
                <div
                  key={p.playerId}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-2"
                >
                  <AvatarCircle
                    username={p.username}
                    avatarUrl={p.avatarUrl}
                    size={32}
                    dead={!p.isAlive}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-xs font-medium truncate",
                          !p.isAlive && "text-text-muted line-through",
                        )}
                      >
                        {p.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span
                        className={cn(
                          "uppercase font-bold",
                          p.role === "mafia" ? "text-danger" : "text-success",
                        )}
                      >
                        {tRoles(p.role as PlayerRoleKey)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === "chat" && (
            <ChatPanel
              gameId={gameId}
              roomId={game.roomId}
              currentUserId={currentUserId}
              isOwner={true}
              open={true}
              onClose={() => {}}
              isCoordinator
              isReadOnly
              className="relative w-full h-full sm:w-full border-none backdrop-blur-none bg-transparent"
            />
          )}
          {activeTab === "actions" && (
            <div className="p-4 space-y-4 overflow-y-auto h-full">
              <h2 className="text-lg font-bold text-white mb-4 md:hidden">
                {tCoord("activityLog")}
              </h2>
              {Array.from({ length: game.round }, (_, i) => game.round - i).map(
                (round) => {
                  const roundPublicVotes =
                    votes?.public.filter((v) => v.round === round) || [];
                  const roundMafiaVotes =
                    votes?.mafia.filter((v) => v.round === round) || [];
                  const roundActions = actions.filter((a) => a.round === round);

                  if (
                    roundPublicVotes.length === 0 &&
                    roundMafiaVotes.length === 0 &&
                    roundActions.length === 0
                  ) {
                    return null;
                  }

                  return (
                    <section
                      key={round}
                      className="mb-6 border-b border-white/5 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Badge
                          variant="phase"
                          className="text-xs bg-white/5 border-white/10 text-white"
                        >
                          {tCommon("round", { number: round })}
                        </Badge>
                      </div>

                      {/* Public Votes */}
                      {roundPublicVotes.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-[10px] font-bold text-text-tertiary mb-2 uppercase">
                            {tCoord("publicVotes")}
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {roundPublicVotes.map((v) => {
                              const voter = players.find(
                                (p) => p.playerId === v.voterId,
                              );
                              const target = players.find(
                                (p) => p.playerId === v.targetId,
                              );
                              return (
                                <div
                                  key={v._id}
                                  className="text-xs flex items-center gap-1.5 bg-white/5 p-1.5 rounded"
                                >
                                  <span className="font-medium text-white">
                                    {voter?.username}
                                  </span>
                                  <Icon
                                    name="arrow_forward"
                                    size="sm"
                                    className="text-text-muted rotate-0 text-[10px]"
                                  />
                                  {v.isSkip ? (
                                    <span className="text-text-tertiary italic">
                                      {tCoord("skip")}
                                    </span>
                                  ) : (
                                    <span
                                      className={cn(
                                        "font-medium",
                                        target?.role === "mafia"
                                          ? "text-danger-light"
                                          : "text-success-light",
                                      )}
                                    >
                                      {target?.username}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Mafia Votes */}
                      {roundMafiaVotes.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-[10px] font-bold text-danger mb-2 uppercase">
                            {tCoord("mafiaVotes")}
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {roundMafiaVotes.map((v) => {
                              const voter = players.find(
                                (p) => p.playerId === v.voterId,
                              );
                              const target = players.find(
                                (p) => p.playerId === v.targetId,
                              );
                              return (
                                <div
                                  key={v._id}
                                  className="text-xs flex items-center gap-1.5 bg-danger/10 border border-danger/20 p-1.5 rounded"
                                >
                                  <span className="font-medium text-danger">
                                    {voter?.username}
                                  </span>
                                  <Icon
                                    name="arrow_forward"
                                    size="sm"
                                    className="text-danger/50 rotate-0 text-[10px]"
                                  />
                                  <span className="font-medium text-white">
                                    {target?.username}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Special Actions */}
                      {roundActions.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-primary mb-2 uppercase">
                            {tCoord("actionsRound", { round })}
                          </h4>
                          <div className="space-y-2">
                            {roundActions.map((a) => {
                              const actor = players.find(
                                (p) => p.playerId === a.actorId,
                              );
                              const target = players.find(
                                (p) => p.playerId === a.targetId,
                              );
                              const actionDescription = tCoord(
                                getActionDescriptionKey(a.role),
                              );
                              let resultBadge = null;

                              if (a.role === "sheikh" && a.result) {
                                resultBadge = (
                                  <Badge
                                    variant="investigation-result"
                                    resultTone={
                                      a.result === "mafia"
                                        ? "mafia"
                                        : "innocent"
                                    }
                                    className="h-4 px-1 text-[9px] uppercase"
                                  >
                                    {a.result}
                                  </Badge>
                                );
                              }

                              return (
                                <div
                                  key={a._id}
                                  className="flex flex-col gap-2 text-xs bg-white/5 p-2 rounded-lg border border-white/5"
                                >
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge
                                      variant="status"
                                      className="text-[9px] h-4 py-0 px-1.5 border-white/10 bg-white/10 text-white/80"
                                    >
                                      {tRoles(a.role as PlayerRoleKey)}
                                    </Badge>
                                    <span className="font-medium text-primary-light">
                                      {actor?.username}
                                    </span>
                                    <span className="text-text-muted">
                                      {actionDescription}
                                    </span>
                                    <span className="font-bold text-white">
                                      {target?.username || tCoord("unknown")}
                                    </span>
                                  </div>
                                  {resultBadge && (
                                    <div className="self-end">
                                      {resultBadge}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </section>
                  );
                },
              )}
            </div>
          )}
        </div>

        {/* Desktop View: Split Layout */}
        <div className="hidden md:flex flex-1 h-full">
          {/* Middle Column: Activity/Actions */}
          <div className="flex-1 p-6 border-e border-white/10 overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">
              {tCoord("activityLog")}
            </h2>

            {Array.from({ length: game.round }, (_, i) => game.round - i).map(
              (round) => {
                const roundPublicVotes =
                  votes?.public.filter((v) => v.round === round) || [];
                const roundMafiaVotes =
                  votes?.mafia.filter((v) => v.round === round) || [];
                const roundActions = actions.filter((a) => a.round === round);

                if (
                  roundPublicVotes.length === 0 &&
                  roundMafiaVotes.length === 0 &&
                  roundActions.length === 0
                ) {
                  return null;
                }

                return (
                  <section
                    key={round}
                    className="mb-8 border-b border-white/5 pb-6 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Badge
                        variant="phase"
                        className="text-xs bg-white/5 border-white/10 text-white"
                      >
                        {tCommon("round", { number: round })}
                      </Badge>
                    </div>

                    {/* Public Votes */}
                    {roundPublicVotes.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-[10px] font-bold text-text-tertiary mb-2 uppercase">
                          {tCoord("publicVotes")}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {roundPublicVotes.map((v) => {
                            const voter = players.find(
                              (p) => p.playerId === v.voterId,
                            );
                            const target = players.find(
                              (p) => p.playerId === v.targetId,
                            );
                            return (
                              <div
                                key={v._id}
                                className="text-xs flex items-center gap-1.5 bg-white/5 p-1.5 rounded"
                              >
                                <span className="font-medium text-white">
                                  {voter?.username}
                                </span>
                                <Icon
                                  name="arrow_forward"
                                  size="sm"
                                  className="text-text-muted rotate-0 text-[10px]"
                                />
                                {v.isSkip ? (
                                  <span className="text-text-tertiary italic">
                                    {tCoord("skip")}
                                  </span>
                                ) : (
                                  <span
                                    className={cn(
                                      "font-medium",
                                      target?.role === "mafia"
                                        ? "text-danger-light"
                                        : "text-success-light",
                                    )}
                                  >
                                    {target?.username}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Mafia Votes */}
                    {roundMafiaVotes.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-[10px] font-bold text-danger mb-2 uppercase">
                          {tCoord("mafiaVotes")}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {roundMafiaVotes.map((v) => {
                            const voter = players.find(
                              (p) => p.playerId === v.voterId,
                            );
                            const target = players.find(
                              (p) => p.playerId === v.targetId,
                            );
                            return (
                              <div
                                key={v._id}
                                className="text-xs flex items-center gap-1.5 bg-danger/10 border border-danger/20 p-1.5 rounded"
                              >
                                <span className="font-medium text-danger">
                                  {voter?.username}
                                </span>
                                <Icon
                                  name="arrow_forward"
                                  size="sm"
                                  className="text-danger/50 rotate-0 text-[10px]"
                                />
                                <span className="font-medium text-white">
                                  {target?.username}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Special Actions */}
                    {roundActions.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-primary mb-2 uppercase">
                          {tCoord("actionsRound", { round })}
                        </h4>
                        <div className="space-y-2">
                          {roundActions.map((a) => {
                            const actor = players.find(
                              (p) => p.playerId === a.actorId,
                            );
                            const target = players.find(
                              (p) => p.playerId === a.targetId,
                            );
                            const actionDescription = tCoord(
                              getActionDescriptionKey(a.role),
                            );
                            let resultBadge = null;

                            if (a.role === "sheikh" && a.result) {
                              resultBadge = (
                                <Badge
                                  variant="investigation-result"
                                  resultTone={
                                    a.result === "mafia" ? "mafia" : "innocent"
                                  }
                                  className="h-4 px-1 text-[9px] uppercase"
                                >
                                  {a.result}
                                </Badge>
                              );
                            }

                            return (
                              <div
                                key={a._id}
                                className="flex items-center justify-between gap-2 text-xs bg-white/5 p-2 rounded-lg border border-white/5"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="status"
                                    className="text-[9px] h-4 py-0 px-1.5 border-white/10 bg-white/10 text-white/80"
                                  >
                                    {tRoles(a.role as PlayerRoleKey)}
                                  </Badge>
                                  <span className="font-medium text-primary-light">
                                    {actor?.username}
                                  </span>
                                  <span className="text-text-muted">
                                    {actionDescription}
                                  </span>
                                  <span className="font-bold text-white">
                                    {target?.username || tCoord("unknown")}
                                  </span>
                                </div>
                                {resultBadge}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </section>
                );
              },
            )}
          </div>

          {/* Right Column: Chat */}
          <div className="w-80 border-s border-white/10 relative bg-background/50">
            <ChatPanel
              gameId={gameId}
              roomId={game.roomId}
              currentUserId={currentUserId}
              isOwner={true}
              open={true}
              onClose={() => {}}
              isCoordinator
              isReadOnly
              className="relative w-full h-full sm:w-full border-none backdrop-blur-none bg-transparent"
            />
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={confirmOpen}
        title={t("advancePhase")}
        message={t("advancePhaseConfirm")}
        onConfirm={handleConfirmAdvance}
        onCancel={() => setConfirmOpen(false)}
        loading={advancing}
        confirmLabel={tCommon("confirm")}
        cancelLabel={tCommon("cancel")}
      />
    </div>
  );
}
