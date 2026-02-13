import { cn } from "@/lib/utils";

interface DividerProps {
  label?: string;
  variant?: "text" | "gradient" | "icon" | "plain";
  icon?: React.ReactNode;
  className?: string;
}

export function Divider({
  label,
  variant = "text",
  icon,
  className,
}: DividerProps) {
  if (variant === "plain") {
    return <div className={cn("h-px w-full bg-white/10", className)} />;
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "h-px flex-1",
          variant === "gradient"
            ? "bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            : "bg-white/10",
        )}
      />
      {(label || icon) && (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest",
            variant === "gradient" ? "gradient-text" : "text-text-tertiary",
          )}
        >
          {variant === "icon" ? icon : null}
          {label}
        </span>
      )}
      <div
        className={cn(
          "h-px flex-1",
          variant === "gradient"
            ? "bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            : "bg-white/10",
        )}
      />
    </div>
  );
}
