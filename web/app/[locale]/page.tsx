"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { api } from "@/convex/_generated/api";
import { Link } from "@/i18n/navigation";

export default function HomePage() {
  const t = useTranslations("home");
  const currentUser = useQuery(api.users.getCurrentUser);

  const destination = currentUser?.hasCompletedProfile ? "/game" : "/auth";

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <section className="flex w-full max-w-xl flex-col items-center gap-4 text-center">
        <div className="w-full flex items-center justify-end gap-3">
          {currentUser?.hasCompletedProfile && (
            <div className="flex items-center gap-2 me-auto">
              <UserAvatar
                username={currentUser.username ?? undefined}
                avatarUrl={currentUser.avatarUrl ?? undefined}
                size={32}
              />
              <span className="text-sm font-medium">
                {currentUser.username}
              </span>
            </div>
          )}
          <LanguageSwitcher />
        </div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
        <Link href={destination}>
          <Button>
            {currentUser
              ? currentUser.hasCompletedProfile
                ? t("goToGame")
                : t("completeProfile")
              : t("signInOrSignUp")}
          </Button>
        </Link>
      </section>
    </main>
  );
}
