import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";

const PHASE_ORDER = [
  "lobby",
  "cardDistribution",
  "discussion",
  "publicVoting",
  "abilityPhase",
  "mafiaVoting",
  "resolution",
  "endCheck",
] as const;

type CorePhase = (typeof PHASE_ORDER)[number];
type Phase = CorePhase | "finished";
type TimedPhase =
  | "discussion"
  | "publicVoting"
  | "abilityPhase"
  | "mafiaVoting";

const PHASE_TO_INDEX: Record<CorePhase, number> = {
  lobby: 0,
  cardDistribution: 1,
  discussion: 2,
  publicVoting: 3,
  abilityPhase: 4,
  mafiaVoting: 5,
  resolution: 6,
  endCheck: 7,
};

const PUBLIC_VOTING_MS = 45_000;
const ABILITY_PHASE_MS = 30_000;
const MAFIA_VOTING_MS = 45_000;

type TransitionReason =
  | "manual"
  | "owner_override"
  | "timer"
  | "timer_auto_resolve"
  | "edge_case_finish";

function assertOrThrow(condition: unknown, message: string) {
  if (!condition) {
    throw new ConvexError(message);
  }
}

function getNominalNextPhase(current: CorePhase): CorePhase {
  const currentIndex = PHASE_TO_INDEX[current];
  if (current === "endCheck") {
    return "discussion";
  }
  return PHASE_ORDER[currentIndex + 1];
}

function toMsFromSeconds(seconds: number) {
  return Math.max(5_000, Math.floor(seconds * 1_000));
}

function getDeadlineMs(
  nextPhase: CorePhase,
  room: Doc<"rooms">,
): number | undefined {
  if (nextPhase === "discussion") {
    return toMsFromSeconds(room.settings.discussionDuration);
  }
  if (nextPhase === "publicVoting") {
    return PUBLIC_VOTING_MS;
  }
  if (nextPhase === "abilityPhase") {
    return ABILITY_PHASE_MS;
  }
  if (nextPhase === "mafiaVoting") {
    return MAFIA_VOTING_MS;
  }
  return undefined;
}

function isTimedPhase(phase: CorePhase): phase is TimedPhase {
  return (
    phase === "discussion" ||
    phase === "publicVoting" ||
    phase === "abilityPhase" ||
    phase === "mafiaVoting"
  );
}

function getAliveCounts(players: Doc<"players">[]) {
  const alivePlayers = players.filter((player) => player.isAlive);
  const aliveMafia = alivePlayers.filter(
    (player) => player.role === "mafia",
  ).length;
  const aliveCitizens = alivePlayers.length - aliveMafia;
  const hasAliveSheikh = alivePlayers.some(
    (player) => player.role === "sheikh",
  );
  const hasAliveGirl = alivePlayers.some((player) => player.role === "girl");

  return {
    alivePlayers,
    aliveMafia,
    aliveCitizens,
    hasAliveSheikh,
    hasAliveGirl,
  };
}

function getWinnerFaction(players: Doc<"players">[]) {
  const { aliveMafia, aliveCitizens } = getAliveCounts(players);
  if (aliveMafia === 0) {
    return "citizens" as const;
  }
  if (aliveMafia >= aliveCitizens) {
    return "mafia" as const;
  }
  return null;
}

async function evaluateWinCondition(
  ctx: MutationCtx,
  game: Doc<"games">,
  reason: string,
) {
  const players = await getPlayersByGame(ctx, game._id);
  const winner = getWinnerFaction(players);
  if (!winner) {
    return null;
  }

  return finishGame(ctx, game, winner, reason);
}

async function getRoomOrThrow(
  ctx: MutationCtx | QueryCtx,
  roomId: Id<"rooms">,
) {
  const room = await ctx.db.get(roomId);
  if (!room) {
    throw new ConvexError("Room not found.");
  }
  return room;
}

async function getGameOrThrow(
  ctx: MutationCtx | QueryCtx,
  gameId: Id<"games">,
) {
  const game = await ctx.db.get(gameId);
  if (!game) {
    throw new ConvexError("Game not found.");
  }
  return game;
}

async function getPlayersByGame(
  ctx: MutationCtx | QueryCtx,
  gameId: Id<"games">,
) {
  return ctx.db
    .query("players")
    .withIndex("by_gameId", (queryBuilder) => queryBuilder.eq("gameId", gameId))
    .collect();
}

async function appendTransitionEvent(
  ctx: MutationCtx,
  gameId: Id<"games">,
  round: number,
  from: Phase,
  to: Phase,
  reason: TransitionReason,
  metadata?: Record<string, unknown>,
) {
  await ctx.db.insert("gameEvents", {
    gameId,
    round,
    type: "phase_transition",
    payload: JSON.stringify({ from, to, reason, ...metadata }),
    timestamp: Date.now(),
  });
}

async function appendGameFinishedEvent(
  ctx: MutationCtx,
  gameId: Id<"games">,
  round: number,
  winnerFaction: "mafia" | "citizens",
  reason: string,
) {
  await ctx.db.insert("gameEvents", {
    gameId,
    round,
    type: "game_finished",
    payload: JSON.stringify({ winnerFaction, reason }),
    timestamp: Date.now(),
  });
}

async function isRoomOwner(
  ctx: MutationCtx,
  game: Doc<"games">,
  actorUserId: Id<"users">,
) {
  const room = await getRoomOrThrow(ctx, game.roomId);
  return room.ownerId === actorUserId;
}

async function finishGame(
  ctx: MutationCtx,
  game: Doc<"games">,
  winnerFaction: "mafia" | "citizens",
  reason: string,
) {
  if (game.phase === "finished") {
    return { phase: "finished" as const, round: game.round };
  }

  const players = await getPlayersByGame(ctx, game._id);
  for (const player of players) {
    const user = await ctx.db.get(player.userId);
    if (!user) continue;

    const currentStats = user.stats ?? {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
    };
    const didWin =
      (winnerFaction === "mafia" && player.role === "mafia") ||
      (winnerFaction === "citizens" && player.role !== "mafia");

    await ctx.db.patch(user._id, {
      stats: {
        gamesPlayed: currentStats.gamesPlayed + 1,
        wins: currentStats.wins + (didWin ? 1 : 0),
        losses: currentStats.losses + (didWin ? 0 : 1),
      },
    });
  }

  await ctx.db.patch(game._id, {
    phase: "finished",
    winnerFaction,
    endedAt: Date.now(),
  });

  await appendTransitionEvent(
    ctx,
    game._id,
    game.round,
    game.phase,
    "finished",
    "edge_case_finish",
    { winnerFaction, reason },
  );
  await appendGameFinishedEvent(
    ctx,
    game._id,
    game.round,
    winnerFaction,
    reason,
  );

  return { phase: "finished" as const, round: game.round };
}

async function transitionCore(
  ctx: MutationCtx,
  args: {
    gameId: Id<"games">;
    actorUserId?: Id<"users">;
    ownerOverride?: boolean;
    reason: TransitionReason;
  },
) {
  const game = await getGameOrThrow(ctx, args.gameId);
  assertOrThrow(game.phase !== "finished", "Game is already finished.");
  const currentPhase = game.phase as CorePhase;

  const room = await getRoomOrThrow(ctx, game.roomId);
  const players = await getPlayersByGame(ctx, game._id);
  const counts = getAliveCounts(players);
  const now = Date.now();

  if (args.actorUserId) {
    const owner = await isRoomOwner(ctx, game, args.actorUserId);
    assertOrThrow(owner, "Only the room owner can manually advance phase.");
  }

  if (currentPhase === "resolution") {
    const winResult = await evaluateWinCondition(
      ctx,
      game,
      "winner_detected_during_resolution",
    );
    if (winResult) {
      return winResult;
    }
  }

  let nextPhase = getNominalNextPhase(currentPhase);
  let resolvedReason = args.reason;

  if (currentPhase === "discussion" && nextPhase === "publicVoting") {
    const discussionDeadline = game.phaseDeadlineAt ?? 0;
    const discussionExpired = now >= discussionDeadline;
    const ownerOverride = Boolean(args.ownerOverride && args.actorUserId);
    assertOrThrow(
      discussionExpired || ownerOverride,
      "Cannot enter publicVoting before discussion deadline unless owner override is used.",
    );
    if (ownerOverride && !discussionExpired) {
      resolvedReason = "owner_override";
    }
  }

  if (currentPhase === "publicVoting" && nextPhase === "abilityPhase") {
    assertOrThrow(
      args.reason !== "manual",
      "Cannot manually advance from publicVoting. Use confirmVoting or wait for timeout.",
    );
  }

  if (currentPhase === "mafiaVoting" && nextPhase === "resolution") {
    assertOrThrow(
      args.reason !== "manual",
      "Cannot manually advance from mafiaVoting. Use confirmMafiaVoting or wait for timeout.",
    );
  }

  if (
    nextPhase === "abilityPhase" &&
    !counts.hasAliveSheikh &&
    !counts.hasAliveGirl
  ) {
    nextPhase = "mafiaVoting";
  }

  if (nextPhase === "mafiaVoting" && counts.aliveMafia === 0) {
    return finishGame(
      ctx,
      game,
      "citizens",
      "all_mafia_dead_before_mafia_voting",
    );
  }

  if (nextPhase === "resolution" && counts.aliveCitizens === 0) {
    return finishGame(
      ctx,
      game,
      "mafia",
      "all_citizens_dead_before_resolution",
    );
  }

  let nextRound = game.round;
  if (currentPhase === "resolution" && nextPhase === "endCheck") {
    // T13: if there is no winner after resolution, continue directly to next
    // round discussion.
    nextPhase = "discussion";
    nextRound += 1;
  } else if (currentPhase === "endCheck" && nextPhase === "discussion") {
    nextRound += 1;
  }

  const nextPhaseToken = (game.phaseToken ?? 0) + 1;
  const deadlineDurationMs = getDeadlineMs(nextPhase, room);
  const phaseDeadlineAt = deadlineDurationMs
    ? now + deadlineDurationMs
    : undefined;

  await ctx.db.patch(game._id, {
    phase: nextPhase,
    round: nextRound,
    phaseStartedAt: now,
    phaseDeadlineAt,
    phaseToken: nextPhaseToken,
  });

  await appendTransitionEvent(
    ctx,
    game._id,
    nextRound,
    currentPhase,
    nextPhase,
    resolvedReason,
    {
      phaseDeadlineAt,
      phaseToken: nextPhaseToken,
    },
  );

  if (phaseDeadlineAt !== undefined && isTimedPhase(nextPhase)) {
    const delayMs = deadlineDurationMs ?? 0;
    if (nextPhase === "publicVoting") {
      // Route through publicVoting auto-resolve so votes are tallied
      await ctx.scheduler.runAfter(
        delayMs,
        internal.publicVoting.autoResolvePublicVoting,
        {
          gameId: game._id,
          expectedToken: nextPhaseToken,
        },
      );
    } else if (nextPhase === "mafiaVoting") {
      // Route through mafiaVoting auto-resolve so private votes are tallied
      await ctx.scheduler.runAfter(
        delayMs,
        internal.mafiaVoting.autoResolveMafiaVoting,
        {
          gameId: game._id,
          expectedToken: nextPhaseToken,
        },
      );
    } else {
      await ctx.scheduler.runAfter(
        delayMs,
        internal.stateMachine.handlePhaseTimer,
        {
          gameId: game._id,
          expectedPhase: nextPhase,
          expectedToken: nextPhaseToken,
        },
      );
    }
  }

  if (nextPhase === "resolution") {
    await ctx.scheduler.runAfter(0, internal.resolution.resolveRound, {
      gameId: game._id,
      expectedRound: nextRound,
      expectedToken: nextPhaseToken,
    });
  }

  return {
    phase: nextPhase,
    round: nextRound,
    phaseDeadlineAt,
    phaseToken: nextPhaseToken,
  };
}

export const advancePhase = mutation({
  args: {
    gameId: v.id("games"),
    ownerOverride: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actorUserId = await requireAuthUserId(ctx);
    return transitionCore(ctx, {
      gameId: args.gameId,
      actorUserId,
      ownerOverride: args.ownerOverride,
      reason: "manual",
    });
  },
});

export const endGame = mutation({
  args: {
    gameId: v.id("games"),
    winnerFaction: v.union(v.literal("mafia"), v.literal("citizens")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actorUserId = await requireAuthUserId(ctx);
    const game = await getGameOrThrow(ctx, args.gameId);
    const owner = await isRoomOwner(ctx, game, actorUserId);

    assertOrThrow(owner, "Only the room owner can end the game.");

    return finishGame(
      ctx,
      game,
      args.winnerFaction,
      args.reason ?? "manual_end_game",
    );
  },
});

export const advancePhaseInternal = internalMutation({
  args: {
    gameId: v.id("games"),
    reason: v.optional(
      v.union(
        v.literal("timer"),
        v.literal("timer_auto_resolve"),
        v.literal("edge_case_finish"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    return transitionCore(ctx, {
      gameId: args.gameId,
      reason: args.reason ?? "timer",
    });
  },
});

export const checkWinCondition = internalMutation({
  args: {
    gameId: v.id("games"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const game = await getGameOrThrow(ctx, args.gameId);
    if (game.phase === "finished") {
      return { skipped: true, reason: "already_finished" as const };
    }

    const result = await evaluateWinCondition(
      ctx,
      game,
      args.reason ?? "explicit_check",
    );

    if (!result) {
      return { skipped: true, reason: "no_winner" as const };
    }

    return { skipped: false, ...result };
  },
});

export const handlePhaseTimer = internalMutation({
  args: {
    gameId: v.id("games"),
    expectedPhase: v.union(
      v.literal("discussion"),
      v.literal("publicVoting"),
      v.literal("abilityPhase"),
      v.literal("mafiaVoting"),
    ),
    expectedToken: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await getGameOrThrow(ctx, args.gameId);

    if (game.phase === "finished") {
      return { skipped: true, reason: "game_finished" };
    }
    if (game.phase !== args.expectedPhase) {
      return { skipped: true, reason: "phase_changed" };
    }
    if ((game.phaseToken ?? 0) !== args.expectedToken) {
      return { skipped: true, reason: "token_mismatch" };
    }
    if (!game.phaseDeadlineAt || Date.now() < game.phaseDeadlineAt) {
      return { skipped: true, reason: "deadline_not_reached" };
    }

    await transitionCore(ctx, {
      gameId: args.gameId,
      reason: "timer_auto_resolve",
    });

    return { skipped: false, advanced: true };
  },
});

export const getGameState = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const requesterUserId = await requireAuthUserId(ctx);
    const game = await getGameOrThrow(ctx, args.gameId);
    const players = await getPlayersByGame(ctx, args.gameId);
    const me = players.find((player) => player.userId === requesterUserId);

    if (!me) {
      throw new ConvexError("Requester is not a player in this game.");
    }

    const userDocs = await Promise.all(
      players.map((player) => ctx.db.get(player.userId)),
    );
    const userById = new Map(
      userDocs
        .filter((user): user is NonNullable<typeof user> => user !== null)
        .map((user) => [user._id, user]),
    );

    const isRequesterMafia = me.role === "mafia";

    const playerViews = players.map((player) => {
      const user = userById.get(player.userId);
      const roleVisibleToRequester =
        game.phase === "finished" || player._id === me._id;

      return {
        playerId: player._id,
        userId: player.userId,
        username: user?.username ?? "Unknown",
        avatarUrl: user?.image,
        isAlive: player.isAlive,
        isConnected: player.isConnected,
        eliminatedAtRound: player.eliminatedAtRound,
        role: roleVisibleToRequester ? player.role : undefined,
      };
    });

    const mafiaTeammates = isRequesterMafia
      ? players
          .filter((player) => player.role === "mafia" && player._id !== me._id)
          .map((player) => ({
            playerId: player._id,
            userId: player.userId,
            username: userById.get(player.userId)?.username ?? "Unknown",
            isAlive: player.isAlive,
          }))
      : [];

    return {
      game: {
        id: game._id,
        roomId: game.roomId,
        phase: game.phase,
        round: game.round,
        startedAt: game.startedAt,
        endedAt: game.endedAt,
        winnerFaction: game.winnerFaction,
        phaseStartedAt: game.phaseStartedAt,
        phaseDeadlineAt: game.phaseDeadlineAt,
      },
      me: {
        playerId: me._id,
        userId: me.userId,
        role: me.role,
        isAlive: me.isAlive,
        isConnected: me.isConnected,
      },
      players: playerViews,
      mafiaTeammates,
    };
  },
});
