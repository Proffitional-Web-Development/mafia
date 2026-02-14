import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";

// ---------------------------------------------------------------------------
// T08 — Discussion Phase Backend
//
// The state machine (stateMachine.ts) already handles:
//   - Starting the discussion timer via scheduled function
//   - Auto-advancing to publicVoting when timer expires
//   - Owner override via advancePhase({ ownerOverride: true })
//
// This file adds a purpose-built `skipDiscussion` mutation so the
// frontend has a clear, intention-named action for the owner button,
// and a query exposing discussion timer state.
// ---------------------------------------------------------------------------

export const skipDiscussion = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found.");

    if (game.phase !== "discussion") {
      throw new ConvexError("Game is not in the discussion phase.");
    }

    const room = await ctx.db.get(game.roomId);
    if (!room) throw new ConvexError("Room not found.");
    if (room.ownerId !== userId) {
      throw new ConvexError("Only the room owner can skip the discussion.");
    }

    const now = Date.now();

    // Set deadline to now so the scheduled timer check will fire immediately
    await ctx.db.patch(game._id, {
      phaseDeadlineAt: now,
    });

    // Log the skip event
    await ctx.db.insert("gameEvents", {
      gameId: args.gameId,
      round: game.round,
      type: "discussion_skipped",
      payload: JSON.stringify({ skippedBy: userId }),
      timestamp: now,
    });

    // Schedule immediate advance via internal mutation
    await ctx.scheduler.runAfter(
      0,
      internal.stateMachine.advancePhaseInternal,
      {
        gameId: args.gameId,
        reason: "timer",
      }
    );

    return { success: true };
  },
});

// ---------------------------------------------------------------------------
// Query: discussion phase state (timer info for all players)
// ---------------------------------------------------------------------------

export const getDiscussionState = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found.");

    const room = await ctx.db.get(game.roomId);
    if (!room) throw new ConvexError("Room not found.");

    const player = await ctx.db
      .query("players")
      .withIndex("by_gameId_userId", (q) =>
        q.eq("gameId", args.gameId).eq("userId", userId)
      )
      .first();

    if (!player) {
      throw new ConvexError("You are not a player in this game.");
    }

    const alivePlayers = await ctx.db
      .query("players")
      .withIndex("by_gameId_isAlive", (q) =>
        q.eq("gameId", args.gameId).eq("isAlive", true)
      )
      .collect();

    const userDocs = await Promise.all(
      alivePlayers.map((p) => ctx.db.get(p.userId))
    );

    return {
      phase: game.phase,
      round: game.round,
      phaseStartedAt: game.phaseStartedAt,
      phaseDeadlineAt: game.phaseDeadlineAt,
      isOwner: room.ownerId === userId,
      isAlive: player.isAlive,
      alivePlayers: alivePlayers.map((p, i) => ({
        playerId: p._id,
        userId: p.userId,
        username: userDocs[i]?.username ?? userDocs[i]?.name ?? "Unknown",
        avatarUrl: userDocs[i]?.image,
        isAlive: p.isAlive,
      })),
    };
  },
});
