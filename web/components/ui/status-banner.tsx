"use client";

import { cn } from "@/lib/utils";

interface StatusBannerProps {
  message: string;
  variant?: "info" | "warning" | "dead";
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
        "w-full rounded-lg px-4 py-2 text-center text-sm font-medium",
        variant === "dead" && "bg-zinc-800 text-zinc-300",
        variant === "warning" &&
          "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
        variant === "info" &&
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        className,
      )}
    >
      {message}
    </output>
  );
}
