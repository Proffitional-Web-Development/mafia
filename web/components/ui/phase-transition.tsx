"use client";

import { cn } from "@/lib/utils";

interface PhaseTransitionProps {
  open: boolean;
  title: string;
  className?: string;
}

export function PhaseTransition({
  open,
  title,
  className,
}: PhaseTransitionProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200",
        className,
      )}
      aria-live="polite"
    >
      <div className="rounded-2xl border border-white/15 bg-zinc-900/90 px-6 py-4 text-center shadow-2xl">
        <p className="text-lg font-semibold text-white">{title}</p>
      </div>
    </div>
  );
}
