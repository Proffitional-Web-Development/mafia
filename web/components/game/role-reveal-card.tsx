"use client";

import { cn } from "@/lib/utils";

interface RoleRevealCardProps {
  revealed: boolean;
  roleName?: string;
  roleIcon?: string;
  description?: string;
  hiddenLabel: string;
  revealLabel: string;
  onReveal?: () => void;
  className?: string;
}

export function RoleRevealCard({
  revealed,
  roleName,
  roleIcon,
  description,
  hiddenLabel,
  revealLabel,
  onReveal,
  className,
}: RoleRevealCardProps) {
  return (
    <button
      type="button"
      onClick={onReveal}
      disabled={revealed || !onReveal}
      className={cn(
        "group relative h-80 w-56 rounded-2xl outline-none [perspective:1000px] [transform-style:preserve-3d]",
        className,
      )}
      role="button"
      aria-pressed={revealed}
      aria-label={revealed ? roleName ?? revealLabel : revealLabel}
    >
      <span
        className={cn(
          "absolute inset-0 block rounded-2xl transition-transform duration-700 [transform-style:preserve-3d] motion-reduce:transition-none",
          revealed ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]",
        )}
      >
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-surface/80 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]">
          <span className="text-4xl">🂠</span>
          <span className="text-sm text-text-tertiary">{hiddenLabel}</span>
        </span>

        <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-primary/30 bg-gradient-to-b from-surface to-neutral-dark px-5 text-center [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="text-5xl">{roleIcon ?? "🎭"}</span>
          <span className="text-xl font-bold text-white">{roleName ?? "?"}</span>
          {description ? <p className="text-xs leading-relaxed text-text-secondary">{description}</p> : null}
        </span>
      </span>
    </button>
  );
}
