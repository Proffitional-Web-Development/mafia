import type * as React from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
  iconPosition?: "start" | "end";
  variant?: "primary" | "danger";
  loading?: boolean;
  shimmer?: boolean;
  fullWidth?: boolean;
}

export function PrimaryButton({
  icon,
  iconPosition = "end",
  variant = "primary",
  loading = false,
  shimmer = false,
  fullWidth = true,
  className,
  children,
  disabled,
  ...props
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={cn(
        "group relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        fullWidth && "w-full",
        variant === "primary" &&
          "bg-primary hover:bg-primary-dark shadow-[0_4px_20px_rgba(131,17,212,0.4)]",
        variant === "danger" &&
          "bg-danger hover:bg-danger-dark shadow-[0_0_20px_rgba(236,19,19,0.4)]",
        className,
      )}
      {...props}
    >
      {shimmer ? (
        <span className="pointer-events-none absolute inset-0 -translate-x-full motion-safe:animate-shimmer motion-reduce:animate-none bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      ) : null}

      {icon && (iconPosition === "start" || loading) ? (
        <Icon
          name={loading ? "autorenew" : icon}
          variant="round"
          className={cn(loading && "animate-spin")}
        />
      ) : null}
      <span className="relative z-10">{children}</span>
      {icon && iconPosition === "end" && !loading ? (
        <Icon
          name={icon}
          variant="round"
          className="transition-transform group-hover:translate-x-1"
        />
      ) : null}
    </button>
  );
}
