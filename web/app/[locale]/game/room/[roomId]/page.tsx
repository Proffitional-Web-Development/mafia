"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { use, useState } from "react";
import { GameRouter } from "@/components/game/game-router";
import { SettingsPanel } from "@/components/game/settings-panel";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Badge } from "@/components/ui/badge";
import { BottomActionBar } from "@/components/ui/bottom-action-bar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingState } from "@/components/ui/loading-state";
import { PlayerCard } from "@/components/ui/player-card";
import { PlayerGrid } from "@/components/ui/player-grid";
import { PrimaryButton } from "@/components/ui/primary-button";
import { RoomCodeCard } from "@/components/ui/room-code-card";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { StatusBanner } from "@/components/ui/status-banner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import { mapAppErrorKey } from "@/lib/error-message";

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const ct = useTranslations("common");
  const { roomId } = use(params);
  const roomState = useQuery(api.rooms.getRoomState, {
    roomId: roomId as Id<"rooms">,
  });
  const currentUser = useQuery(api.users.getCurrentUser);

  if (!roomState || !currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingState label={ct("loading")} compact className="max-w-xs" />
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
  const et = useTranslations("errors");
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
      setError(et(mapAppErrorKey(e)));
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
      setError(et(mapAppErrorKey(e)));
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
      setError(et(mapAppErrorKey(e)));
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
      setError(et(mapAppErrorKey(e)));
    }
  }

  return (
    <main className="relative mx-auto min-h-[100dvh] w-full max-w-sm overflow-hidden px-4 pb-28 pt-6">
      <div className="pointer-events-none absolute -top-24 -end-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-pulse-slow" />
      <div className="pointer-events-none absolute -bottom-24 -start-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-pulse-slow" />

      {/* Header */}
      <section className="relative z-10 space-y-5">
        <div className="flex w-full items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {t("settingsTitle")}
            </h1>
            <p className="text-xs text-text-tertiary">
              {t("playersCount", {
                current: memberCount,
                max: roomState.settings.maxPlayers,
              })}
            </p>
          </div>
          <LanguageSwitcher variant="icon" />
        </div>

        <RoomCodeCard
          code={roomState.code}
          label={t("roomCode")}
          className="w-full"
        />

        <div className="-mt-2">
          <SecondaryButton
            variant="text-link"
            fullWidth={false}
            onClick={handleCopyInvite}
            icon="content_copy"
          >
            {copied ? ct("copied") : t("copyInviteLink")}
          </SecondaryButton>
        </div>

        {/* Players */}
        <section className="w-full rounded-2xl border border-white/10 bg-surface/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">
              {ct("players")}
            </h2>
            <Badge variant="player-count">
              {t("playersCount", {
                current: memberCount,
                max: roomState.settings.maxPlayers,
              })}
            </Badge>
          </div>

          <PlayerGrid players={[]} columns={4} gap="md" showOwnerBadge={false}>
            {roomState.members.map((member) => {
              const isMe = member.userId === currentUserId;
              return (
                <PlayerCard
                  key={member.userId}
                  username={member.username}
                  avatarUrl={member.avatarUrl ?? undefined}
                  isYou={isMe}
                  isOwner={member.isOwner}
                  variant="lobby"
                  compact
                  trailing={
                    isOwner && !isMe ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setKickTarget({
                            userId: member.userId as Id<"users">,
                            username: member.username,
                          });
                        }}
                        className="mt-1 text-[10px] font-semibold text-danger hover:text-danger-dark"
                      >
                        {t("kickPlayer")}
                      </button>
                    ) : null
                  }
                />
              );
            })}

            {Array.from({
              length: Math.max(0, roomState.settings.maxPlayers - memberCount),
            })
              .slice(0, Math.max(0, 12 - memberCount))
              .map((_, slotOffset) => {
                const slotNumber = memberCount + slotOffset + 1;
                return (
                  <div
                    key={`slot-${slotNumber}`}
                    className="flex min-h-[94px] items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-xs text-text-muted"
                  >
                    +
                  </div>
                );
              })}
          </PlayerGrid>

          {!canStart && (
            <p className="text-xs text-text-muted text-center">
              {t("minPlayersRequired", { count: 3 })}
            </p>
          )}
        </section>

        {/* Settings */}
        <section className="space-y-3">
          {!isOwner && (
            <p className="text-xs text-text-tertiary">
              {t("readOnlySettings")}
            </p>
          )}

          <SettingsPanel
            discussionDuration={roomState.settings.discussionDuration}
            maxPlayers={roomState.settings.maxPlayers}
            editable={isOwner}
            onDiscussionDurationChange={(value) =>
              handleSettingChange("discussionDuration", value)
            }
            onMaxPlayersChange={(value) =>
              handleSettingChange("maxPlayers", value)
            }
          />

          <section className="rounded-2xl border border-white/10 bg-surface/60 p-4">
            <p className="mb-2 text-sm font-medium text-white">
              {t("enabledRoles")}
            </p>
            <div className="flex flex-wrap gap-3">
              {(["sheikh", "girl", "boy"] as const).map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-1.5 text-sm text-text-secondary"
                >
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
                    className="accent-primary"
                  />
                  <RoleName role={role} />
                </label>
              ))}
            </div>
          </section>
        </section>

        {/* Error */}
        {error && (
          <StatusBanner
            message={error}
            variant="error"
            className="text-center"
          />
        )}
      </section>

      {/* Actions */}
      <BottomActionBar layout={isOwner ? "split" : "single"}>
        <SecondaryButton
          variant="outline"
          onClick={handleLeave}
          disabled={leaving}
          loading={leaving}
          icon="logout"
        >
          {t("leaveRoom")}
        </SecondaryButton>
        {isOwner ? (
          <PrimaryButton
            onClick={handleStart}
            disabled={starting || !canStart}
            loading={starting}
            icon="play_arrow"
          >
            {starting ? ct("loading") : t("startGame")}
          </PrimaryButton>
        ) : null}
      </BottomActionBar>

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
