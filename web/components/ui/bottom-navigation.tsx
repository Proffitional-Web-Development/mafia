"use client";

import { Icon } from "@/components/ui/icon";
import { useDirection } from "@/hooks/use-direction";
import { cn } from "@/lib/utils";

export type BottomNavItem = {
  key: string;
  label: string;
  icon: string;
  active?: boolean;
  onClick?: () => void;
};

interface BottomNavigationProps {
  items: BottomNavItem[];
  className?: string;
}

export function BottomNavigation({ items, className }: BottomNavigationProps) {
  const direction = useDirection();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-surface-darker/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl",
        className,
      )}
      aria-label="Bottom navigation"
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-sm items-center justify-between gap-2 md:max-w-3xl lg:max-w-5xl",
          direction === "rtl" && "flex-row-reverse",
        )}
      >
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className={cn(
              "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              item.active
                ? "bg-primary/20 text-primary-light"
                : "text-text-tertiary hover:text-text-secondary",
            )}
            aria-current={item.active ? "page" : undefined}
          >
            <Icon
              name={item.icon}
              variant="round"
              size="md"
              className={
                item.active ? "text-primary-light" : "text-text-tertiary"
              }
            />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
