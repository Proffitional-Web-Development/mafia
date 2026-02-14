"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { PlayerCard } from "@/components/ui/player-card";
import { cn } from "@/lib/utils";

export interface PlayerView {
  playerId?: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  isAlive?: boolean;
  isOwner?: boolean;
  isConnected?: boolean;
  voteCount?: number;
  hasVoted?: boolean;
}

interface PlayerGridProps {
  players: PlayerView[];
  currentUserId?: string;
  selectedId?: string | null;
  onSelect?: (playerId: string) => void;
  selectable?: boolean;
  showVoteCounts?: boolean;
  showOwnerBadge?: boolean;
  columns?: 2 | 3 | 4;
  gap?: "sm" | "md";
  children?: ReactNode;
  className?: string;
}

export function PlayerGrid({
  players,
  currentUserId,
  selectedId,
  onSelect,
  selectable = false,
  showVoteCounts = false,
  showOwnerBadge = true,
  columns,
  gap = "md",
  children,
  className,
}: PlayerGridProps) {
  const t = useTranslations("common");
  const gapClass = gap === "sm" ? "gap-2" : "gap-3";
  const columnsClass =
    columns === 2
      ? "grid-cols-2"
      : columns === 3
        ? "grid-cols-3"
        : columns === 4
          ? "grid-cols-4"
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";

  return (
    <div className={cn("grid", columnsClass, gapClass, className)}>
      {children ? children : null}

      {!children
        ? players.map((player) => {
            const isMe = player.userId === currentUserId;
            const isDead = player.isAlive === false;
            const isSelected =
              selectedId === (player.playerId ?? player.userId);
            const canSelect = Boolean(
              selectable && !isDead && !isMe && onSelect
            );

            return (
              <PlayerCard
                key={player.playerId ?? player.userId}
                username={player.username}
                avatarUrl={player.avatarUrl}
                isYou={isMe}
                isOwner={showOwnerBadge ? Boolean(player.isOwner) : false}
                isAlive={player.isAlive !== false}
                isSelected={isSelected}
                selectable={canSelect}
                disabled={!canSelect}
                showVoteCount={showVoteCounts}
                voteCount={player.voteCount}
                onClick={() => {
                  if (canSelect && onSelect) {
                    onSelect(player.playerId ?? player.userId);
                  }
                }}
                variant="lobby"
                trailing={
                  !isDead ? undefined : (
                    <span className="sr-only">{t("dead")}</span>
                  )
                }
              />
            );
          })
        : null}
    </div>
  );
}
