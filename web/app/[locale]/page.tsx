"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function HomePage() {
  const t = useTranslations("home");
  const currentUser = useQuery(api.users.getCurrentUser);

  const destination =
    currentUser && currentUser.hasCompletedProfile ? "/game" : "/auth";

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <section className="flex w-full max-w-xl flex-col items-center gap-4 text-center">
        <div className="w-full flex justify-end">
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
