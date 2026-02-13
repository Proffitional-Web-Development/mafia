import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full font-semibold leading-none",
  {
    variants: {
      variant: {
        "vote-count": "min-h-5 min-w-5 bg-danger text-white text-[10px] px-1.5 motion-safe:animate-bounce motion-reduce:animate-none",
        you: "bg-warning/20 text-warning border border-warning/50 text-[10px] px-2 py-1 uppercase tracking-wider",
        host: "bg-warning/20 text-warning border border-warning/50 text-[10px] px-2 py-1",
        phase:
          "bg-primary/20 text-primary-light border border-primary/40 text-[10px] px-2 py-1 uppercase tracking-wider",
        status:
          "bg-success/20 text-success border border-success/40 text-[10px] px-2 py-1",
        "player-count":
          "bg-white/10 text-text-secondary border border-white/15 text-[10px] px-2 py-1",
        "investigation-result":
          "bg-white/10 text-text-secondary border border-white/15 text-[10px] px-2 py-1",
        notification: "min-h-5 min-w-5 bg-danger text-white text-[10px] px-1.5 motion-safe:animate-pulse motion-reduce:animate-none",
      },
      size: {
        sm: "text-[10px]",
        md: "text-xs",
      },
    },
    compoundVariants: [
      {
        variant: "investigation-result",
        className: "uppercase tracking-wider",
      },
    ],
    defaultVariants: {
      variant: "status",
      size: "sm",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  resultTone?: "mafia" | "innocent";
}

export function Badge({
  className,
  variant,
  size,
  resultTone,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        badgeVariants({ variant, size }),
        variant === "investigation-result" && resultTone === "mafia" && "bg-danger/20 text-danger border-danger/40",
        variant === "investigation-result" && resultTone === "innocent" && "bg-success/20 text-success border-success/40",
        className,
      )}
      {...props}
    />
  );
}
