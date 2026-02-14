import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { logger } from "./lib/logger";

const BATCH_SIZE = 100;
const EXPIRED_ROOM_MS = 3 * 60 * 60 * 1000;
const EXPIRED_ROOM_BATCH = 50;

async function cleanupGameDataBatch(ctx: MutationCtx, gameId: Id<"games">) {
  const players = await ctx.db
    .query("players")
    .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
    .take(BATCH_SIZE);
  for (const doc of players) {
    await ctx.db.delete(doc._id);
  }

  const votes = await ctx.db
    .query("votes")
    .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
    .take(BATCH_SIZE);
  for (const doc of votes) {
    await ctx.db.delete(doc._id);
  }

  const actions = await ctx.db
    .query("actions")
    .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
    .take(BATCH_SIZE);
  for (const doc of actions) {
    await ctx.db.delete(doc._id);
  }

  const events = await ctx.db
    .query("gameEvents")
    .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
    .take(BATCH_SIZE);
  for (const doc of events) {
    await ctx.db.delete(doc._id);
  }

  const chatMessages = await ctx.db
    .query("chatMessages")
    .withIndex("by_gameId_timestamp", (q) => q.eq("gameId", gameId))
    .take(BATCH_SIZE);
  for (const doc of chatMessages) {
    await ctx.db.delete(doc._id);
  }

  const hasMore =
    players.length === BATCH_SIZE ||
    votes.length === BATCH_SIZE ||
    actions.length === BATCH_SIZE ||
    events.length === BATCH_SIZE ||
    chatMessages.length === BATCH_SIZE;

  return {
    players: players.length,
    votes: votes.length,
    actions: actions.length,
    events: events.length,
    chatMessages: chatMessages.length,
    hasMore,
  };
}

async function cleanupRoomMembersBatch(ctx: MutationCtx, roomId: Id<"rooms">) {
  const members = await ctx.db
    .query("roomMembers")
    .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
    .take(BATCH_SIZE);
  for (const doc of members) {
    await ctx.db.delete(doc._id);
  }
  return {
    deleted: members.length,
    hasMore: members.length === BATCH_SIZE,
  };
}

export const cleanupFinishedGame = internalMutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      logger.warn("cleanup.game.notFound", { gameId: args.gameId });
      return { cleaned: false, reason: "GAME_NOT_FOUND" as const };
    }

    if (game.phase !== "finished") {
      logger.warn("cleanup.game.notFinished", {
        gameId: args.gameId,
        phase: game.phase,
      });
      return { cleaned: false, reason: "GAME_NOT_FINISHED" as const };
    }

    const deleted = await cleanupGameDataBatch(ctx, game._id);

    if (deleted.hasMore) {
      await ctx.scheduler.runAfter(0, internal.cleanup.cleanupFinishedGame, {
        gameId: game._id,
      });
      logger.info("cleanup.game.batch", {
        gameId: String(game._id),
        players: deleted.players,
        votes: deleted.votes,
        actions: deleted.actions,
        events: deleted.events,
        chat: deleted.chatMessages,
      });
      return {
        cleaned: false,
        scheduledContinuation: true,
        deleted,
      };
    }

    await ctx.db.delete(game._id);

    const room = await ctx.db.get(game.roomId);
    if (room) {
      if (room.currentGameId === game._id) {
        await ctx.db.patch(room._id, { currentGameId: undefined });
      }

      if (room.status === "finished") {
        await ctx.scheduler.runAfter(
          0,
          internal.cleanup.deleteRoomAndRelatedData,
          {
            roomId: room._id,
          },
        );
      }
    }

    console.log(
      `Cleaned up game ${String(game._id)} — deleted ${deleted.players} players, ${deleted.votes} votes, ${deleted.actions} actions, ${deleted.events} events, ${deleted.chatMessages} chat messages`,
    );
    logger.info("cleanup.game.done", {
      gameId: String(game._id),
      players: deleted.players,
      votes: deleted.votes,
      actions: deleted.actions,
      events: deleted.events,
      chat: deleted.chatMessages,
    });

    return {
      cleaned: true,
      deleted,
    };
  },
});

export const deleteRoomAndRelatedData = internalMutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return { cleaned: false, reason: "ROOM_NOT_FOUND" as const };
    }

    let gameDeleted = {
      players: 0,
      votes: 0,
      actions: 0,
      events: 0,
      chatMessages: 0,
      hasMore: false,
    };

    if (room.currentGameId) {
      const game = await ctx.db.get(room.currentGameId);
      if (game) {
        if (game.phase !== "finished") {
          await ctx.db.patch(game._id, {
            phase: "finished",
            endedAt: game.endedAt ?? Date.now(),
          });
        }

        gameDeleted = await cleanupGameDataBatch(ctx, game._id);

        if (gameDeleted.hasMore) {
          await ctx.scheduler.runAfter(
            0,
            internal.cleanup.deleteRoomAndRelatedData,
            {
              roomId: room._id,
            },
          );
          console.log(
            `deleteRoomAndRelatedData (batched game cleanup) room=${String(room._id)} game=${String(game._id)}`,
          );
          return {
            cleaned: false,
            scheduledContinuation: true,
            gameDeleted,
          };
        }

        await ctx.db.delete(game._id);
      }
    }

    const membersDeleted = await cleanupRoomMembersBatch(ctx, room._id);
    if (membersDeleted.hasMore) {
      await ctx.scheduler.runAfter(
        0,
        internal.cleanup.deleteRoomAndRelatedData,
        {
          roomId: room._id,
        },
      );
      console.log(
        `deleteRoomAndRelatedData (batched members) room=${String(room._id)} deletedMembers=${membersDeleted.deleted}`,
      );
      return {
        cleaned: false,
        scheduledContinuation: true,
        gameDeleted,
        membersDeleted: membersDeleted.deleted,
      };
    }

    await ctx.db.delete(room._id);

    console.log(
      `Cleaned up room ${String(room._id)} — deleted ${membersDeleted.deleted} members`,
    );

    return {
      cleaned: true,
      gameDeleted,
      membersDeleted: membersDeleted.deleted,
    };
  },
});

export const cleanupExpiredRooms = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - EXPIRED_ROOM_MS;

    const expiredRooms = await ctx.db
      .query("rooms")
      .withIndex("by_createdAt", (q) => q.lt("createdAt", cutoff))
      .take(EXPIRED_ROOM_BATCH);

    if (expiredRooms.length === 0) {
      return { cleaned: 0, scheduledContinuation: false };
    }

    for (const room of expiredRooms) {
      if (room.currentGameId) {
        const game = await ctx.db.get(room.currentGameId);
        if (game && game.phase !== "finished") {
          await ctx.db.patch(game._id, {
            phase: "finished",
            endedAt: game.endedAt ?? Date.now(),
          });
        }
      }

      await ctx.scheduler.runAfter(
        0,
        internal.cleanup.deleteRoomAndRelatedData,
        {
          roomId: room._id,
        },
      );

      const hoursAgo = (
        (Date.now() - room.createdAt) /
        (60 * 60 * 1000)
      ).toFixed(2);
      logger.info("cleanup.room.expired", {
        roomId: String(room._id),
        hoursAgo: Number(hoursAgo),
        hadGame: !!room.currentGameId,
      });
    }

    const scheduledContinuation = expiredRooms.length === EXPIRED_ROOM_BATCH;
    if (scheduledContinuation) {
      await ctx.scheduler.runAfter(0, internal.cleanup.cleanupExpiredRooms, {});
    }

    return {
      cleaned: expiredRooms.length,
      scheduledContinuation,
    };
  },
});

/**
 * Purge rate-limit records whose window has expired (older than 5 minutes).
 * Runs via cron to keep the rateLimits table small.
 */
const RATE_LIMIT_TTL_MS = 5 * 60 * 1000;

export const cleanupExpiredRateLimits = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - RATE_LIMIT_TTL_MS;

    const expired = await ctx.db
      .query("rateLimits")
      .filter((q) => q.lt(q.field("windowStart"), cutoff))
      .take(BATCH_SIZE);

    for (const entry of expired) {
      await ctx.db.delete(entry._id);
    }

    if (expired.length === BATCH_SIZE) {
      await ctx.scheduler.runAfter(
        0,
        internal.cleanup.cleanupExpiredRateLimits,
        {},
      );
    }

    logger.info("cleanup.rateLimits", {
      deleted: expired.length,
      hasMore: expired.length === BATCH_SIZE,
    });

    return { deleted: expired.length };
  },
});
