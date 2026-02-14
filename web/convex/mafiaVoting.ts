import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  type MutationCtx,
  mutation,
  query,
} from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";
import { logGameEvent } from "./gameEvents";

async function getMafiaVoterOrThrow(
  ctx: MutationCtx,
  gameId: Id<"games">,
  userId: Id<"users">
) {
  const game = await ctx.db.get(gameId);
  if (!game) throw new ConvexError("Game not found.");
  if (game.phase !== "mafiaVoting") {
    throw new ConvexError("Game is not in mafia voting phase.");
  }

  const voter = await ctx.db
    .query("players")
    .withIndex("by_gameId_userId", (q) =>
      q.eq("gameId", gameId).eq("userId", userId)
    )
    .first();

  if (!voter) throw new ConvexError("You are not a player in this game.");
  if (!voter.isAlive || voter.role !== "mafia") {
    throw new ConvexError("Only alive mafia members can vote.");
  }

  return { game, voter };
}

async function resolveMafiaVoting(
  ctx: MutationCtx,
  gameId: Id<"games">,
  expectedToken?: number
) {
  const game = await ctx.db.get(gameId);
  if (!game) throw new ConvexError("Game not found.");
  if (game.phase !== "mafiaVoting") {
    throw new ConvexError("Game is not in mafia voting phase.");
  }
  if (expectedToken !== undefined && (game.phaseToken ?? 0) !== expectedToken) {
    return { skipped: true, reason: "token_mismatch" as const };
  }

  // Check for existing events to prevent re-execution of RNG
  const events = await ctx.db
    .query("gameEvents")
    .withIndex("by_gameId_round", (q) =>
      q.eq("gameId", gameId).eq("round", game.round)
    )
    .collect();

  // If we already have a Mafia event for this round, return the stored result (or nullish if we can't fully reconstruct)
  // We prioritize correctness of RNG over perfect reconstruction of the legacy return object
  const existingEvent = events.find(
    (e) =>
      e.eventType === "MAFIA_ELIMINATION" ||
      e.eventType === "MAFIA_FAILED_ELIMINATION"
  );

  if (existingEvent) {
    // We already resolved this round.
    // Reconstruct minimal result from messageParams if possible, or just return skipped.
    return {
      skipped: true,
      reason: "already_resolved" as const,
      result: {
        eliminatedPlayerId: null,
        noElimination: existingEvent.eventType !== "MAFIA_ELIMINATION",
        protectionBlocked:
          existingEvent.eventType === "MAFIA_FAILED_ELIMINATION",
        intendedEliminatedPlayerId: null,
        wasRandomTieBreak: false,
        tiedPlayerIds: [],
        tally: {},
      },
    };
  }

  const votes = await ctx.db
    .query("votes")
    .withIndex("by_gameId_round_phase", (q) =>
      q.eq("gameId", gameId).eq("round", game.round).eq("phase", "mafia")
    )
    .collect();

  const tally: Record<string, number> = {};
  for (const vote of votes) {
    if (!vote.targetId) continue;
    tally[vote.targetId] = (tally[vote.targetId] ?? 0) + 1;
  }

  const entries = Object.entries(tally);
  let eliminatedPlayerId: string | null = null;
  let noElimination = false;
  let wasRandomTieBreak = false;
  let tiedPlayerIds: string[] = [];

  if (entries.length === 0) {
    noElimination = true;
  } else {
    const maxVotes = Math.max(...entries.map(([, count]) => count));
    const top = entries.filter(([, count]) => count === maxVotes);

    if (top.length > 1) {
      wasRandomTieBreak = true;
      tiedPlayerIds = top.map(([playerId]) => playerId);
      const randomIndex = Math.floor(Math.random() * top.length);
      eliminatedPlayerId = top[randomIndex][0];
    } else {
      eliminatedPlayerId = top[0][0];
    }
  }

  let protectionBlocked = false;
  const intendedEliminatedPlayerId = eliminatedPlayerId;

  // Resolve User Name
  let targetName = "Unknown";
  if (intendedEliminatedPlayerId) {
    const p = await ctx.db.get(intendedEliminatedPlayerId as Id<"players">);
    if (p) {
      const u = await ctx.db.get(p.userId);
      targetName = u?.displayName ?? u?.username ?? "Unknown";
    }
  }

  // Handle Logic
  if (eliminatedPlayerId) {
    if (wasRandomTieBreak) {
      await logGameEvent(ctx, {
        gameId,
        eventType: "MAFIA_VOTE_TIE_RANDOM",
        params: {
          player: targetName,
        },
      });
    }

    const girlAction = await ctx.db
      .query("actions")
      .withIndex("by_gameId_round_role", (q) =>
        q.eq("gameId", gameId).eq("round", game.round).eq("role", "girl")
      )
      .first();

    if (girlAction?.targetId === eliminatedPlayerId) {
      protectionBlocked = true;
      eliminatedPlayerId = null;
      noElimination = true;

      // Log Failed Elimination
      await logGameEvent(ctx, {
        gameId,
        eventType: "MAFIA_FAILED_ELIMINATION",
        params: {},
      });
    } else {
      await ctx.db.patch(intendedEliminatedPlayerId as Id<"players">, {
        isAlive: false,
        eliminatedAtRound: game.round,
      });

      await logGameEvent(ctx, {
        gameId,
        eventType: "MAFIA_ELIMINATION",
        params: {
          player: targetName,
        },
      });
    }
  } else {
    // No elimination (no votes) - No log
  }

  return {
    skipped: false,
    result: {
      eliminatedPlayerId,
      noElimination,
      protectionBlocked,
      intendedEliminatedPlayerId,
      wasRandomTieBreak,
      tiedPlayerIds,
      tally,
    },
  };
}

export const castMafiaVote = mutation({
  args: {
    gameId: v.id("games"),
    targetPlayerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const { game, voter } = await getMafiaVoterOrThrow(
      ctx,
      args.gameId,
      userId
    );

    const target = await ctx.db.get(args.targetPlayerId);
    if (!target || target.gameId !== args.gameId) {
      throw new ConvexError("Target player not found in this game.");
    }
    if (!target.isAlive) {
      throw new ConvexError("Target must be alive.");
    }
    if (target.role === "mafia") {
      throw new ConvexError("Mafia cannot target mafia.");
    }

    const existing = await ctx.db
      .query("votes")
      .withIndex("by_gameId_round_phase_voterId", (q) =>
        q
          .eq("gameId", args.gameId)
          .eq("round", game.round)
          .eq("phase", "mafia")
          .eq("voterId", voter._id)
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        targetId: target._id,
        isSkip: false,
        timestamp: now,
      });
    } else {
      await ctx.db.insert("votes", {
        gameId: args.gameId,
        round: game.round,
        phase: "mafia",
        voterId: voter._id,
        targetId: target._id,
        isSkip: false,
        timestamp: now,
      });
    }

    return { success: true };
  },
});

export const getMafiaVotes = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found.");

    const me = await ctx.db
      .query("players")
      .withIndex("by_gameId_userId", (q) =>
        q.eq("gameId", args.gameId).eq("userId", userId)
      )
      .first();
    if (!me) throw new ConvexError("You are not a player in this game.");
    if (me.role !== "mafia" || !me.isAlive) {
      throw new ConvexError("Only alive mafia members can view mafia votes.");
    }

    const allPlayers = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();
    const userDocs = await Promise.all(
      allPlayers.map((p) => ctx.db.get(p.userId))
    );
    const userById = new Map(
      userDocs
        .filter((u): u is NonNullable<typeof u> => u !== null)
        .map((u) => [u._id, u])
    );

    const aliveTargets = allPlayers
      .filter((p) => p.isAlive && p.role !== "mafia")
      .map((p) => ({
        playerId: p._id,
        userId: p.userId,
        username: userById.get(p.userId)?.username ?? "Unknown",
        avatarUrl: userById.get(p.userId)?.image,
      }));

    const votes = await ctx.db
      .query("votes")
      .withIndex("by_gameId_round_phase", (q) =>
        q.eq("gameId", args.gameId).eq("round", game.round).eq("phase", "mafia")
      )
      .collect();

    const tally: Record<string, number> = {};
    for (const vote of votes) {
      if (!vote.targetId) continue;
      tally[vote.targetId] = (tally[vote.targetId] ?? 0) + 1;
    }

    return {
      round: game.round,
      phase: game.phase,
      phaseDeadlineAt: game.phaseDeadlineAt,
      votes: votes.map((vote) => ({
        voterId: vote.voterId,
        targetId: vote.targetId,
      })),
      tally,
      aliveTargets,
    };
  },
});

export const confirmMafiaVoting = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await getMafiaVoterOrThrow(ctx, args.gameId, userId);

    const resolved = await resolveMafiaVoting(ctx, args.gameId);

    await ctx.scheduler.runAfter(
      0,
      internal.stateMachine.advancePhaseInternal,
      {
        gameId: args.gameId,
        reason: "timer_auto_resolve",
      }
    );

    return resolved;
  },
});

export const autoResolveMafiaVoting = internalMutation({
  args: {
    gameId: v.id("games"),
    expectedToken: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return { skipped: true, reason: "game_not_found" as const };
    if (game.phase !== "mafiaVoting") {
      return { skipped: true, reason: "phase_changed" as const };
    }

    const resolved = await resolveMafiaVoting(
      ctx,
      args.gameId,
      args.expectedToken
    );
    if (resolved.skipped && resolved.reason === "token_mismatch") {
      return resolved;
    }

    await ctx.scheduler.runAfter(
      0,
      internal.stateMachine.advancePhaseInternal,
      {
        gameId: args.gameId,
        reason: "timer_auto_resolve",
      }
    );

    return resolved;
  },
});
