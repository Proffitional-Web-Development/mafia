"use client";

import { cn } from "@/lib/utils";

interface SettingsPanelProps {
  discussionDuration: number;
  maxPlayers: number;
  editable?: boolean;
  onDiscussionDurationChange?: (value: number) => void;
  onMaxPlayersChange?: (value: number) => void;
  className?: string;
}

export function SettingsPanel({
  discussionDuration,
  maxPlayers,
  editable = false,
  onDiscussionDurationChange,
  onMaxPlayersChange,
  className,
}: SettingsPanelProps) {
  return (
    <section className={cn("rounded-2xl border border-white/10 bg-surface/60 p-4", className)}>
      <h3 className="mb-3 text-sm font-semibold text-white">Room Settings</h3>

      <div className="space-y-4">
        <label className="block space-y-2">
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <span>Discussion Duration</span>
            <span>{discussionDuration}s</span>
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

        <label className="block space-y-2">
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <span>Max Players</span>
            <span>{maxPlayers}</span>
          </div>
          <input
            type="range"
            min={3}
            max={20}
            step={1}
            value={maxPlayers}
            disabled={!editable}
            onChange={(event) => onMaxPlayersChange?.(Number(event.target.value))}
            className="w-full accent-primary"
          />
        </label>
      </div>
    </section>
  );
}
