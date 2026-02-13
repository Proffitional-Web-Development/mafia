import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";

// ---------------------------------------------------------------------------
// T09 — Public Voting Phase Backend
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAlivePlayer(
  ctx: MutationCtx,
  gameId: Id<"games">,
  userId: Id<"users">,
) {
  const player = await ctx.db
    .query("players")
    .withIndex("by_gameId_userId", (q) =>
      q.eq("gameId", gameId).eq("userId", userId),
    )
    .first();

  if (!player) throw new ConvexError("You are not a player in this game.");
  if (!player.isAlive) throw new ConvexError("Dead players cannot vote.");
  return player;
}

async function requirePublicVotingPhase(
  ctx: MutationCtx | QueryCtx,
  gameId: Id<"games">,
) {
  const game = await ctx.db.get(gameId);
  if (!game) throw new ConvexError("Game not found.");
  if (game.phase !== "publicVoting") {
    throw new ConvexError("Game is not in the public voting phase.");
  }
  return game;
}

// ---------------------------------------------------------------------------
// castPublicVote — vote for a target OR skip
// ---------------------------------------------------------------------------

export const castPublicVote = mutation({
  args: {
    gameId: v.id("games"),
    targetPlayerId: v.optional(v.id("players")),
    isSkip: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const game = await requirePublicVotingPhase(ctx, args.gameId);
    const voter = await requireAlivePlayer(ctx, args.gameId, userId);

    const isSkip = Boolean(args.isSkip) || !args.targetPlayerId;

    // Validate target if not skipping
    if (!isSkip && args.targetPlayerId) {
      const target = await ctx.db.get(args.targetPlayerId);
      if (!target) throw new ConvexError("Target player not found.");
      if (target.gameId !== args.gameId) {
        throw new ConvexError("Target is not in this game.");
      }
      if (!target.isAlive) {
        throw new ConvexError("Cannot vote for a dead player.");
      }
      if (target._id === voter._id) {
        throw new ConvexError("Cannot vote for yourself.");
      }
    }

    // Check for existing vote — allow change
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_gameId_round_phase_voterId", (q) =>
        q
          .eq("gameId", args.gameId)
          .eq("round", game.round)
          .eq("phase", "public")
          .eq("voterId", voter._id),
      )
      .first();

    const now = Date.now();

    if (existingVote) {
      // Update existing vote
      await ctx.db.patch(existingVote._id, {
        targetId: isSkip ? undefined : args.targetPlayerId,
        isSkip,
        timestamp: now,
      });
    } else {
      // Insert new vote
      await ctx.db.insert("votes", {
        gameId: args.gameId,
        round: game.round,
        phase: "public",
        voterId: voter._id,
        targetId: isSkip ? undefined : args.targetPlayerId,
        isSkip,
        timestamp: now,
      });
    }

    return { success: true };
  },
});

// ---------------------------------------------------------------------------
// getPublicVotes — real-time tally visible to all players
// ---------------------------------------------------------------------------

export const getPublicVotes = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found.");

    // Verify requester is in the game
    const me = await ctx.db
      .query("players")
      .withIndex("by_gameId_userId", (q) =>
        q.eq("gameId", args.gameId).eq("userId", userId),
      )
      .first();
    if (!me) throw new ConvexError("You are not a player in this game.");

    // Get all votes for current round public phase
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_gameId_round_phase", (q) =>
        q
          .eq("gameId", args.gameId)
          .eq("round", game.round)
          .eq("phase", "public"),
      )
      .collect();

    // Get all alive players to compute who hasn't voted yet
    const alivePlayers = await ctx.db
      .query("players")
      .withIndex("by_gameId_isAlive", (q) =>
        q.eq("gameId", args.gameId).eq("isAlive", true),
      )
      .collect();

    // Build tally
    const tally: Record<string, number> = {};
    let skipCount = 0;

    for (const vote of votes) {
      if (vote.isSkip) {
        skipCount++;
      } else if (vote.targetId) {
        tally[vote.targetId] = (tally[vote.targetId] ?? 0) + 1;
      }
    }

    const totalAlive = alivePlayers.length;
    const totalVoted = votes.length;

    return {
      round: game.round,
      votes: votes.map((vote) => ({
        voterId: vote.voterId,
        targetId: vote.targetId,
        isSkip: vote.isSkip,
      })),
      tally,
      skipCount,
      totalAlive,
      totalVoted,
      allVoted: totalVoted >= totalAlive,
    };
  },
});

// ---------------------------------------------------------------------------
// confirmVoting — owner locks votes and resolves elimination (or no-op on tie)
// ---------------------------------------------------------------------------

export const confirmVoting = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const game = await requirePublicVotingPhase(ctx, args.gameId);

    const room = await ctx.db.get(game.roomId);
    if (!room) throw new ConvexError("Room not found.");
    if (room.ownerId !== userId) {
      throw new ConvexError("Only the room owner can confirm voting.");
    }

    const result = await resolvePublicVoting(ctx, args.gameId);

    // Advance to the next phase
    await ctx.scheduler.runAfter(
      0,
      internal.stateMachine.advancePhaseInternal,
      { gameId: args.gameId, reason: "timer_auto_resolve" },
    );

    return result;
  },
});

// ---------------------------------------------------------------------------
// resolvePublicVoting — shared logic for manual confirm and auto-timeout
// ---------------------------------------------------------------------------

async function resolvePublicVoting(ctx: MutationCtx, gameId: Id<"games">) {
  const game = await ctx.db.get(gameId);
  if (!game) throw new ConvexError("Game not found.");
  if (game.phase !== "publicVoting") {
    throw new ConvexError("Game is not in public voting phase.");
  }

  const votes = await ctx.db
    .query("votes")
    .withIndex("by_gameId_round_phase", (q) =>
      q.eq("gameId", gameId).eq("round", game.round).eq("phase", "public"),
    )
    .collect();

  // Build tally
  const tally: Record<string, number> = {};
  let skipCount = 0;

  for (const vote of votes) {
    if (vote.isSkip) {
      skipCount++;
    } else if (vote.targetId) {
      tally[vote.targetId] = (tally[vote.targetId] ?? 0) + 1;
    }
  }

  // Find max
  const entries = Object.entries(tally);
  let eliminatedPlayerId: string | null = null;
  let noElimination = false;

  if (entries.length === 0) {
    // No one voted for anyone — skip elimination
    noElimination = true;
  } else {
    const maxVotes = Math.max(...entries.map(([, count]) => count));
    const topCandidates = entries.filter(([, count]) => count === maxVotes);

    if (topCandidates.length > 1) {
      // Tie — no elimination
      noElimination = true;
    } else {
      // Tie-break: skipCount wins over the top candidate
      if (skipCount >= maxVotes) {
        noElimination = true;
      } else {
        eliminatedPlayerId = topCandidates[0][0];
      }
    }
  }

  const now = Date.now();

  if (eliminatedPlayerId) {
    // Eliminate the player
    await ctx.db.patch(eliminatedPlayerId as Id<"players">, {
      isAlive: false,
      eliminatedAtRound: game.round,
    });

    await ctx.db.insert("gameEvents", {
      gameId,
      round: game.round,
      type: "public_elimination",
      payload: JSON.stringify({
        eliminatedPlayerId,
        voteCount: tally[eliminatedPlayerId],
        totalVotes: votes.length,
      }),
      timestamp: now,
    });
  } else {
    await ctx.db.insert("gameEvents", {
      gameId,
      round: game.round,
      type: "no_elimination",
      payload: JSON.stringify({
        reason: noElimination ? "tie_or_skip" : "no_votes",
        tally,
        skipCount,
      }),
      timestamp: now,
    });
  }

  // NOTE: This helper does NOT advance the phase. Callers must do that.

  return {
    eliminated: eliminatedPlayerId ?? null,
    noElimination,
    tally,
    skipCount,
  };
}

// ---------------------------------------------------------------------------
// autoResolvePublicVoting — called by state machine timer when deadline hits
// ---------------------------------------------------------------------------

export const autoResolvePublicVoting = internalMutation({
  args: {
    gameId: v.id("games"),
    expectedToken: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return { skipped: true, reason: "game_not_found" };
    if (game.phase !== "publicVoting") {
      return { skipped: true, reason: "phase_changed" };
    }
    // Guard against stale timer fires
    if (
      args.expectedToken !== undefined &&
      (game.phaseToken ?? 0) !== args.expectedToken
    ) {
      return { skipped: true, reason: "token_mismatch" };
    }

    const result = await resolvePublicVoting(ctx, args.gameId);

    // Advance to the next phase
    await ctx.scheduler.runAfter(
      0,
      internal.stateMachine.advancePhaseInternal,
      { gameId: args.gameId, reason: "timer_auto_resolve" },
    );

    return result;
  },
});
