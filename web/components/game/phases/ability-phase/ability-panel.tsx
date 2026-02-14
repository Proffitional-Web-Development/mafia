"use client";

import type { PlayerView } from "@/components/ui/player-grid";
import { PlayerGrid } from "@/components/ui/player-grid";
import { PrimaryButton } from "@/components/ui/primary-button";
import { StatusBanner } from "@/components/ui/status-banner";
import type { Id } from "@/convex/_generated/dataModel";

interface AbilityPanelProps {
  title: string;
  subtitle: string;
  players: PlayerView[];
  currentUserId: Id<"users">;
  selectedTargetId: string | null;
  onSelectTarget: (playerId: string) => void;
  selectable: boolean;
  actionLabel: string;
  actionIcon: string;
  onAction: () => void;
  actionDisabled: boolean;
  actionLoading: boolean;
  canConfirm: boolean;
  confirmLabel: string;
  onConfirm: () => void;
  confirmDisabled: boolean;
  confirmLoading: boolean;
  error: string | null;
  children?: React.ReactNode;
}

export function AbilityPanel({
  title,
  subtitle,
  players,
  currentUserId,
  selectedTargetId,
  onSelectTarget,
  selectable,
  actionLabel,
  actionIcon,
  onAction,
  actionDisabled,
  actionLoading,
  canConfirm,
  confirmLabel,
  onConfirm,
  confirmDisabled,
  confirmLoading,
  error,
  children,
}: AbilityPanelProps) {
  return (
    <>
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-white glow-effect">
          {title}
        </h2>
        <p className="text-sm text-white/60">{subtitle}</p>
      </div>

      <PlayerGrid
        players={players}
        currentUserId={currentUserId}
        selectedId={selectedTargetId}
        onSelect={onSelectTarget}
        selectable={selectable}
        showOwnerBadge={false}
      />

      <div className="flex justify-center">
        <PrimaryButton
          onClick={onAction}
          disabled={actionDisabled}
          icon={actionIcon}
          loading={actionLoading}
        >
          {actionLabel}
        </PrimaryButton>
      </div>

      {canConfirm && (
        <div className="flex justify-center">
          <PrimaryButton
            onClick={onConfirm}
            disabled={confirmDisabled}
            icon="check_circle"
            loading={confirmLoading}
          >
            {confirmLabel}
          </PrimaryButton>
        </div>
      )}

      {children}

      {error && (
        <StatusBanner message={error} variant="error" className="text-center" />
      )}
    </>
  );
}
