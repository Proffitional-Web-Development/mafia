import { PlayerGrid, type PlayerView } from "@/components/ui/player-grid";
import { PrimaryButton } from "@/components/ui/primary-button";
import { cn } from "@/lib/utils";

interface RevengePanelProps {
  players: PlayerView[];
  selectedId?: string | null;
  onSelect?: (playerId: string) => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function RevengePanel({
  players,
  selectedId,
  onSelect,
  onConfirm,
  confirmLabel = "Use Revenge",
  disabled = false,
  className,
}: RevengePanelProps) {
  return (
    <section className={cn("rounded-2xl border border-danger/40 bg-danger/10 p-4", className)}>
      <h3 className="mb-2 text-sm font-semibold text-danger">Last Revenge</h3>
      <p className="mb-3 text-xs text-text-secondary">
        Choose one final target before time runs out.
      </p>

      <PlayerGrid
        players={players}
        selectedId={selectedId}
        onSelect={onSelect}
        selectable
        columns={2}
      />

      <PrimaryButton
        className="mt-4"
        variant="danger"
        icon="gavel"
        shimmer
        disabled={disabled || !selectedId}
        onClick={onConfirm}
      >
        {confirmLabel}
      </PrimaryButton>
    </section>
  );
}
