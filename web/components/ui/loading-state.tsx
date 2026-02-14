import { cn } from "@/lib/utils";

interface LoadingStateProps {
  label: string;
  hint?: string;
  compact?: boolean;
  className?: string;
}

export function LoadingState({
  label,
  hint,
  compact = false,
  className,
}: LoadingStateProps) {
  return (
    <output
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-surface/40 p-6 text-center",
        compact && "p-4 gap-2",
        className,
      )}
      aria-live="polite"
    >
      <div className="h-8 w-8 rounded-full border-2 border-primary/40 border-t-primary motion-safe:animate-spin motion-reduce:animate-none" />
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
    </output>
  );
}
