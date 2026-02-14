"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingState } from "@/components/ui/loading-state";
import { PlayerGrid } from "@/components/ui/player-grid";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TimerDisplay } from "@/components/ui/timer-display";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface DiscussionPhaseProps {
  gameId: Id<"games">;
  currentUserId: Id<"users">;
  deadlineAt?: number;
}

export function DiscussionPhase({
  gameId,
  currentUserId,
  deadlineAt,
}: DiscussionPhaseProps) {
  const t = useTranslations("discussion");
  const ct = useTranslations("common");
  const discussionState = useQuery(api.discussion.getDiscussionState, {
    gameId,
  });
  const skipDiscussion = useMutation(api.discussion.skipDiscussion);

  const [showConfirm, setShowConfirm] = useState(false);
  const [skipping, setSkipping] = useState(false);

  if (!discussionState) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingState label={ct("loading")} compact className="max-w-xs" />
      </div>
    );
  }

  const isOwner = discussionState.isOwner;
  const isAlive = discussionState.isAlive;
  const effectiveDeadline = discussionState.phaseDeadlineAt ?? deadlineAt;

  const players = discussionState.alivePlayers.map((p) => ({
    playerId: p.playerId,
    userId: p.userId,
    username: p.username,
    avatarUrl: p.avatarUrl ?? undefined,
    isAlive: p.isAlive,
  }));

  async function handleSkip() {
    setSkipping(true);
    try {
      await skipDiscussion({ gameId });
    } catch {
      // phase already advanced
    } finally {
      setSkipping(false);
      setShowConfirm(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-4">
      {/* Timer */}
      <TimerDisplay deadlineAt={effectiveDeadline} variant="circle" />

      {/* Title + subtitle */}
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-white glow-effect">{t("title")}</h2>
        <p className="text-sm text-white/60">{t("subtitle")}</p>
      </div>

      {/* Alive players */}
      <div className="w-full">
        <h3 className="text-xs font-semibold uppercase text-white/60 mb-2">
          {ct("players")} ({players.length})
        </h3>
        <PlayerGrid
          players={players}
          currentUserId={currentUserId}
          showOwnerBadge={false}
        />
      </div>

      {/* Owner skip button */}
      {isOwner && isAlive && (
        <PrimaryButton onClick={() => setShowConfirm(true)} icon="gavel">
          {t("endEarly")}
        </PrimaryButton>
      )}

      {/* Skip confirm */}
      <ConfirmDialog
        open={showConfirm}
        title={t("endEarly")}
        message={t("endEarlyConfirm")}
        loading={skipping}
        onConfirm={handleSkip}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
