"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const playerCardVariants = cva(
  "relative flex w-full flex-col items-center gap-2 rounded-xl border p-3 transition-all",
  {
    variants: {
      variant: {
        "game-phase": "border-white/10 bg-surface/40",
        selected: "border-primary bg-primary/10 glow-primary",
        self: "border-warning/60 bg-warning/10",
        speaking: "border-success/60 bg-success/10",
        voting: "border-white/10 bg-surface/30",
        "mafia-target": "border-danger/40 bg-danger/10",
        ability: "border-white/10 bg-neutral-dark/50",
        protection: "border-success/60 bg-success/10",
        dead: "border-white/5 bg-surface/20 opacity-60 grayscale",
        lobby: "border-white/10 bg-surface/40",
      },
      selectable: {
        true: "cursor-pointer hover:border-primary/50 hover:bg-primary/10 active:scale-[0.98]",
        false: "cursor-default",
      },
      compact: {
        true: "p-2",
        false: "p-3",
      },
    },
    defaultVariants: {
      variant: "game-phase",
      selectable: false,
      compact: false,
    },
  },
);

export interface PlayerCardProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof playerCardVariants> {
  username: string;
  avatarUrl?: string;
  isYou?: boolean;
  isOwner?: boolean;
  isAlive?: boolean;
  isSpeaking?: boolean;
  isSelected?: boolean;
  showVoteCount?: boolean;
  voteCount?: number;
  showStatusLabel?: boolean;
  statusLabel?: string;
  avatarSize?: number;
  trailing?: React.ReactNode;
}

export function PlayerCard({
  username,
  avatarUrl,
  isYou = false,
  isOwner = false,
  isAlive = true,
  isSpeaking = false,
  isSelected = false,
  showVoteCount = false,
  voteCount = 0,
  showStatusLabel = false,
  statusLabel,
  avatarSize,
  trailing,
  className,
  variant,
  selectable,
  compact,
  disabled,
  ...props
}: PlayerCardProps) {
  const resolvedVariant = !isAlive
    ? "dead"
    : isSelected
      ? "selected"
      : isYou
        ? "self"
        : isSpeaking
          ? "speaking"
          : variant;

  const resolvedAvatarSize = avatarSize ?? (compact ? 40 : 48);

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        playerCardVariants({
          variant: resolvedVariant,
          selectable: Boolean(selectable) && !disabled,
          compact,
        }),
        disabled && "pointer-events-none",
        className,
      )}
      {...props}
    >
      <AvatarCircle
        username={username}
        avatarUrl={avatarUrl}
        size={resolvedAvatarSize}
        dead={!isAlive}
        selected={isSelected}
      />

      <span className="max-w-full truncate text-xs font-medium text-text-secondary">
        {username}
      </span>

      {showStatusLabel ? (
        <span className="text-[10px] uppercase tracking-wider text-text-muted">
          {statusLabel ?? (isAlive ? "Alive" : "Dead")}
        </span>
      ) : null}

      {isYou ? <Badge variant="you">YOU</Badge> : null}
      {isOwner ? <Badge variant="host" className="absolute top-1 end-1">HOST</Badge> : null}

      {!isAlive ? (
        <span className="absolute top-1 start-1 text-danger" aria-hidden>
          <Icon name="close" variant="round" size="sm" />
        </span>
      ) : null}

      {showVoteCount && voteCount > 0 ? (
        <Badge variant="vote-count" className="absolute -top-1 -end-1">
          {voteCount}
        </Badge>
      ) : null}

      {trailing}
    </button>
  );
}
