"use client";

import { useTranslations } from "next-intl";
import { UserAvatar } from "@/components/user-avatar";
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
  className,
}: PlayerGridProps) {
  const t = useTranslations("common");

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4",
        className,
      )}
    >
      {players.map((player) => {
        const isMe = player.userId === currentUserId;
        const isDead = player.isAlive === false;
        const isSelected = selectedId === (player.playerId ?? player.userId);
        const canSelect = selectable && !isDead && !isMe && onSelect;

        return (
          <button
            key={player.playerId ?? player.userId}
            type="button"
            disabled={!canSelect}
            onClick={() => {
              if (canSelect) {
                onSelect(player.playerId ?? player.userId);
              }
            }}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
              isDead && "opacity-40 grayscale",
              canSelect &&
                "cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800",
              isSelected && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950",
              !canSelect && !isDead && "cursor-default",
            )}
          >
            <UserAvatar
              username={player.username}
              avatarUrl={player.avatarUrl}
              size={48}
            />
            <span className="text-xs font-medium truncate max-w-full">
              {player.username}
              {isMe && <span className="text-zinc-400 ms-1">({t("you")})</span>}
            </span>

            {/* Owner badge */}
            {showOwnerBadge && player.isOwner && (
              <span className="absolute top-1 end-1 text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded-full">
                {t("owner")}
              </span>
            )}

            {/* Dead skull */}
            {isDead && (
              <span
                className="absolute top-1 start-1 text-sm"
                role="img"
                aria-label={t("dead")}
              >
                💀
              </span>
            )}

            {/* Vote count badge */}
            {showVoteCounts &&
              player.voteCount !== undefined &&
              player.voteCount > 0 && (
                <span className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {player.voteCount}
                </span>
              )}
          </button>
        );
      })}
    </div>
  );
}
