"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { UserStatusCard } from "@/components/game/user-status-card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { Divider } from "@/components/ui/divider";
import { LoadingState } from "@/components/ui/loading-state";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { StatusBanner } from "@/components/ui/status-banner";
import { TextInput } from "@/components/ui/text-input";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import { mapAppErrorKey } from "@/lib/error-message";

function getAutoMafiaCount(playerCount: number): number {
  if (playerCount <= 5) return 1;
  if (playerCount <= 8) return 2;
  if (playerCount <= 12) return 3;
  return 4;
}

function getMaxAllowedMafia(playerCount: number): number {
  return Math.max(1, Math.ceil(playerCount / 2) - 1);
}

export default function GamePage() {
  const t = useTranslations("room");
  const gt = useTranslations("game");
  const ct = useTranslations("common");
  const et = useTranslations("errors");
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useQuery(api.users.getCurrentUser);
  const activeRooms = useQuery(api.rooms.listActiveRooms, { limit: 50 });
  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);

  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [roomVisibility, setRoomVisibility] = useState<"public" | "private">(
    "private"
  );
  const [createPassword, setCreatePassword] = useState("");
  const [memeLevel, setMemeLevel] = useState<"NORMAL" | "FUN" | "CHAOS">("FUN");
  const [createMafiaCount, setCreateMafiaCount] = useState<number | null>(null);
  const [roomSearch, setRoomSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const joinError = searchParams.get("joinError");
  const joinErrorMessage =
    joinError === "gameStarted"
      ? t("join.gameStarted")
      : joinError === "roomFull"
        ? t("join.roomFull")
        : joinError === "notFound"
          ? t("join.notFound")
          : joinError === "passwordRequired"
            ? t("join.passwordRequired")
            : null;

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
      const settings =
        createMafiaCount === null
          ? undefined
          : { mafiaCount: createMafiaCount };
      const result = await createRoom({
        visibility: roomVisibility,
        password:
          roomVisibility === "private" && createPassword.trim()
            ? createPassword.trim()
            : undefined,
        memeLevel,
        settings,
      });
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
      const result = await joinRoom({
        code: joinCode.trim(),
        password: joinPassword.trim() ? joinPassword.trim() : undefined,
      });
      router.push(`/game/room/${result.roomId}`);
    } catch (err) {
      setError(et(mapAppErrorKey(err)));
    } finally {
      setJoining(false);
    }
  }

  async function handleJoinActiveRoom(
    roomId: string,
    requiresPassword: boolean
  ) {
    setJoiningRoomId(roomId);
    setError(null);
    try {
      let password: string | undefined;
      if (requiresPassword) {
        const prompted = window.prompt(t("enterPrivateRoomPassword"))?.trim();
        if (!prompted) {
          setJoiningRoomId(null);
          return;
        }
        password = prompted;
      }

      const result = await joinRoom({
        roomId: roomId as Id<"rooms">,
        password,
      });
      router.push(`/game/room/${result.roomId}`);
    } catch (err) {
      setError(et(mapAppErrorKey(err)));
    } finally {
      setJoiningRoomId(null);
    }
  }

  const filteredRooms = (activeRooms ?? []).filter((room) => {
    const query = roomSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      room.code.toLowerCase().includes(query) ||
      room.ownerUsername.toLowerCase().includes(query)
    );
  });

  const creationPlayerCount = 12;
  const creationMaxAllowedMafia = getMaxAllowedMafia(creationPlayerCount);
  const creationAutoMafia = getAutoMafiaCount(creationPlayerCount);

  return (
    <main className="relative mx-auto min-h-[100dvh] w-full max-w-sm overflow-hidden px-6 pb-28 pt-6 md:max-w-3xl md:px-8 lg:max-w-5xl lg:px-10">
      <div className="pointer-events-none absolute -top-24 -end-20 h-72 w-72 rounded-full bg-primary/25 blur-3xl animate-pulse-slow" />
      <div className="pointer-events-none absolute -bottom-24 -start-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-pulse-slow" />

      <section className="relative z-10 mx-auto w-full max-w-sm space-y-6 md:max-w-2xl lg:max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          <UserStatusCard
            username={
              currentUser.displayName ??
              currentUser.username ??
              currentUser.name ??
              gt("fallbackPlayer")
            }
            avatarUrl={currentUser.avatarUrl ?? undefined}
            subtitle={gt("lobbyTitle")}
            className="flex-1"
          />
          <LanguageSwitcher variant="icon" />
        </div>

        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
          <div className="rounded-2xl border border-white/10 bg-surface/60 p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              {gt("lobbyTitle")}
            </p>
            <h1 className="mb-4 text-2xl font-bold tracking-tight text-white">
              {t("createRoom")}
            </h1>

            <div className="mb-4 flex items-center gap-2">
              <SecondaryButton
                variant={roomVisibility === "public" ? "outline" : "ghost"}
                fullWidth={false}
                onClick={() => setRoomVisibility("public")}
                icon="public"
              >
                {t("publicRoom")}
              </SecondaryButton>
              <SecondaryButton
                variant={roomVisibility === "private" ? "outline" : "ghost"}
                fullWidth={false}
                onClick={() => setRoomVisibility("private")}
                icon="lock"
              >
                {t("privateRoom")}
              </SecondaryButton>
            </div>

            {roomVisibility === "private" ? (
              <div className="mb-4">
                <TextInput
                  type="password"
                  value={createPassword}
                  onChange={(event) => setCreatePassword(event.target.value)}
                  placeholder={t("optionalRoomPassword")}
                  icon="password"
                  aria-label={t("optionalRoomPassword")}
                />
              </div>
            ) : null}

            <div className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                {t("memeLevel.title")}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(
                  [
                    {
                      value: "NORMAL",
                      label: t("memeLevel.normal"),
                      description: t("memeLevel.normalDesc"),
                    },
                    {
                      value: "FUN",
                      label: t("memeLevel.fun"),
                      description: t("memeLevel.funDesc"),
                    },
                    {
                      value: "CHAOS",
                      label: t("memeLevel.chaos"),
                      description: t("memeLevel.chaosDesc"),
                    },
                  ] as const
                ).map((option) => {
                  const selected = memeLevel === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMemeLevel(option.value)}
                      className={[
                        "rounded-lg border px-3 py-2 text-start transition-colors",
                        selected
                          ? "border-primary/50 bg-primary/20 text-white"
                          : "border-white/15 bg-white/5 text-text-secondary hover:bg-white/10",
                      ].join(" ")}
                    >
                      <p className="text-xs font-semibold">{option.label}</p>
                      <p className="text-[11px] text-text-tertiary">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                {t("settings.mafiaCount")}
              </p>
              <select
                value={
                  createMafiaCount === null ? "auto" : String(createMafiaCount)
                }
                onChange={(event) => {
                  const value = event.target.value;
                  setCreateMafiaCount(value === "auto" ? null : Number(value));
                }}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary/50"
                aria-label={t("settings.mafiaCount")}
              >
                <option value="auto" className="bg-surface text-white">
                  {t("settings.mafiaCountAuto", { count: creationAutoMafia })}
                </option>
                {Array.from(
                  { length: creationMaxAllowedMafia },
                  (_, index) => index + 1
                ).map((count) => (
                  <option
                    key={count}
                    value={count}
                    className="bg-surface text-white"
                  >
                    {count} ({t("settings.mafiaCountCustom")})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-text-tertiary">
                {t("settings.mafiaCountHelper")}
              </p>
            </div>

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

          <Divider
            label={t("orJoinExisting")}
            variant="gradient"
            className="lg:hidden"
          />

          <form
            onSubmit={handleJoin}
            className="space-y-3 rounded-2xl border border-white/10 bg-surface/60 p-5"
          >
            <TextInput
              type="text"
              value={joinCode}
              onChange={(event) =>
                setJoinCode(event.target.value.toUpperCase())
              }
              placeholder={t("enterCode")}
              maxLength={6}
              variant="code"
              icon="vpn_key"
              aria-label={t("roomCode")}
            />

            <TextInput
              type="password"
              value={joinPassword}
              onChange={(event) => setJoinPassword(event.target.value)}
              placeholder={t("roomPasswordOptional")}
              icon="password"
              aria-label={t("roomPasswordOptional")}
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
        </div>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-surface/60 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-white">
              {t("activeRooms")}
            </h2>
            <Badge variant="player-count">{filteredRooms.length}</Badge>
          </div>

          <TextInput
            type="text"
            value={roomSearch}
            onChange={(event) => setRoomSearch(event.target.value)}
            placeholder={t("searchRooms")}
            icon="search"
            aria-label={t("searchRooms")}
          />

          {activeRooms === undefined ? (
            <LoadingState label={ct("loading")} compact className="max-w-xs" />
          ) : filteredRooms.length === 0 ? (
            <p className="text-sm text-text-muted">{t("noActiveRooms")}</p>
          ) : (
            <div className="space-y-2">
              {filteredRooms.map((room) => (
                <div
                  key={room.roomId}
                  className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {room.ownerUsername}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {room.code} · {room.playerCount}/{room.maxPlayers}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="status" className="capitalize">
                      {room.visibility === "public"
                        ? t("publicRoom")
                        : t("privateRoom")}
                    </Badge>
                    <PrimaryButton
                      icon={
                        room.visibility === "private" ? "lock_open" : "login"
                      }
                      fullWidth={false}
                      loading={joiningRoomId === room.roomId}
                      disabled={joiningRoomId === room.roomId}
                      onClick={() =>
                        handleJoinActiveRoom(
                          room.roomId,
                          room.visibility === "private" && room.hasPassword
                        )
                      }
                    >
                      {t("joinRoom")}
                    </PrimaryButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {error ? (
          <StatusBanner
            message={error}
            variant="error"
            className="text-center"
          />
        ) : null}

        {joinErrorMessage ? (
          <StatusBanner
            message={joinErrorMessage}
            variant="warning"
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
