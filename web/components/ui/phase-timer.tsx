"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PhaseTimerProps {
  deadlineAt: number | undefined;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function PhaseTimer({
  deadlineAt,
  className,
  size = "md",
}: PhaseTimerProps) {
  const t = useTranslations("discussion");
  const [remaining, setRemaining] = useState(() =>
    deadlineAt ? Math.max(0, deadlineAt - Date.now()) : 0,
  );

  useEffect(() => {
    if (!deadlineAt) return;

    const tick = () => {
      const ms = Math.max(0, deadlineAt - Date.now());
      setRemaining(ms);
      if (ms <= 0) return;
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [deadlineAt]);

  if (!deadlineAt) return null;

  const totalSeconds = Math.ceil(remaining / 1000);
  const isUrgent = totalSeconds <= 30;
  const isCritical = totalSeconds <= 10;

  const sizeClasses = {
    sm: "text-lg",
    md: "text-3xl",
    lg: "text-5xl",
  };

  return (
    <div
      className={cn("flex flex-col items-center gap-1", className)}
      role="timer"
      aria-live="assertive"
      aria-label={t("timeRemaining")}
    >
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
        {t("timeRemaining")}
      </span>
      <span
        className={cn(
          "font-mono font-bold tabular-nums transition-colors duration-300",
          sizeClasses[size],
          isCritical
            ? "text-red-500 animate-pulse"
            : isUrgent
              ? "text-amber-500"
              : "text-foreground",
        )}
      >
        {formatTime(remaining)}
      </span>
    </div>
  );
}
