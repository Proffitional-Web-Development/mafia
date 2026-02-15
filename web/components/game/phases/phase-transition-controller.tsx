"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { playPhaseCue } from "@/lib/phase-audio";
import { cn } from "@/lib/utils";

interface PhaseTransitionControllerProps {
  phase: Doc<"games">["phase"];
}

export function PhaseTransitionController({
  phase,
}: PhaseTransitionControllerProps) {
  const t = useTranslations("phases");
  const user = useQuery(api.users.getCurrentUser);
  // We force a remount when phase changes by using the key prop.
  return (
    <PhaseFlash
      key={phase}
      phase={phase}
      title={t(phase as unknown as "lobby")}
      musicEnabled={user?.musicEnabled ?? true}
    />
  );
}

function PhaseFlash({
  title,
  phase,
  musicEnabled,
}: {
  title: string;
  phase: Doc<"games">["phase"];
  musicEnabled: boolean;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    playPhaseCue(phase, musicEnabled);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [phase, musicEnabled]);

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
