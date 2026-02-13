import { cn } from "@/lib/utils";

type IconVariant = "regular" | "round" | "outlined";
type IconSize = "sm" | "md" | "lg" | "xl";

interface IconProps {
  name: string;
  variant?: IconVariant;
  size?: IconSize;
  className?: string;
  ariaLabel?: string;
}

const variantClass: Record<IconVariant, string> = {
  regular: "material-icons",
  round: "material-icons-round",
  outlined: "material-symbols-outlined",
};

const sizeClass: Record<IconSize, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-[2rem]",
};

export function Icon({
  name,
  variant = "regular",
  size = "md",
  className,
  ariaLabel,
}: IconProps) {
  return (
    <span
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center leading-none",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
    >
      {name}
    </span>
  );
}
