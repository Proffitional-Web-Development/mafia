"use client";

import { useTranslations } from "next-intl";
import { StatusBanner } from "@/components/ui/status-banner";
import { PHASE_META, ROLE_COLORS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface PhaseHeaderProps {
  phase: string;
  round: number;
  isAlive: boolean;
  role: string;
}

export function PhaseHeader({ phase, round, isAlive, role }: PhaseHeaderProps) {
  const pt = useTranslations("phases");
  const ct = useTranslations("common");
  const rt = useTranslations("roles");
  const dt = useTranslations("discussion");

  const phaseKey = phase as string;
  const roleKey = role as string;
  const phaseMeta = PHASE_META[phase];
  const roleColor = ROLE_COLORS[role];

  return (
    <div className="space-y-2">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{phaseMeta?.icon ?? "🎮"}</span>
          <h1 className="text-lg font-semibold">{pt(phaseKey)}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            {ct("round", { number: round })}
          </span>
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full border",
              roleColor
                ? `${roleColor.bg} ${roleColor.text} ${roleColor.border}`
                : "bg-zinc-800 text-zinc-400 border-zinc-700",
            )}
          >
            {rt(roleKey)}
          </span>
        </div>
      </div>

      {/* Dead banner */}
      {!isAlive && (
        <StatusBanner message={dt("deadSpectating")} variant="dead" />
      )}
    </div>
  );
}
