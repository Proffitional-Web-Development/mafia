"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";


interface SettingsPanelProps {
  discussionDuration: number;
  maxPlayers: number;
  publicVotingDuration?: number | null;
  abilityPhaseDuration?: number | null;
  mafiaVotingDuration?: number | null;
  ownerMode?: "player" | "coordinator";
  editable?: boolean;
  onDiscussionDurationChange?: (value: number) => void;
  onMaxPlayersChange?: (value: number) => void;
  onPublicVotingDurationChange?: (value: number | null) => void;
  onAbilityPhaseDurationChange?: (value: number | null) => void;
  onMafiaVotingDurationChange?: (value: number | null) => void;
  onOwnerModeChange?: (value: "player" | "coordinator") => void;
  className?: string;
}

function DurationInput({
  label,
  value,
  onChange,
  editable,
  defaultValue = 45,
}: {
  label: string;
  value: number | null | undefined;
  onChange?: (val: number | null) => void;
  editable: boolean;
  defaultValue?: number;
}) {
  const t = useTranslations("room");
  const tSettings = useTranslations("room.settings");
  const isUnlimited = value === null;
  const numericValue = value ?? defaultValue;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <span>{label}</span>
        <span>{isUnlimited ? tSettings("unlimited") : t("seconds", { count: numericValue })}</span>
      </div>
      
      {editable ? (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={5}
            max={600}
            step={5}
            value={numericValue}
            disabled={!editable || isUnlimited}
            onChange={(e) => onChange?.(Number(e.target.value))}
            className={cn("w-full accent-primary", isUnlimited && "opacity-50")}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isUnlimited}
              onChange={(e) => onChange?.(e.target.checked ? null : defaultValue)}
              className="h-4 w-4 rounded border-white/20 bg-white/10 accent-primary"
            />
            <span className="whitespace-nowrap text-[10px] text-text-tertiary uppercase font-bold tracking-wider">
              {tSettings("unlimited").split('(')[1]?.replace(')', '') || "Manual"}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-2 w-full rounded-full bg-white/10">
          <div 
            className={cn("h-full rounded-full bg-primary/50", isUnlimited && "w-full bg-emerald-500/50")}
            style={{ width: isUnlimited ? "100%" : `${(numericValue / 600) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function SettingsPanel({
  discussionDuration,
  maxPlayers,
  publicVotingDuration,
  abilityPhaseDuration,
  mafiaVotingDuration,
  ownerMode,
  editable = false,
  onDiscussionDurationChange,
  onMaxPlayersChange,
  onPublicVotingDurationChange,
  onAbilityPhaseDurationChange,
  onMafiaVotingDurationChange,
  onOwnerModeChange,
  className,
}: SettingsPanelProps) {
  const t = useTranslations("room");
  const tSettings = useTranslations("room.settings");

  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-surface/60 p-4",
        className,
      )}
    >
      <h3 className="mb-3 text-sm font-semibold text-white">
        {t("settingsTitle")}
      </h3>

      <div className="space-y-6">
        {/* Owner Mode */}
        <div className="space-y-2">
            <div className="text-xs text-text-tertiary">{tSettings("ownerMode")}</div>
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    disabled={!editable}
                    onClick={() => onOwnerModeChange?.("player")}
                    className={cn(
                        "flex flex-col items-center justify-center rounded-lg border border-transparent p-3 text-center transition-all",
                        ownerMode === "player" 
                            ? "bg-primary/20 border-primary/50 text-primary-foreground" 
                            : "bg-white/5 text-text-secondary hover:bg-white/10",
                        !editable && "opacity-80 cursor-default"
                    )}
                >
                    <span className="text-sm font-medium">{tSettings("ownerModePlayer")}</span>
                    <span className="text-[10px] text-text-tertiary mt-1 leading-tight">{tSettings("ownerModePlayerDesc")}</span>
                </button>
                <button
                    type="button"
                    disabled={!editable}
                    onClick={() => onOwnerModeChange?.("coordinator")}
                    className={cn(
                        "flex flex-col items-center justify-center rounded-lg border border-transparent p-3 text-center transition-all",
                        ownerMode === "coordinator" 
                             ? "bg-purple-500/20 border-purple-500/50 text-purple-200" 
                            : "bg-white/5 text-text-secondary hover:bg-white/10",
                        !editable && "opacity-80 cursor-default"
                    )}
                >
                    <span className="text-sm font-medium">{tSettings("ownerModeCoordinator")}</span>
                     <span className="text-[10px] text-text-tertiary mt-1 leading-tight">{tSettings("ownerModeCoordinatorDesc")}</span>
                </button>
            </div>
        </div>

        <div className="h-px bg-white/10" />

        {/* Max Players */}
        <label className="block space-y-2">
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <span>{t("maxPlayers")}</span>
            <span>{maxPlayers}</span>
          </div>
          <input
            type="range"
            min={3}
            max={20}
            step={1}
            value={maxPlayers}
            disabled={!editable}
            onChange={(event) =>
              onMaxPlayersChange?.(Number(event.target.value))
            }
            className="w-full accent-primary"
          />
        </label>

        {/* Discussion Duration */}
        <label className="block space-y-2">
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <span>{t("discussionDuration")}</span>
            <span>{tSettings("seconds", { count: discussionDuration })}</span>
          </div>
          <input
            type="range"
            min={10}
            max={600}
            step={5}
            value={discussionDuration}
            disabled={!editable}
            onChange={(event) =>
              onDiscussionDurationChange?.(Number(event.target.value))
            }
            className="w-full accent-primary"
          />
        </label>

        {/* Advanced Phase Timers */}
        <DurationInput 
            label={tSettings("publicVotingDuration")} 
            value={publicVotingDuration} 
            onChange={onPublicVotingDurationChange} 
            editable={editable}
            defaultValue={45}
        />
        <DurationInput 
            label={tSettings("abilityPhaseDuration")} 
            value={abilityPhaseDuration} 
            onChange={onAbilityPhaseDurationChange} 
            editable={editable}
            defaultValue={30}
        />
        <DurationInput 
            label={tSettings("mafiaVotingDuration")} 
            value={mafiaVotingDuration} 
            onChange={onMafiaVotingDurationChange} 
            editable={editable}
            defaultValue={45}
        />
      </div>
    </section>
  );
}
