"use client";

import { cn } from "@/lib/utils";

interface RoleCardProps {
  revealed: boolean;
  roleName?: string;
  roleIcon?: string;
  description?: string;
  onReveal?: () => void;
  revealLabel: string;
  hiddenLabel: string;
  className?: string;
}

export function RoleCard({
  revealed,
  roleName,
  roleIcon,
  description,
  onReveal,
  revealLabel,
  hiddenLabel,
  className,
}: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onReveal}
      disabled={revealed || !onReveal}
      className={cn(
        "relative flex h-72 w-52 flex-col items-center justify-center rounded-2xl border-2 shadow-xl transition-all duration-500",
        revealed
          ? "bg-gradient-to-b from-zinc-900 to-zinc-800 border-white/10"
          : "bg-zinc-900 border-zinc-700 hover:border-zinc-500 cursor-pointer",
        className,
      )}
      aria-label={revealed ? (roleName ?? revealLabel) : revealLabel}
    >
      {revealed ? (
        <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
          <span className="text-5xl">{roleIcon ?? "🎭"}</span>
          <span className="text-xl font-bold text-white">{roleName ?? "?"}</span>
          {description && (
            <p className="text-xs text-white/60 text-center px-4 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl">🃏</span>
          <span className="text-sm text-zinc-400">{hiddenLabel}</span>
        </div>
      )}
    </button>
  );
}
