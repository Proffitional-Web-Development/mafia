"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useRouter } from "@/i18n/navigation";

export default function GamePage() {
  const t = useTranslations("room");
  const gt = useTranslations("game");
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
        <p className="text-sm text-zinc-500">{gt("loadingSession")}</p>
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
      setError(e instanceof Error ? e.message : String(e));
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
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setJoining(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <section className="w-full space-y-6 rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{gt("lobbyTitle")}</h1>
          <LanguageSwitcher />
        </div>

        {/* Create Room */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? t("creating") : t("createRoom")}
        </Button>

        {/* Divider */}
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-zinc-300 dark:border-zinc-700" />
          <span className="mx-3 text-xs text-zinc-500">
            {t("orJoinExisting")}
          </span>
          <div className="flex-grow border-t border-zinc-300 dark:border-zinc-700" />
        </div>

        {/* Join Room */}
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder={t("enterCode")}
            maxLength={6}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm font-mono tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
            aria-label={t("roomCode")}
          />
          <Button
            type="submit"
            variant="outline"
            disabled={joining || !joinCode.trim()}
          >
            {joining ? t("joining") : t("joinRoom")}
          </Button>
        </form>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 text-center" role="alert">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
