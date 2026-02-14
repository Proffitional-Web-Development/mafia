import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BottomActionBarLayout = "single" | "split" | "stacked";

interface BottomActionBarProps {
  children: ReactNode;
  layout?: BottomActionBarLayout;
  className?: string;
}

export function BottomActionBar({
  children,
  layout = "single",
  className,
}: BottomActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div className="h-16 bg-gradient-to-t from-background via-background/80 to-transparent" />
      <div
        className={cn(
          "border-t border-white/10 bg-background/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl",
          className
        )}
      >
        <div
          className={cn(
            "mx-auto w-full max-w-sm md:max-w-3xl lg:max-w-5xl",
            layout === "single" && "flex items-center",
            layout === "split" && "grid grid-cols-2 gap-3",
            layout === "stacked" && "flex flex-col gap-3"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
