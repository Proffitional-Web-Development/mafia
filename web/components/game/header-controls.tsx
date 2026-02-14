"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { api } from "@/convex/_generated/api";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function MusicToggle({ className }: { className?: string }) {
  const t = useTranslations("settings.preferences");
  const user = useQuery(api.users.getCurrentUser);
  const toggleMusic = useMutation(api.users.toggleMusic);

  if (user === undefined) return null;

  const isEnabled = user?.musicEnabled ?? true;

  const handleToggle = async () => {
    try {
      await toggleMusic({ enabled: !isEnabled });
    } catch (e) {
      console.error("Failed to toggle music", e);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "rounded-full p-2 transition-colors hover:bg-white/5",
        isEnabled ? "text-primary" : "text-text-tertiary",
        className,
      )}
      type="button"
      title={isEnabled ? t("musicEnabled") : t("musicDisabled")}
    >
      <Icon
        name={isEnabled ? "volume_up" : "volume_off"}
        variant="round"
        className={isEnabled ? "text-primary" : "text-text-tertiary"}
      />
    </button>
  );
}

export function SettingsLink({ className }: { className?: string }) {
  const t = useTranslations("settings");
  return (
    <Link
      href="/settings"
      className={cn(
        "rounded-full p-2 text-text-secondary transition-colors hover:bg-white/5 hover:text-white",
        className,
      )}
      title={t("title")}
    >
      <Icon name="settings" variant="round" />
    </Link>
  );
}

export function HeaderControls({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <MusicToggle />
      <SettingsLink />
    </div>
  );
}
