"use client";

import { useTranslations } from "next-intl";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

export type PlayerStatus = "alive" | "dead" | "voting" | "spectating";

interface PlayerAvatarProps {
  username: string;
  avatarUrl?: string;
  status?: PlayerStatus;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  isYou?: boolean;
  className?: string;
}

const AVATAR_SIZE: Record<"sm" | "md" | "lg", number> = {
  sm: 28,
  md: 40,
  lg: 56,
};

const STATUS_INDICATOR: Record<PlayerStatus, { icon: string; label: string }> =
  {
    alive: { icon: "", label: "alive" },
    dead: { icon: "💀", label: "dead" },
    voting: { icon: "🗳️", label: "voting" },
    spectating: { icon: "👁️", label: "spectating" },
  };

export function PlayerAvatar({
  username,
  avatarUrl,
  status = "alive",
  size = "md",
  showName = true,
  isYou = false,
  className,
}: PlayerAvatarProps) {
  const t = useTranslations("common");

  const avatarPx = AVATAR_SIZE[size];
  const indicator = STATUS_INDICATOR[status];
  const isDead = status === "dead";

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        isDead && "opacity-50 grayscale",
        className,
      )}
    >
      <div className="relative flex-shrink-0">
        <UserAvatar
          username={username}
          avatarUrl={avatarUrl}
          size={avatarPx}
        />
        {indicator.icon && (
          <span
            className="absolute -bottom-0.5 -end-0.5 text-[10px] leading-none"
            role="img"
            aria-label={t(indicator.label as "dead" | "spectating")}
          >
            {indicator.icon}
          </span>
        )}
      </div>

      {showName && (
        <span
          className={cn(
            "truncate text-sm font-medium",
            isDead && "line-through text-zinc-500",
          )}
        >
          {username}
          {isYou && (
            <span className="text-zinc-400 ms-1 font-normal">
              ({t("you")})
            </span>
          )}
        </span>
      )}
    </div>
  );
}
