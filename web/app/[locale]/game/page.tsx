"use client";

import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useFormatter, useTranslations } from "next-intl";

import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { useRouter } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function GamePage() {
  const t = useTranslations("game");
  const format = useFormatter();
  const router = useRouter();
  const { signOut } = useAuthActions();
  const currentUser = useQuery(api.users.getCurrentUser);

  async function handleSignOut() {
    await signOut();
    router.replace("/auth");
  }

  if (!currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">{t("loadingSession")}</p>
      </main>
    );
  }

  const currentTimeText = format.dateTime(new Date(), {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6">
      <section className="w-full space-y-4 rounded-xl border p-6">
        <div className="w-full flex justify-end">
          <LanguageSwitcher />
        </div>
        <h1 className="text-xl font-semibold">{t("lobbyTitle")}</h1>
        <div className="flex items-center gap-3">
          <UserAvatar
            username={currentUser.username ?? undefined}
            avatarUrl={currentUser.avatarUrl ?? undefined}
            size={44}
          />
          <div>
            <p className="font-medium">
              {currentUser.username ?? currentUser.name ?? t("fallbackPlayer")}
            </p>
            <p className="text-sm text-zinc-500">
              {currentUser.email ?? t("noEmail")}
            </p>
          </div>
        </div>
        <p className="text-sm text-zinc-500">
          {t("currentTime", { value: currentTimeText })}
        </p>
        <Button onClick={handleSignOut}>{t("logout")}</Button>
      </section>
    </main>
  );
}
