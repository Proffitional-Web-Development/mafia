"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { TimerDisplay } from "@/components/ui/timer-display";
import { StatusBanner } from "@/components/ui/status-banner";
import { PHASE_META, ROLE_COLORS } from "@/lib/design-tokens";
import { HeaderControls } from "@/components/game/header-controls";
import { cn } from "@/lib/utils";

interface PhaseHeaderProps {
  phase: string;
  round: number;
  isAlive: boolean;
  role: string;
  variant?:
    | "standard"
    | "discussion"
    | "voting"
    | "ability-left"
    | "ability-split"
    | "mafia-night";
  deadlineAt?: number;
  subtitle?: string;
  actions?: React.ReactNode;
  memeLevel?: "NORMAL" | "FUN" | "CHAOS";
}

export function PhaseHeader({
  phase,
  round,
  isAlive,
  role,
  variant = "standard",
  deadlineAt,
  subtitle,
  actions,
  memeLevel,
}: PhaseHeaderProps) {
  const pt = useTranslations("phases");
  const ct = useTranslations("common");
  const rt = useTranslations("roles");
  const dt = useTranslations("discussion");

  const phaseKey = phase as string;
  const roleKey = role as string;
  const phaseMeta = PHASE_META[phase];
  const roleColor = ROLE_COLORS[role];
  const isMafiaVariant = variant === "mafia-night";

  return (
    <div
      className={cn(
        "space-y-2 rounded-2xl border p-3",
        isMafiaVariant
          ? "border-danger/40 bg-danger/10"
          : "border-white/10 bg-surface/40",
      )}
    >
      {/* Top bar */}
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          (variant === "ability-left" || variant === "ability-split") &&
            "items-start",
        )}
      >
        <div className="flex items-center gap-2">
          <Icon
            name={phaseMeta?.icon ?? "sports_esports"}
            className={cn(
              "text-lg",
              isMafiaVariant
                ? "text-danger"
                : phaseMeta?.color ?? "text-text-secondary",
            )}
            variant="round"
          />
          <div>
            <h1 className="text-lg font-semibold text-white">{pt(phaseKey)}</h1>
            {subtitle ? (
              <p className="text-xs text-text-tertiary">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-3",
            variant === "ability-split" && "flex-col items-end gap-1",
          )}
        >
          <HeaderControls />
          {actions ? <div className="self-end">{actions}</div> : null}
          <span className="text-xs text-zinc-500">
            {ct("round", { number: round })}
          </span>
          {memeLevel ? (
            <span className="rounded-full border border-primary/40 bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-light">
              {memeLevel}
            </span>
          ) : null}
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
          {deadlineAt ? (
            <TimerDisplay
              deadlineAt={deadlineAt}
              variant={
                variant === "discussion"
                  ? "circle"
                  : variant === "voting" || variant === "mafia-night"
                    ? "inline"
                    : variant === "ability-left" || variant === "ability-split"
                      ? "compact"
                      : "compact"
              }
            />
          ) : null}
        </div>
      </div>

      {/* Dead banner */}
      {!isAlive && (
        <StatusBanner message={dt("deadSpectating")} variant="dead" />
      )}
    </div>
  );
}
