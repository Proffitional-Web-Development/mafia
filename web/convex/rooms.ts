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
import {
  getAutoMafiaCount,
  getMaxAllowedMafia,
  validateMafiaCount,
} from "./lib/gameRules";
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

const MIN_PLAYERS = 4;
const DEFAULT_MAX_PLAYERS = 12;
const ABSOLUTE_MAX_PLAYERS = 20;
const DEFAULT_DISCUSSION_DURATION = 120; // seconds

function hashRoomPassword(password: string) {
  let hash = 5381;
  for (let index = 0; index < password.length; index += 1) {
    hash = (hash * 33) ^ password.charCodeAt(index);
  }
  return `room_${(hash >>> 0).toString(16)}`;
}

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
  args: {
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
    password: v.optional(v.string()),
    memeLevel: v.optional(
      v.union(v.literal("NORMAL"), v.literal("FUN"), v.literal("CHAOS")),
    ),
    settings: v.optional(
      v.object({
        mafiaCount: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
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

    const visibility = args.visibility ?? "private";
    const password = args.password?.trim();
    const preliminaryMafiaCount = args.settings?.mafiaCount;

    if (preliminaryMafiaCount !== undefined) {
      const validation = validateMafiaCount(
        preliminaryMafiaCount,
        DEFAULT_MAX_PLAYERS,
      );
      if (!validation.valid) {
        throw new ConvexError(validation.error ?? "Invalid mafia count.");
      }
    }

    const roomId = await ctx.db.insert("rooms", {
      code,
      ownerId: userId,
      visibility,
      password: password ? hashRoomPassword(password) : undefined,
      memeLevel: args.memeLevel ?? "FUN",
      settings: {
        discussionDuration: DEFAULT_DISCUSSION_DURATION,
        maxPlayers: DEFAULT_MAX_PLAYERS,
        mafiaCount: preliminaryMafiaCount,
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
    code: v.optional(v.string()),
    roomId: v.optional(v.id("rooms")),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    let room = args.roomId ? await ctx.db.get(args.roomId) : null;
    const normalizedCode = args.code?.trim().toUpperCase();

    if (!room && normalizedCode) {
      room = await ctx.db
        .query("rooms")
        .withIndex("by_code", (q) => q.eq("code", normalizedCode))
        .first();
    }

    if (!room) throw new ConvexError("Room not found.");
    if (room.status !== "waiting") {
      throw new ConvexError("Room is not accepting new players.");
    }

    const visibility = room.visibility ?? "private";

    if (visibility === "private" && room.password) {
      const password = args.password?.trim();
      if (!password) {
        throw new ConvexError("Password is required for this private room.");
      }
      if (hashRoomPassword(password) !== room.password) {
        throw new ConvexError("Invalid room password.");
      }
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

export const updateMemeLevel = mutation({
  args: {
    roomId: v.id("rooms"),
    memeLevel: v.union(v.literal("NORMAL"), v.literal("FUN"), v.literal("CHAOS")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const room = await requireRoomOwner(ctx, args.roomId, userId);

    if (room.status !== "waiting") {
      throw new ConvexError("Cannot change meme level after game has started.");
    }

    await ctx.db.patch(args.roomId, {
      memeLevel: args.memeLevel,
      lastActivityAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateRoomSettings = mutation({
  args: {
    roomId: v.id("rooms"),
    settings: v.object({
      discussionDuration: v.optional(v.number()),
      maxPlayers: v.optional(v.number()),
      mafiaCount: v.optional(v.union(v.number(), v.null())),
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
    const requestedMafiaCount =
      args.settings.mafiaCount === null
        ? undefined
        : args.settings.mafiaCount ?? current.mafiaCount;

    const next = {
      discussionDuration:
        args.settings.discussionDuration ?? current.discussionDuration,
      maxPlayers: args.settings.maxPlayers ?? current.maxPlayers,
      mafiaCount: requestedMafiaCount,
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

    let mafiaCountReset = false;

    if (next.mafiaCount !== undefined) {
      const validation = validateMafiaCount(next.mafiaCount, next.maxPlayers);
      if (!validation.valid) {
        if (args.settings.maxPlayers !== undefined && args.settings.mafiaCount === undefined) {
          next.mafiaCount = undefined;
          mafiaCountReset = true;
        } else {
          throw new ConvexError(validation.error ?? "Invalid mafia count.");
        }
      }
    }

    await ctx.db.patch(args.roomId, {
      settings: next,
      lastActivityAt: Date.now(),
    });

    return {
      success: true,
      mafiaCountReset,
      maxAllowedMafia: getMaxAllowedMafia(next.maxPlayers),
    };
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

    let mafiaCountReset = false;
    if (room.settings.mafiaCount !== undefined) {
      const validation = validateMafiaCount(room.settings.mafiaCount, members.length);
      if (!validation.valid) {
        mafiaCountReset = true;
        await ctx.db.patch(args.roomId, {
          settings: {
            ...room.settings,
            mafiaCount: undefined,
          },
          lastActivityAt: Date.now(),
        });
      }
    }

    const now = Date.now();

    // Create game record
    const gameId = await ctx.db.insert("games", {
      roomId: args.roomId,
      phase: "cardDistribution",
      round: 1,
      votingSubRound: 0,
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

    return { gameId, mafiaCountReset };
  },
});

export const getMaxAllowedMafiaInfo = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    await requireAuthUserId(ctx);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new ConvexError("Room not found.");
    }

    const members = await getRoomMembers(ctx, args.roomId);
    const currentPlayerCount = members.length;
    const maxAllowed = getMaxAllowedMafia(currentPlayerCount);
    const autoMafiaCount = getAutoMafiaCount(currentPlayerCount);

    const custom = room.settings.mafiaCount;
    const validation =
      custom !== undefined
        ? validateMafiaCount(custom, currentPlayerCount)
        : { valid: true, maxAllowed };

    return {
      maxAllowed,
      currentPlayerCount,
      autoMafiaCount,
      customMafiaCount: custom,
      customValid: validation.valid,
      customError: validation.error,
    };
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
    return {
      roomId: room._id,
      code: room.code,
      status: room.status,
      visibility: room.visibility ?? "private",
      hasPassword: Boolean(room.password),
    };
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
        username:
          user?.displayName ?? user?.username ?? user?.name ?? "Unknown",
        avatarUrl: user?.image,
        joinedAt: m.joinedAt,
        isOwner: m.userId === room.ownerId,
      };
    });

    return {
      roomId: room._id,
      code: room.code,
      ownerId: room.ownerId,
      memeLevel: room.memeLevel ?? "FUN",
      visibility: room.visibility ?? "private",
      hasPassword: Boolean(room.password),
      status: room.status,
      settings: room.settings,
      currentGameId: room.currentGameId,
      members: memberViews,
      createdAt: room.createdAt,
    };
  },
});

export const updateRoomVisibility = mutation({
  args: {
    roomId: v.id("rooms"),
    visibility: v.union(v.literal("public"), v.literal("private")),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const room = await requireRoomOwner(ctx, args.roomId, userId);

    if (room.status !== "waiting") {
      throw new ConvexError("Cannot change room visibility after game start.");
    }

    const password = args.password?.trim();
    await ctx.db.patch(args.roomId, {
      visibility: args.visibility,
      password: password ? hashRoomPassword(password) : undefined,
      lastActivityAt: Date.now(),
    });

    return { success: true };
  },
});

export const listActiveRooms = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuthUserId(ctx);

    const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);

    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .take(limit);

    const memberSets = await Promise.all(
      rooms.map((room) =>
        ctx.db
          .query("roomMembers")
          .withIndex("by_roomId", (q) => q.eq("roomId", room._id))
          .collect(),
      ),
    );

    const ownerDocs = await Promise.all(rooms.map((room) => ctx.db.get(room.ownerId)));
    const ownerById = new Map(
      ownerDocs
        .filter((owner): owner is NonNullable<typeof owner> => owner !== null)
        .map((owner) => [owner._id, owner]),
    );

    return rooms.map((room, index) => ({
      roomId: room._id,
      code: room.code,
      ownerUserId: room.ownerId,
      ownerUsername:
        ownerById.get(room.ownerId)?.displayName ??
        ownerById.get(room.ownerId)?.username ??
        "Unknown",
      ownerAvatarUrl: ownerById.get(room.ownerId)?.image,
      playerCount: memberSets[index]?.length ?? 0,
      maxPlayers: room.settings.maxPlayers,
      visibility: room.visibility ?? "private",
      hasPassword: Boolean(room.password),
      createdAt: room.createdAt,
      lastActivityAt: room.lastActivityAt,
    }));
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
