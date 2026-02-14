"use client";

import { useTranslations } from "next-intl";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = useTranslations("common");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-sm rounded-xl border bg-background p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-zinc-500">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <SecondaryButton
            variant="outline"
            fullWidth={false}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel ?? t("cancel")}
          </SecondaryButton>
          <PrimaryButton
            fullWidth={false}
            onClick={onConfirm}
            disabled={loading}
            variant={variant === "destructive" ? "danger" : "primary"}
            className="min-h-10 px-4 py-2"
          >
            {loading ? t("loading") : (confirmLabel ?? t("confirm"))}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
