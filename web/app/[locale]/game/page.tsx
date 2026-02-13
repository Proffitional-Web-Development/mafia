"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { UserStatusCard } from "@/components/game/user-status-card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { Divider } from "@/components/ui/divider";
import { LoadingState } from "@/components/ui/loading-state";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { StatusBanner } from "@/components/ui/status-banner";
import { TextInput } from "@/components/ui/text-input";
import { api } from "@/convex/_generated/api";
import { useRouter } from "@/i18n/navigation";
import { mapAppErrorKey } from "@/lib/error-message";

export default function GamePage() {
  const t = useTranslations("room");
  const gt = useTranslations("game");
  const ct = useTranslations("common");
  const et = useTranslations("errors");
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUser);
  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);

  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingState
          label={gt("loadingSession")}
          compact
          className="max-w-xs"
        />
      </main>
    );
  }

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const result = await createRoom();
      router.push(`/game/room/${result.roomId}`);
    } catch (e) {
      setError(et(mapAppErrorKey(e)));
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoining(true);
    setError(null);
    try {
      const result = await joinRoom({ code: joinCode.trim() });
      router.push(`/game/room/${result.roomId}`);
    } catch (err) {
      setError(et(mapAppErrorKey(err)));
    } finally {
      setJoining(false);
    }
  }

  return (
    <main className="relative mx-auto min-h-[100dvh] w-full max-w-sm overflow-hidden px-6 pb-28 pt-6">
      <div className="pointer-events-none absolute -top-24 -end-20 h-72 w-72 rounded-full bg-primary/25 blur-3xl animate-pulse-slow" />
      <div className="pointer-events-none absolute -bottom-24 -start-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-pulse-slow" />

      <section className="relative z-10 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <UserStatusCard
            username={
              currentUser.username ?? currentUser.name ?? gt("fallbackPlayer")
            }
            avatarUrl={currentUser.avatarUrl ?? undefined}
            subtitle={gt("lobbyTitle")}
            className="flex-1"
          />
          <LanguageSwitcher variant="icon" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface/60 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            {gt("lobbyTitle")}
          </p>
          <h1 className="mb-4 text-2xl font-bold tracking-tight text-white">
            {t("createRoom")}
          </h1>

          <PrimaryButton
            icon="add"
            onClick={handleCreate}
            disabled={creating}
            loading={creating}
            shimmer
          >
            {creating ? t("creating") : t("createRoom")}
          </PrimaryButton>
        </div>

        <Divider label={t("orJoinExisting")} variant="gradient" />

        <form
          onSubmit={handleJoin}
          className="space-y-3 rounded-2xl border border-white/10 bg-surface/60 p-5"
        >
          <TextInput
            type="text"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            placeholder={t("enterCode")}
            maxLength={6}
            variant="code"
            icon="vpn_key"
            aria-label={t("roomCode")}
          />

          <SecondaryButton
            type="submit"
            variant="outline"
            disabled={joining || !joinCode.trim()}
            loading={joining}
            icon="login"
            iconPosition="end"
          >
            {joining ? t("joining") : t("joinRoom")}
          </SecondaryButton>
        </form>

        {error ? (
          <StatusBanner
            message={error}
            variant="error"
            className="text-center"
          />
        ) : null}
      </section>

      <BottomNavigation
        items={[
          {
            key: "home",
            label: ct("home"),
            icon: "home",
            onClick: () => router.push("/"),
          },
          {
            key: "lobby",
            label: ct("lobby"),
            icon: "meeting_room",
            active: true,
          },
          { key: "settings", label: ct("settings"), icon: "settings" },
        ]}
      />
    </main>
  );
}
