"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  label: string;
  subtitle?: string;
  badge?: ReactNode;
  meta?: ReactNode;
  className?: string;
}

export function VoteButton({
  selected = false,
  disabled = false,
  onClick,
  label,
  subtitle,
  badge,
  meta,
  className,
}: VoteButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
        !disabled && "cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800",
        disabled && "opacity-60 cursor-not-allowed",
        selected && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950",
        className,
      )}
    >
      <span className="text-sm font-medium truncate max-w-full">{label}</span>
      {subtitle && <span className="text-xs text-zinc-500">{subtitle}</span>}
      {badge}
      {meta}
    </button>
  );
}
