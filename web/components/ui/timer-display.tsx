"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useDirection } from "@/hooks/use-direction";
import { cn } from "@/lib/utils";

type TimerVariant = "circle" | "ring" | "inline" | "progress-bar" | "compact";

interface TimerDisplayProps {
  deadlineAt?: number;
  durationMs?: number;
  variant?: TimerVariant;
  className?: string;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function TimerDisplay({
  deadlineAt,
  durationMs,
  variant = "inline",
  className,
}: TimerDisplayProps) {
  const t = useTranslations("discussion");
  const direction = useDirection();
  const [remaining, setRemaining] = useState(() =>
    deadlineAt ? Math.max(0, deadlineAt - Date.now()) : 0,
  );

  useEffect(() => {
    if (!deadlineAt) return;

    const tick = () => {
      setRemaining(Math.max(0, deadlineAt - Date.now()));
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [deadlineAt]);

  if (!deadlineAt) return null;

  const isUrgent = remaining <= 30_000;
  const isCritical = remaining <= 10_000;

  const totalDuration = durationMs ?? Math.max(remaining, 1);
  const progress = Math.min(
    100,
    Math.max(0, (remaining / totalDuration) * 100),
  );

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const textClass = cn(
    "font-mono tabular-nums font-bold",
    isCritical
      ? "text-danger animate-pulse"
      : isUrgent
        ? "text-warning"
        : "text-text-primary",
  );

  if (variant === "progress-bar") {
    return (
      <div
        className={cn("space-y-1", className)}
        role="timer"
        aria-live="assertive"
      >
        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <span>{t("timeRemaining")}</span>
          <span className={textClass}>{formatTime(remaining)}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={cn(
              "h-full transition-[width] duration-200",
              direction === "rtl" && "ms-auto",
              isCritical
                ? "bg-danger motion-safe:animate-pulse"
                : isUrgent
                  ? "bg-warning"
                  : "bg-primary",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (variant === "ring") {
    return (
      <div
        className={cn(
          "relative inline-flex items-center justify-center",
          className,
        )}
        role="timer"
        aria-live="assertive"
      >
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          <title>{t("timeRemaining")}</title>
          <circle
            cx="40"
            cy="40"
            r={radius}
            className="fill-none stroke-white/10"
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            className={cn(
              "fill-none transition-[stroke-dashoffset] duration-200",
              isCritical
                ? "stroke-danger"
                : isUrgent
                  ? "stroke-warning"
                  : "stroke-primary",
            )}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className={cn("absolute text-sm", textClass)}>
          {formatTime(remaining)}
        </span>
      </div>
    );
  }

  if (variant === "circle") {
    return (
      <div
        className={cn(
          "inline-flex h-24 w-24 flex-col items-center justify-center rounded-full border border-white/15 bg-surface/60",
          "motion-safe:animate-timer-ring motion-reduce:animate-none",
          className,
        )}
        role="timer"
        aria-live="assertive"
      >
        <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
          {t("timeRemaining")}
        </span>
        <span className={cn("text-xl", textClass)}>
          {formatTime(remaining)}
        </span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <span
        className={cn("text-sm", textClass, className)}
        role="timer"
        aria-live="assertive"
      >
        {formatTime(remaining)}
      </span>
    );
  }

  return (
    <div
      className={cn("inline-flex items-center gap-2", className)}
      role="timer"
      aria-live="assertive"
    >
      <span className="text-xs uppercase tracking-wider text-text-tertiary">
        {t("timeRemaining")}
      </span>
      <span className={cn("text-2xl", textClass)}>{formatTime(remaining)}</span>
    </div>
  );
}
