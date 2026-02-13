"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { use, useState } from "react";
import { GameRouter } from "@/components/game/game-router";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UserAvatar } from "@/components/user-avatar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const roomState = useQuery(api.rooms.getRoomState, {
    roomId: roomId as Id<"rooms">,
  });
  const currentUser = useQuery(api.users.getCurrentUser);

  if (!roomState || !currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500 animate-pulse">Loading...</p>
      </main>
    );
  }

  // If room is in-game and has a currentGameId, show the game view
  if (roomState.status === "in-game" && roomState.currentGameId) {
    return (
      <GameRouter
        gameId={roomState.currentGameId}
        currentUserId={currentUser.id}
      />
    );
  }

  // Otherwise show the lobby
  return (
    <LobbyView
      roomId={roomId as Id<"rooms">}
      roomState={roomState}
      currentUserId={currentUser.id}
    />
  );
}

// ---------------------------------------------------------------------------
// Lobby View
// ---------------------------------------------------------------------------

type RoomState = NonNullable<
  ReturnType<typeof useQuery<typeof api.rooms.getRoomState>>
>;

function LobbyView({
  roomId,
  roomState,
  currentUserId,
}: {
  roomId: Id<"rooms">;
  roomState: RoomState;
  currentUserId: Id<"users">;
}) {
  const t = useTranslations("room");
  const ct = useTranslations("common");
  const router = useRouter();

  const updateSettings = useMutation(api.rooms.updateRoomSettings);
  const kickPlayer = useMutation(api.rooms.kickPlayer);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const startGame = useMutation(api.rooms.startGame);

  const [starting, setStarting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [kickTarget, setKickTarget] = useState<{
    userId: Id<"users">;
    username: string;
  } | null>(null);

  const isOwner = roomState.ownerId === currentUserId;
  const memberCount = roomState.members.length;
  const canStart = memberCount >= 3;

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      await startGame({ roomId });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStarting(false);
    }
  }

  async function handleLeave() {
    setLeaving(true);
    try {
      await leaveRoom({ roomId });
      router.replace("/game");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLeaving(false);
    }
  }

  async function handleCopyInvite() {
    const url = `${window.location.origin}${window.location.pathname.split("/game")[0]}/game?code=${roomState.code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback — copy code itself
      await navigator.clipboard.writeText(roomState.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleKick() {
    if (!kickTarget) return;
    try {
      await kickPlayer({
        roomId,
        targetUserId: kickTarget.userId,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setKickTarget(null);
  }

  async function handleSettingChange(
    field: string,
    value: number | boolean | Record<string, boolean>,
  ) {
    try {
      if (field === "discussionDuration") {
        await updateSettings({
          roomId,
          settings: { discussionDuration: value as number },
        });
      } else if (field === "maxPlayers") {
        await updateSettings({
          roomId,
          settings: { maxPlayers: value as number },
        });
      } else if (field === "enabledRoles") {
        await updateSettings({
          roomId,
          settings: {
            enabledRoles: value as {
              sheikh: boolean;
              girl: boolean;
              boy: boolean;
            },
          },
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center px-4 py-6 gap-6">
      {/* Header */}
      <div className="flex w-full items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t("settingsTitle")}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-lg tracking-widest text-zinc-400">
              {roomState.code}
            </span>
            <button
              type="button"
              onClick={handleCopyInvite}
              className="text-xs text-blue-500 hover:text-blue-400 underline"
            >
              {copied ? ct("copied") : t("copyInviteLink")}
            </button>
          </div>
        </div>
        <LanguageSwitcher />
      </div>

      {/* Players */}
      <section className="w-full rounded-xl border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-zinc-500">
            {ct("players")}
          </h2>
          <span className="text-xs text-zinc-400">
            {t("playersCount", {
              current: memberCount,
              max: roomState.settings.maxPlayers,
            })}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {roomState.members.map((member) => {
            const isMe = member.userId === currentUserId;
            return (
              <div
                key={member.userId}
                className="flex items-center gap-2 rounded-lg border p-2"
              >
                <UserAvatar
                  username={member.username}
                  avatarUrl={member.avatarUrl ?? undefined}
                  size={36}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.username}
                    {isMe && (
                      <span className="text-zinc-400 ms-1">({ct("you")})</span>
                    )}
                  </p>
                  {member.isOwner && (
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      {t("ownerBadge")}
                    </span>
                  )}
                </div>
                {isOwner && !isMe && (
                  <button
                    type="button"
                    onClick={() =>
                      setKickTarget({
                        userId: member.userId as Id<"users">,
                        username: member.username,
                      })
                    }
                    className="text-xs text-red-500 hover:text-red-400"
                  >
                    {t("kickPlayer")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {!canStart && (
          <p className="text-xs text-zinc-500 text-center">
            {t("minPlayersRequired", { count: 3 })}
          </p>
        )}
      </section>

      {/* Settings */}
      <section className="w-full rounded-xl border p-4 space-y-4">
        <h2 className="text-sm font-semibold uppercase text-zinc-500">
          {ct("settings")}
        </h2>
        {!isOwner && (
          <p className="text-xs text-zinc-400">{t("readOnlySettings")}</p>
        )}

        {/* Discussion Duration */}
        <div className="space-y-1">
          <label htmlFor="discussion-duration" className="text-sm font-medium">
            {t("discussionDuration")}
          </label>
          <div className="flex items-center gap-3">
            <input
              id="discussion-duration"
              type="range"
              min={10}
              max={600}
              step={10}
              value={roomState.settings.discussionDuration}
              disabled={!isOwner}
              onChange={(e) =>
                handleSettingChange(
                  "discussionDuration",
                  Number(e.target.value),
                )
              }
              className="flex-1 accent-blue-500"
            />
            <span className="text-sm font-mono w-14 text-end">
              {t("seconds", { count: roomState.settings.discussionDuration })}
            </span>
          </div>
        </div>

        {/* Max Players */}
        <div className="space-y-1">
          <label htmlFor="max-players" className="text-sm font-medium">
            {t("maxPlayers")}
          </label>
          <div className="flex items-center gap-3">
            <input
              id="max-players"
              type="range"
              min={3}
              max={20}
              step={1}
              value={roomState.settings.maxPlayers}
              disabled={!isOwner}
              onChange={(e) =>
                handleSettingChange("maxPlayers", Number(e.target.value))
              }
              className="flex-1 accent-blue-500"
            />
            <span className="text-sm font-mono w-8 text-end">
              {roomState.settings.maxPlayers}
            </span>
          </div>
        </div>

        {/* Enabled Roles */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("enabledRoles")}</p>
          <div className="flex flex-wrap gap-3">
            {(["sheikh", "girl", "boy"] as const).map((role) => (
              <label key={role} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={roomState.settings.enabledRoles[role]}
                  disabled={!isOwner}
                  onChange={(e) =>
                    handleSettingChange("enabledRoles", {
                      ...roomState.settings.enabledRoles,
                      [role]: e.target.checked,
                    })
                  }
                  className="accent-blue-500"
                />
                <RoleName role={role} />
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex w-full gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleLeave}
          disabled={leaving}
        >
          {t("leaveRoom")}
        </Button>
        {isOwner && (
          <Button
            className="flex-1"
            size="lg"
            onClick={handleStart}
            disabled={starting || !canStart}
          >
            {starting ? ct("loading") : t("startGame")}
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 text-center" role="alert">
          {error}
        </p>
      )}

      {/* Kick Confirm Dialog */}
      <ConfirmDialog
        open={!!kickTarget}
        title={t("kickPlayer")}
        message={t("kickConfirm", { username: kickTarget?.username ?? "" })}
        variant="destructive"
        onConfirm={handleKick}
        onCancel={() => setKickTarget(null)}
      />
    </main>
  );
}

function RoleName({ role }: { role: string }) {
  const t = useTranslations("roles");
  return <span>{t(role as "sheikh" | "girl" | "boy")}</span>;
}
