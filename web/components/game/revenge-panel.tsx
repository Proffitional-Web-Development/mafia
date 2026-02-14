"use client";

import { useTranslations } from "next-intl";
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
  loading?: boolean;
  className?: string;
}

export function RevengePanel({
  players,
  selectedId,
  onSelect,
  onConfirm,
  confirmLabel = "Use Revenge",
  disabled = false,
  loading = false,
  className,
}: RevengePanelProps) {
  const t = useTranslations("resolution");

  return (
    <section
      className={cn(
        "rounded-xl border border-danger/40 bg-surface/30 backdrop-blur-md p-6 shadow-[0_0_20px_rgba(220,38,38,0.15)]",
        className,
      )}
    >
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-danger drop-shadow-sm">
        {t("boyPrompt.title")}
      </h3>
      <p className="mb-4 text-xs text-white/70">{t("boyPrompt.subtitle")}</p>

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
        loading={loading}
        disabled={disabled || !selectedId}
        onClick={onConfirm}
      >
        {confirmLabel}
      </PrimaryButton>
    </section>
  );
}
