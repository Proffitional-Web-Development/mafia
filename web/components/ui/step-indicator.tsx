import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  className?: string;
}

export function StepIndicator({
  currentStep,
  totalSteps = 3,
  className,
}: StepIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        const active = step <= currentStep;
        return (
          <div
            key={step}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              active ? "bg-primary" : "bg-white/10",
            )}
            aria-hidden
          />
        );
      })}
      <span className="ms-1 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
        {currentStep}/{totalSteps}
      </span>
    </div>
  );
}
