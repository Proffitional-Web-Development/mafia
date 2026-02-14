"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { use, useCallback, useEffect, useState } from "react";
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
import { TextInput } from "@/components/ui/text-input";
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
    // Check if user is a member/player? If not, they shouldn't see GameRouter yet?
    // GameRouter loads game state. If not a player, query fails?
    // But roomState returned currentGameId.
    // If not a member, we should probably redirect or error in RoomPage logic earlier?
    // But let's stick to RoomPage logic -> LobbyView handles joining if waiting.
    // If in-game, and user is NOT a member...
    const isMember = roomState.members.some((m) => m.userId === currentUser.id);
    if (!isMember) {
      // Cannot join in-game room via this route currently
      // Show error or redirect
      // For now, let's render LobbyView which will show "Game started" via auto-join logic?
      // But LobbyView expects roomState.
      // If status is in-game, joinRoomByLink will return GAME_STARTED.
      // So we can fall through to LobbyView logic if !isMember?
    } else {
      return (
        <GameRouter
          gameId={roomState.currentGameId}
          currentUserId={currentUser.id}
        />
      );
    }
  }

  // Otherwise show the lobby (or handle join if game started but not member)
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
  const updateMemeLevel = useMutation(api.rooms.updateMemeLevel);
  const kickPlayer = useMutation(api.rooms.kickPlayer);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const startGame = useMutation(api.rooms.startGame);
  const joinRoomByLink = useMutation(api.rooms.joinRoomByLink);
  const mafiaInfo = useQuery(api.rooms.getMaxAllowedMafiaInfo, { roomId });

  const [starting, setStarting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [memeUpdating, setMemeUpdating] = useState(false);
  const [mafiaUpdating, setMafiaUpdating] = useState(false);
  const [autoResettingMafia, setAutoResettingMafia] = useState(false);
  const [copied, setCopied] = useState(false);
  const [kickTarget, setKickTarget] = useState<{
    userId: Id<"users">;
    username: string;
  } | null>(null);

  // Auto-join state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [hasAttemptedAutoJoin, setHasAttemptedAutoJoin] = useState(false);

  const isOwner = roomState.ownerId === currentUserId;
  const memberCount = roomState.members.length;
  const canStart = memberCount >= 4;
  const isMember = roomState.members.some((m) => m.userId === currentUserId);

  const redirectToLobbyWithJoinError = useCallback(
    (key: "gameStarted" | "roomFull" | "notFound" | "passwordRequired") => {
      router.replace(`/game?joinError=${key}`);
    },
    [router],
  );

  useEffect(() => {
    if (isMember || hasAttemptedAutoJoin || joining || passwordDialogOpen)
      return;

    const autoJoin = async () => {
      setJoining(true);
      setHasAttemptedAutoJoin(true);
      try {
        const result = await joinRoomByLink({ roomId });
        if (!result.success) {
          if (result.error === "PASSWORD_REQUIRED") {
            setPasswordDialogOpen(true);
          } else if (result.error === "GAME_STARTED") {
            redirectToLobbyWithJoinError("gameStarted");
          } else if (result.error === "ROOM_FULL") {
            redirectToLobbyWithJoinError("roomFull");
          } else if (result.error === "ROOM_NOT_FOUND") {
            redirectToLobbyWithJoinError("notFound");
          } else if (result.error === "INVALID_PASSWORD") {
            setError(t("join.passwordRequired")); // Should not happen on auto-join
          }
        }
      } catch (e) {
        setError(et(mapAppErrorKey(e)));
      } finally {
        setJoining(false);
      }
    };

    autoJoin();
  }, [
    et,
    hasAttemptedAutoJoin,
    isMember,
    joinRoomByLink,
    joining,
    passwordDialogOpen,
    redirectToLobbyWithJoinError,
    roomId,
    t,
  ]);

  useEffect(() => {
    if (
      !isOwner ||
      !mafiaInfo ||
      mafiaInfo.customMafiaCount === undefined ||
      mafiaInfo.customValid ||
      autoResettingMafia
    ) {
      return;
    }

    let cancelled = false;
    setAutoResettingMafia(true);

    void (async () => {
      try {
        await updateSettings({
          roomId,
          settings: { mafiaCount: null },
        });
        if (!cancelled) {
          setInfoMessage(t("settings.mafiaCountReset"));
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(et(mapAppErrorKey(e)));
        }
      } finally {
        if (!cancelled) {
          setAutoResettingMafia(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [autoResettingMafia, et, isOwner, mafiaInfo, roomId, t, updateSettings]);

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
      setInfoMessage(null);
      if (field === "discussionDuration") {
        await updateSettings({
          roomId,
          settings: { discussionDuration: value as number },
        });
      } else if (field === "maxPlayers") {
        const result = await updateSettings({
          roomId,
          settings: { maxPlayers: value as number },
        });
        if (result.mafiaCountReset) {
          setInfoMessage(t("settings.mafiaCountReset"));
        }
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
      setError(null);
    } catch (e) {
      setError(et(mapAppErrorKey(e)));
    }
  }

  async function handleMafiaCountChange(value: string) {
    if (!isOwner || mafiaUpdating) return;

    const mafiaCount = value === "auto" ? null : Number(value);

    setMafiaUpdating(true);
    setInfoMessage(null);

    try {
      const result = await updateSettings({
        roomId,
        settings: { mafiaCount },
      });
      if (result.mafiaCountReset) {
        setInfoMessage(t("settings.mafiaCountReset"));
      }
      setError(null);
    } catch (e) {
      setError(et(mapAppErrorKey(e)));
    } finally {
      setMafiaUpdating(false);
    }
  }

  async function handleMemeLevelChange(level: "NORMAL" | "FUN" | "CHAOS") {
    if (!isOwner || memeUpdating || roomState.memeLevel === level) return;
    setMemeUpdating(true);
    try {
      await updateMemeLevel({ roomId, memeLevel: level });
    } catch (e) {
      setError(et(mapAppErrorKey(e)));
    } finally {
      setMemeUpdating(false);
    }
  }

  async function handlePasswordJoin() {
    setJoining(true);
    setError(null);
    try {
      const result = await joinRoomByLink({ roomId, password: passwordInput });
      if (result.success) {
        setPasswordDialogOpen(false);
      } else {
        if (
          result.error === "INVALID_PASSWORD" ||
          result.error === "PASSWORD_REQUIRED"
        ) {
          setError(t("join.passwordRequired"));
        } else if (result.error === "GAME_STARTED") {
          redirectToLobbyWithJoinError("gameStarted");
        } else if (result.error === "ROOM_FULL") {
          redirectToLobbyWithJoinError("roomFull");
        } else if (result.error === "ROOM_NOT_FOUND") {
          redirectToLobbyWithJoinError("notFound");
        } else {
          setError(result.error ?? "Unknown error");
        }
      }
    } catch (e) {
      setError(et(mapAppErrorKey(e)));
    } finally {
      setJoining(false);
    }
  }

  return (
    <main className="relative mx-auto min-h-[100dvh] w-full max-w-sm overflow-hidden px-4 pb-28 pt-6 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
      <div className="pointer-events-none absolute -top-24 -end-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-pulse-slow" />
      <div className="pointer-events-none absolute -bottom-24 -start-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-pulse-slow" />

      {/* Header */}
      <section className="relative z-10 mx-auto w-full max-w-sm space-y-5 md:max-w-2xl lg:max-w-5xl">
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

        <div className="space-y-5 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0">
          {/* Players */}
          <section className="w-full space-y-3 rounded-2xl border border-white/10 bg-surface/60 p-4 lg:col-span-7">
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

            <PlayerGrid
              players={[]}
              columns={4}
              gap="md"
              showOwnerBadge={false}
            >
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
                length: Math.max(
                  0,
                  roomState.settings.maxPlayers - memberCount,
                ),
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
              <p className="text-center text-xs text-text-muted">
                {t("minPlayersRequired", { count: 4 })}
              </p>
            )}
          </section>

          {/* Settings */}
          <section className="space-y-3 lg:col-span-5">
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
                {t("settings.mafiaCount")}
              </p>
              <p className="mb-2 text-xs text-text-tertiary">
                {mafiaInfo?.customMafiaCount !== undefined
                  ? t("settings.mafiaDisplayCustom", {
                      count: mafiaInfo.customMafiaCount,
                    })
                  : t("settings.mafiaDisplayAuto", {
                      count: mafiaInfo?.autoMafiaCount ?? 1,
                    })}
              </p>

              {isOwner ? (
                <div className="space-y-2">
                  <select
                    value={
                      roomState.settings.mafiaCount === undefined
                        ? "auto"
                        : String(roomState.settings.mafiaCount)
                    }
                    onChange={(event) =>
                      void handleMafiaCountChange(event.target.value)
                    }
                    disabled={
                      mafiaUpdating ||
                      autoResettingMafia ||
                      !mafiaInfo ||
                      mafiaInfo.currentPlayerCount < 4
                    }
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary/50 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={t("settings.mafiaCount")}
                  >
                    <option value="auto" className="bg-surface text-white">
                      {t("settings.mafiaCountAuto", {
                        count: mafiaInfo?.autoMafiaCount ?? 1,
                      })}
                    </option>
                    {Array.from(
                      { length: mafiaInfo?.maxAllowed ?? 1 },
                      (_, index) => index + 1,
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
              ) : (
                <p className="text-[11px] text-text-tertiary">
                  {t("readOnlySettings")}
                </p>
              )}

              {mafiaInfo?.customMafiaCount !== undefined &&
              !mafiaInfo.customValid ? (
                <p className="mt-2 text-xs text-danger">
                  {t("settings.mafiaCountInvalid")}
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-white/10 bg-surface/60 p-4">
              <p className="mb-2 text-sm font-medium text-white">
                {t("memeLevel.title")}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
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
                  const selected = roomState.memeLevel === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={!isOwner || memeUpdating}
                      onClick={() => handleMemeLevelChange(option.value)}
                      className={[
                        "rounded-lg border px-3 py-2 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-60",
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
            </section>
          </section>
        </div>

        {/* Error */}
        {error && (
          <StatusBanner
            message={error}
            variant="error"
            className="text-center"
          />
        )}
        {infoMessage && (
          <StatusBanner
            message={infoMessage}
            variant="info"
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

      {/* Password Dialog */}
      {passwordDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-surface p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {t("enterPrivateRoomPassword")}
            </h3>
            <TextInput
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              placeholder={t("optionalRoomPassword")}
              type="password"
            />
            <div className="flex justify-end gap-3">
              <SecondaryButton
                onClick={() => router.push("/game")}
                disabled={joining}
              >
                {ct("cancel")}
              </SecondaryButton>
              <PrimaryButton onClick={handlePasswordJoin} loading={joining}>
                {ct("confirm")}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
