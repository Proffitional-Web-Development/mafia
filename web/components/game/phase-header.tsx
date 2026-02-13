"use client";

import { useTranslations } from "next-intl";
import { StatusBanner } from "@/components/ui/status-banner";
import { cn } from "@/lib/utils";

interface PhaseHeaderProps {
  phase: string;
  round: number;
  isAlive: boolean;
  role: string;
}

const PHASE_ICONS: Record<string, string> = {
  cardDistribution: "🃏",
  discussion: "💬",
  publicVoting: "🗳️",
  abilityPhase: "⚡",
  mafiaVoting: "🔪",
  resolution: "⚖️",
  endCheck: "🔍",
  finished: "🏁",
};

const ROLE_COLORS: Record<string, string> = {
  mafia: "bg-red-900/30 text-red-400 border-red-800",
  citizen: "bg-blue-900/30 text-blue-400 border-blue-800",
  sheikh: "bg-emerald-900/30 text-emerald-400 border-emerald-800",
  girl: "bg-purple-900/30 text-purple-400 border-purple-800",
  boy: "bg-amber-900/30 text-amber-400 border-amber-800",
};

export function PhaseHeader({ phase, round, isAlive, role }: PhaseHeaderProps) {
  const pt = useTranslations("phases");
  const ct = useTranslations("common");
  const rt = useTranslations("roles");
  const dt = useTranslations("discussion");

  const phaseKey = phase as string;
  const roleKey = role as string;

  return (
    <div className="space-y-2">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{PHASE_ICONS[phase] ?? "🎮"}</span>
          <h1 className="text-lg font-semibold">{pt(phaseKey)}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            {ct("round", { number: round })}
          </span>
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full border",
              ROLE_COLORS[role] ?? "bg-zinc-800 text-zinc-400 border-zinc-700",
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
