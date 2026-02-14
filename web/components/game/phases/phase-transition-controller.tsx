"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Doc } from "@/convex/_generated/dataModel";

interface PhaseTransitionControllerProps {
  phase: Doc<"games">["phase"];
}

export function PhaseTransitionController({
  phase,
}: PhaseTransitionControllerProps) {
  const t = useTranslations("phases");
  // We force a remount when phase changes by using the key prop.
  return (
    <PhaseFlash
      key={phase}
      title={t(phase as unknown as "lobby")}
    />
  );
}

function PhaseFlash({ title }: { title: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200",
      )}
      aria-live="polite"
    >
      <div className="rounded-2xl border border-white/15 bg-zinc-900/90 px-6 py-4 text-center shadow-2xl">
        <p className="text-lg font-semibold text-white">{title}</p>
      </div>
    </div>
  );
}
