"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { UserStatusCard } from "@/components/game/user-status-card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTheme } from "@/components/theme-provider";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { PrimaryButton } from "@/components/ui/primary-button";
import { api } from "@/convex/_generated/api";
import { Link } from "@/i18n/navigation";

export default function HomePage() {
  const t = useTranslations("home");
  const ct = useTranslations("common");
  const currentUser = useQuery(api.users.getCurrentUser);
  const { setTheme } = useTheme();

  const destination = currentUser?.hasCompletedProfile ? "/game" : "/auth";

  useEffect(() => {
    setTheme("mafia");
    return () => setTheme("default");
  }, [setTheme]);

  return (
    <main className="relative mx-auto min-h-[100dvh] w-full max-w-md overflow-hidden font-display-alt px-6 pb-28 pt-6 md:max-w-3xl md:px-8 lg:max-w-5xl lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(242,13,51,0.2),transparent_55%)]" />
      <div className="pointer-events-none absolute -top-32 -end-20 h-80 w-80 rounded-full bg-danger/25 blur-3xl animate-pulse-slow" />

      <section className="relative z-10 mx-auto flex min-h-[70dvh] w-full max-w-md flex-col gap-6 lg:max-w-3xl">
        <div className="flex items-center justify-end">
          <LanguageSwitcher variant="pill" />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-5xl font-black uppercase tracking-tight text-white lg:text-6xl">
            {t("title")}
          </h1>
          <p className="text-xs uppercase tracking-[0.25em] text-text-tertiary">
            {t("trustNoOne")}
          </p>
        </div>

        <div className="relative mx-auto mt-2 h-64 w-64 overflow-hidden rounded-2xl border border-white/10 bg-surface-red/70 lg:h-72 lg:w-72">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_60%)]" />
          <div className="absolute inset-0 flex items-center justify-center text-7xl">
            🎭
          </div>
          {currentUser?.hasCompletedProfile ? (
            <UserStatusCard
              username={currentUser.username ?? undefined}
              avatarUrl={currentUser.avatarUrl ?? undefined}
              subtitle={t("description")}
              className="absolute bottom-3 start-1/2 w-[calc(100%-1.5rem)] -translate-x-1/2"
            />
          ) : null}
        </div>

        <div className="mt-auto space-y-3">
          <Link href={destination} className="block">
            <PrimaryButton variant="danger" icon="arrow_forward" shimmer>
              {currentUser
                ? currentUser.hasCompletedProfile
                  ? t("goToGame")
                  : t("completeProfile")
                : t("signInOrSignUp")}
            </PrimaryButton>
          </Link>
          <p className="text-center text-xs text-text-tertiary">
            {t("onlinePlayers")}
          </p>
        </div>
      </section>

      <BottomNavigation
        items={[
          { key: "home", label: ct("home"), icon: "home", active: true },
          { key: "profile", label: ct("profile"), icon: "person" },
          { key: "settings", label: ct("settings"), icon: "settings" },
        ]}
      />
    </main>
  );
}
