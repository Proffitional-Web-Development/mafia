"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { ChatPanel } from "@/components/game/chat-panel";
import { CoordinatorPanel } from "@/components/game/coordinator-panel";
import { DiscussionPhase } from "@/components/game/discussion-phase";
import { GameEventTimeline } from "@/components/game/game-event-timeline";
import { MusicToggle } from "@/components/game/header-controls";
import { PhaseHeader } from "@/components/game/phase-header";
import {
  AbilityPhase,
  AbilityPhaseNightTransition,
} from "@/components/game/phases/ability-phase";
import { MafiaVotingPhase } from "@/components/game/phases/ability-phase/mafia-voting-phase";
import { ResolutionPhase } from "@/components/game/phases/ability-phase/resolution-phase";
import { FinishedPhase } from "@/components/game/phases/finished-phase";
import { PhaseTransitionController } from "@/components/game/phases/phase-transition-controller";
import { PlayerGraveyard } from "@/components/game/player-graveyard";
import { PublicVotingPhase } from "@/components/game/public-voting-phase";
import { RoleLogsPanel } from "@/components/game/role-logs-panel";
import { RoleRevealPhase } from "@/components/game/role-reveal-phase";
import { RoundSummaryModal } from "@/components/game/round-summary-modal";
import { VoiceMessagePlayer } from "@/components/providers/voice-message-player";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useChatUnread } from "@/hooks/use-chat-unread";
import { cn } from "@/lib/utils";

interface GameRouterProps {
  gameId: Id<"games">;
  currentUserId: Id<"users">;
}

export function GameRouter({ gameId, currentUserId }: GameRouterProps) {
  const gameState = useQuery(api.stateMachine.getGameState, { gameId });
  const roomState = useQuery(
    api.rooms.getRoomState,
    gameState?.game.roomId
      ? { roomId: gameState.game.roomId as Id<"rooms"> }
      : "skip",
  );
  const pt = useTranslations("phases");
  const ct = useTranslations("common");
  const et = useTranslations("events");
  const cht = useTranslations("chat");
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [summaryRound, setSummaryRound] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const previousRoundRef = useRef<number | null>(null);
  const chatUnread = useChatUnread(gameId, isChatOpen);

  useEffect(() => {
    if (!gameState) return;

    const currentRound = gameState.game.round;
    const previousRound = previousRoundRef.current;

    if (previousRound === null) {
      previousRoundRef.current = currentRound;
      return;
    }

    if (
      currentRound > previousRound &&
      previousRound >= 1 &&
      gameState.game.phase !== "finished"
    ) {
      setSummaryRound(previousRound);
      setShowRoundSummary(true);
    }

    previousRoundRef.current = currentRound;
  }, [gameState]);

  if (!gameState) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingState label={ct("loading")} compact className="max-w-xs" />
      </main>
    );
  }

  const { game, me, isCoordinator } = gameState;

  if (isCoordinator) {
    return <CoordinatorPanel gameId={gameId} currentUserId={currentUserId} />;
  }

  if (!me) {
    return null;
  }

  function toggleGameLog() {
    setIsLogOpen((prev) => !prev);
  }

  function toggleChat() {
    setIsChatOpen((prev) => !prev);
  }

  const isOwner = roomState?.ownerId === currentUserId;

  const deadPlayers = gameState.players.filter((player) => !player.isAlive);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-4 gap-4">
      <PhaseTransitionController phase={game.phase} />
      <PhaseHeader
        phase={game.phase}
        round={game.round}
        isAlive={me.isAlive}
        role={me.role}
        memeLevel={roomState?.memeLevel}
        actions={
          <div className="flex items-center gap-1.5">
            <MusicToggle />

            {/* Chat toggle */}
            <button
              type="button"
              onClick={toggleChat}
              aria-label={cht("title")}
              className={cn(
                "relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-colors",
                "hover:bg-white/10 hover:text-white",
                isChatOpen && "bg-primary/20 border-primary/40 text-primary",
              )}
            >
              <Icon name="chat" variant="round" size="sm" />
              {chatUnread > 0 && !isChatOpen ? (
                <span className="absolute -end-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-white">
                  {chatUnread > 99 ? "99+" : chatUnread}
                </span>
              ) : null}
            </button>

            {/* Game log toggle */}
            <button
              type="button"
              onClick={toggleGameLog}
              aria-label={et("timeline.title")}
              className={cn(
                "relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-colors",
                "hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon name="history" variant="round" size="sm" />
              {unreadCount > 0 ? (
                <span className="absolute -end-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </button>
          </div>
        }
      />

      <GameEventTimeline
        gameId={gameId}
        open={isLogOpen}
        onUnreadCountChange={setUnreadCount}
      />

      {game.phase !== "finished" ? (
        <RoleLogsPanel gameId={gameId} role={me.role} />
      ) : null}

      {/* Phase-specific content */}
      {game.phase === "cardDistribution" && <RoleRevealPhase gameId={gameId} />}

      {game.phase === "discussion" && (
        <DiscussionPhase
          gameId={gameId}
          currentUserId={currentUserId}
          deadlineAt={game.phaseDeadlineAt ?? undefined}
        />
      )}

      {game.phase === "publicVoting" && (
        <PublicVotingPhase
          gameId={gameId}
          currentUserId={currentUserId}
          deadlineAt={game.phaseDeadlineAt ?? undefined}
        />
      )}

      {game.phase === "abilityPhase" && (
        <>
          <AbilityPhase
            gameId={gameId}
            currentUserId={currentUserId}
            deadlineAt={game.phaseDeadlineAt ?? undefined}
          />
          <AbilityPhaseNightTransition />
        </>
      )}

      {game.phase === "mafiaVoting" && (
        <MafiaVotingPhase
          gameId={gameId}
          currentUserId={currentUserId}
          deadlineAt={game.phaseDeadlineAt ?? undefined}
        />
      )}

      {game.phase === "resolution" && (
        <ResolutionPhase
          gameId={gameId}
          currentUserId={currentUserId}
          deadlineAt={game.phaseDeadlineAt ?? undefined}
        />
      )}

      {game.phase === "endCheck" && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-zinc-500 text-sm">
            {pt(
              game.phase as
                | "abilityPhase"
                | "mafiaVoting"
                | "resolution"
                | "endCheck",
            )}
            ...
          </p>
        </div>
      )}

      {game.phase === "finished" && (
        <FinishedPhase gameId={gameId} currentUserId={currentUserId} />
      )}

      {game.phase !== "finished" && (
        <PlayerGraveyard
          players={deadPlayers.map((player) => ({
            playerId: String(player.playerId),
            username: player.username,
            avatarUrl: player.avatarUrl ?? undefined,
          }))}
        />
      )}

      {/* Chat panel (slide-over) */}
      {isChatOpen && gameState.game.roomId && (
        <ChatPanel
          gameId={gameId}
          roomId={gameState.game.roomId as Id<"rooms">}
          currentUserId={currentUserId}
          isOwner={isOwner}
          open={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}

      <VoiceMessagePlayer gameId={gameId} />

      {summaryRound !== null ? (
        <RoundSummaryModal
          gameId={gameId}
          round={summaryRound}
          open={showRoundSummary}
          onClose={() => setShowRoundSummary(false)}
        />
      ) : null}
    </main>
  );
}
