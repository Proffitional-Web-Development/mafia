"use client";

import { cn } from "@/lib/utils";

interface StatusBannerProps {
  message: string;
  variant?: "info" | "warning" | "dead" | "error";
  className?: string;
}

export function StatusBanner({
  message,
  variant = "info",
  className,
}: StatusBannerProps) {
  return (
    <output
      className={cn(
        "w-full rounded-xl border px-4 py-2 text-center text-sm font-medium backdrop-blur-md shadow-lg",
        variant === "dead" && "border-white/10 bg-white/5 text-text-tertiary",
        variant === "warning" && "border-warning/40 bg-warning/15 text-warning",
        variant === "info" &&
          "border-primary/40 bg-primary/15 text-primary-light",
        variant === "error" && "border-danger/40 bg-danger/15 text-danger",
        className,
      )}
      aria-live="polite"
    >
      {message}
    </output>
  );
}
