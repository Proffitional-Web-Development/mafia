import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface WaitingOverlayProps {
  title: string;
  subtitle?: string;
  icon?: string;
  className?: string;
}

export function WaitingOverlay({
  title,
  subtitle,
  icon = "dark_mode",
  className,
}: WaitingOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 rounded-2xl bg-background/90 p-6 text-center backdrop-blur-md",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/15">
        <Icon
          name={icon}
          variant="round"
          className="text-primary-light"
          size="lg"
        />
      </span>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {subtitle ? (
        <p className="text-sm text-text-tertiary">{subtitle}</p>
      ) : null}
      <div className="flex items-center gap-1 text-primary-light" aria-hidden>
        <span className="animate-pulse [animation-delay:0ms]">•</span>
        <span className="animate-pulse [animation-delay:150ms]">•</span>
        <span className="animate-pulse [animation-delay:300ms]">•</span>
      </div>
    </div>
  );
}
