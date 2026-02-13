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
// Helpers
// ---------------------------------------------------------------------------

const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1

function generateRoomCode(): string {
  const chars: string[] = [];
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    chars.push(
      ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)],
    );
  }
  return chars.join("");
}

const MIN_PLAYERS = 3;
const DEFAULT_MAX_PLAYERS = 12;
const ABSOLUTE_MAX_PLAYERS = 20;
const DEFAULT_DISCUSSION_DURATION = 120; // seconds

async function getRoomMembers(
  ctx: QueryCtx | MutationCtx,
  roomId: Id<"rooms">,
) {
  return ctx.db
    .query("roomMembers")
    .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
    .collect();
}

async function getMembership(
  ctx: QueryCtx | MutationCtx,
  roomId: Id<"rooms">,
  userId: Id<"users">,
) {
  return ctx.db
    .query("roomMembers")
    .withIndex("by_roomId_userId", (q) =>
      q.eq("roomId", roomId).eq("userId", userId),
    )
    .first();
}

async function requireRoomOwner(
  ctx: MutationCtx,
  roomId: Id<"rooms">,
  userId: Id<"users">,
) {
  const room = await ctx.db.get(roomId);
  if (!room) throw new ConvexError("Room not found.");
  if (room.ownerId !== userId) {
    throw new ConvexError("Only the room owner can perform this action.");
  }
  return room;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const createRoom = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthUserId(ctx);
    const now = Date.now();

    // Generate unique code with retry
    let code = generateRoomCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await ctx.db
        .query("rooms")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
      if (!existing) break;
      code = generateRoomCode();
      attempts++;
    }
    if (attempts >= 10) {
      throw new ConvexError("Failed to generate unique room code.");
    }

    const roomId = await ctx.db.insert("rooms", {
      code,
      ownerId: userId,
      settings: {
        discussionDuration: DEFAULT_DISCUSSION_DURATION,
        maxPlayers: DEFAULT_MAX_PLAYERS,
        enabledRoles: { sheikh: true, girl: true, boy: true },
      },
      status: "waiting",
      createdAt: now,
      lastActivityAt: now,
    });

    // Creator auto-joins
    await ctx.db.insert("roomMembers", {
      roomId,
      userId,
      joinedAt: now,
    });

    return { roomId, code };
  },
});

export const joinRoom = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const code = args.code.trim().toUpperCase();

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (!room) throw new ConvexError("Room not found.");
    if (room.status !== "waiting") {
      throw new ConvexError("Room is not accepting new players.");
    }

    const existing = await getMembership(ctx, room._id, userId);
    if (existing) {
      // Already in room — idempotent
      return { roomId: room._id, code: room.code };
    }

    const members = await getRoomMembers(ctx, room._id);
    if (members.length >= room.settings.maxPlayers) {
      throw new ConvexError("Room is full.");
    }

    await ctx.db.insert("roomMembers", {
      roomId: room._id,
      userId,
      joinedAt: Date.now(),
    });

    await ctx.db.patch(room._id, { lastActivityAt: Date.now() });

    return { roomId: room._id, code: room.code };
  },
});

export const updateRoomSettings = mutation({
  args: {
    roomId: v.id("rooms"),
    settings: v.object({
      discussionDuration: v.optional(v.number()),
      maxPlayers: v.optional(v.number()),
      enabledRoles: v.optional(
        v.object({
          sheikh: v.boolean(),
          girl: v.boolean(),
          boy: v.boolean(),
        }),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const room = await requireRoomOwner(ctx, args.roomId, userId);

    if (room.status !== "waiting") {
      throw new ConvexError("Cannot change settings after game has started.");
    }

    const current = room.settings;
    const next = {
      discussionDuration:
        args.settings.discussionDuration ?? current.discussionDuration,
      maxPlayers: args.settings.maxPlayers ?? current.maxPlayers,
      enabledRoles: args.settings.enabledRoles ?? current.enabledRoles,
    };

    // Validate
    if (next.discussionDuration < 10 || next.discussionDuration > 600) {
      throw new ConvexError(
        "Discussion duration must be between 10 and 600 seconds.",
      );
    }
    if (
      next.maxPlayers < MIN_PLAYERS ||
      next.maxPlayers > ABSOLUTE_MAX_PLAYERS
    ) {
      throw new ConvexError(
        `Max players must be between ${MIN_PLAYERS} and ${ABSOLUTE_MAX_PLAYERS}.`,
      );
    }

    await ctx.db.patch(args.roomId, {
      settings: next,
      lastActivityAt: Date.now(),
    });

    return { success: true };
  },
});

export const kickPlayer = mutation({
  args: {
    roomId: v.id("rooms"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const room = await requireRoomOwner(ctx, args.roomId, userId);

    if (room.status !== "waiting") {
      throw new ConvexError("Cannot kick players after game has started.");
    }
    if (args.targetUserId === userId) {
      throw new ConvexError("Cannot kick yourself. Use leaveRoom instead.");
    }

    const membership = await getMembership(ctx, args.roomId, args.targetUserId);
    if (!membership) {
      throw new ConvexError("Player is not in the room.");
    }

    await ctx.db.delete(membership._id);
    await ctx.db.patch(args.roomId, { lastActivityAt: Date.now() });

    return { success: true };
  },
});

export const leaveRoom = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new ConvexError("Room not found.");
    if (room.status !== "waiting") {
      throw new ConvexError("Cannot leave room after game has started.");
    }

    const membership = await getMembership(ctx, args.roomId, userId);
    if (!membership) {
      throw new ConvexError("You are not in this room.");
    }

    await ctx.db.delete(membership._id);

    // If owner leaves, transfer ownership
    if (room.ownerId === userId) {
      const remainingMembers = await getRoomMembers(ctx, args.roomId);
      if (remainingMembers.length === 0) {
        // Last person left — mark room finished
        await ctx.db.patch(args.roomId, {
          status: "finished",
          lastActivityAt: Date.now(),
        });
      } else {
        // Transfer to earliest joiner
        const sorted = remainingMembers.sort((a, b) => a.joinedAt - b.joinedAt);
        await ctx.db.patch(args.roomId, {
          ownerId: sorted[0].userId,
          lastActivityAt: Date.now(),
        });
      }
    } else {
      await ctx.db.patch(args.roomId, { lastActivityAt: Date.now() });
    }

    return { success: true };
  },
});

export const startGame = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const room = await requireRoomOwner(ctx, args.roomId, userId);

    if (room.status !== "waiting") {
      throw new ConvexError("Game has already been started.");
    }

    const members = await getRoomMembers(ctx, args.roomId);
    if (members.length < MIN_PLAYERS) {
      throw new ConvexError(
        `At least ${MIN_PLAYERS} players are required to start.`,
      );
    }

    const now = Date.now();

    // Create game record
    const gameId = await ctx.db.insert("games", {
      roomId: args.roomId,
      phase: "cardDistribution",
      round: 1,
      startedAt: now,
      phaseStartedAt: now,
    });

    // Update room
    await ctx.db.patch(args.roomId, {
      status: "in-game",
      currentGameId: gameId,
      lastActivityAt: now,
    });

    // Create player records (role = "citizen" placeholder — distributeCards sets real roles)
    for (const member of members) {
      await ctx.db.insert("players", {
        gameId,
        userId: member.userId,
        role: "citizen", // placeholder
        isAlive: true,
        isConnected: true,
        joinedAt: member.joinedAt,
      });
    }

    // Trigger card distribution
    await ctx.scheduler.runAfter(0, internal.cardDistribution.distributeCards, {
      gameId,
    });

    return { gameId };
  },
});

export const playAgain = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const room = await requireRoomOwner(ctx, args.roomId, userId);

    if (!room.currentGameId) {
      throw new ConvexError("No game has been started in this room.");
    }

    const game = await ctx.db.get(room.currentGameId);
    if (!game) {
      throw new ConvexError("Current game not found.");
    }
    if (game.phase !== "finished") {
      throw new ConvexError("Current game is not finished yet.");
    }

    await ctx.db.patch(args.roomId, {
      status: "waiting",
      currentGameId: undefined,
      lastActivityAt: Date.now(),
    });

    return { success: true };
  },
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const getRoomByCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code.trim().toUpperCase()))
      .first();
    if (!room) return null;
    return { roomId: room._id, code: room.code, status: room.status };
  },
});

export const getRoomState = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new ConvexError("Room not found.");

    const members = await getRoomMembers(ctx, args.roomId);
    const userDocs = await Promise.all(
      members.map((m) => ctx.db.get(m.userId)),
    );
    const userById = new Map(
      userDocs
        .filter((u): u is NonNullable<typeof u> => u !== null)
        .map((u) => [u._id, u]),
    );

    const memberViews = members.map((m) => {
      const user = userById.get(m.userId);
      return {
        userId: m.userId,
        username: user?.username ?? user?.name ?? "Unknown",
        avatarUrl: user?.image,
        joinedAt: m.joinedAt,
        isOwner: m.userId === room.ownerId,
      };
    });

    return {
      roomId: room._id,
      code: room.code,
      ownerId: room.ownerId,
      status: room.status,
      settings: room.settings,
      currentGameId: room.currentGameId,
      members: memberViews,
      createdAt: room.createdAt,
    };
  },
});

// ---------------------------------------------------------------------------
// Cron helper — called by crons.ts
// ---------------------------------------------------------------------------

export const cleanupStaleRooms = internalMutation({
  args: {},
  handler: async (ctx) => {
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;

    const staleRooms = await ctx.db
      .query("rooms")
      .withIndex("by_lastActivityAt")
      .filter((q) =>
        q.and(
          q.lt(q.field("lastActivityAt"), thirtyMinutesAgo),
          q.eq(q.field("status"), "waiting"),
        ),
      )
      .take(50);

    for (const room of staleRooms) {
      // Delete members
      const members = await ctx.db
        .query("roomMembers")
        .withIndex("by_roomId", (q) => q.eq("roomId", room._id))
        .collect();
      for (const m of members) {
        await ctx.db.delete(m._id);
      }
      // Mark finished
      await ctx.db.patch(room._id, { status: "finished" });
    }

    return { cleaned: staleRooms.length };
  },
});
