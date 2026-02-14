"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { cn } from "@/lib/utils";

interface RoomCodeCardProps {
  code: string;
  label?: string;
  className?: string;
}

export function RoomCodeCard({ code, label, className }: RoomCodeCardProps) {
  const ct = useTranslations("common");
  const rt = useTranslations("room");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-surface/60 p-4",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
          {label ?? rt("roomCode")}
        </p>
        <SecondaryButton
          variant="ghost"
          fullWidth={false}
          onClick={handleCopy}
          icon="content_copy"
          aria-label={rt("copyInviteLink")}
        >
          {copied ? ct("copied") : ct("copy")}
        </SecondaryButton>
      </div>

      <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
        <Icon name="vpn_key" variant="round" className="text-primary-light" />
        <span className="font-mono text-2xl font-bold uppercase tracking-[0.35em] text-white">
          {code}
        </span>
      </div>
    </section>
  );
}
