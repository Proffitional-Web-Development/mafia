import type * as React from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type SecondaryButtonVariant =
  | "outline"
  | "ghost"
  | "oauth"
  | "dashed"
  | "text-link"
  | "danger-text";

interface SecondaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
  iconPosition?: "start" | "end";
  variant?: SecondaryButtonVariant;
  fullWidth?: boolean;
}

export function SecondaryButton({
  icon,
  iconPosition = "start",
  variant = "outline",
  fullWidth = true,
  className,
  children,
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        fullWidth && "w-full",
        variant === "outline" &&
          "border border-white/15 bg-surface/50 text-text-secondary hover:border-primary/50 hover:bg-primary/10 hover:text-white",
        variant === "ghost" &&
          "bg-transparent text-text-secondary hover:bg-white/5 hover:text-white",
        variant === "oauth" &&
          "border border-white/15 bg-white/5 text-white hover:bg-white/10",
        variant === "dashed" &&
          "border border-dashed border-white/25 bg-transparent text-text-secondary hover:border-primary/50 hover:text-white",
        variant === "text-link" &&
          "w-auto min-h-0 bg-transparent p-0 text-primary hover:text-primary-light",
        variant === "danger-text" &&
          "w-auto min-h-0 bg-transparent p-0 text-danger hover:text-danger-dark",
        className,
      )}
      {...props}
    >
      {icon && iconPosition === "start" ? <Icon name={icon} variant="round" /> : null}
      <span>{children}</span>
      {icon && iconPosition === "end" ? <Icon name={icon} variant="round" /> : null}
    </button>
  );
}
