import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { internalMutation, type QueryCtx, query } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";
import { getAutoMafiaCount, validateMafiaCount } from "./lib/gameRules";
import type { PlayerRole } from "./schema";

const MAX_UINT32_PLUS_ONE = 0x1_0000_0000;

function getSecureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new ConvexError("Secure random bound must be a positive integer.");
  }

  if (!globalThis.crypto?.getRandomValues) {
    throw new ConvexError("Secure random source unavailable.");
  }

  const threshold =
    Math.floor(MAX_UINT32_PLUS_ONE / maxExclusive) * maxExclusive;
  const buffer = new Uint32Array(1);

  while (true) {
    globalThis.crypto.getRandomValues(buffer);
    const value = buffer[0];
    if (value < threshold) {
      return value % maxExclusive;
    }
  }
}

// ---------------------------------------------------------------------------
// Role distribution algorithm
// ---------------------------------------------------------------------------

/**
 * Determine how many mafia members based on player count.
 * Rough rule: ~1/3 mafia (min 1, max 4).
 */
function getMafiaCount(playerCount: number): number {
  return getAutoMafiaCount(playerCount);
}

/**
 * Fisher–Yates shuffle (in-place).
 */
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isRoleVisiblePhase(phase: string): boolean {
  return phase !== "lobby";
}

async function hasCardsDistributedEvent(ctx: QueryCtx, gameId: Id<"games">) {
  const players = await ctx.db
    .query("players")
    .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
    .collect();

  return players.some((player) => player.role !== "citizen");
}

interface RoomSettings {
  mafiaCount?: number;
  enabledRoles: {
    sheikh: boolean;
    girl: boolean;
    boy: boolean;
  };
}

/**
 * Build an ordered role list for the given player count and settings.
 * Returns an array of `PlayerRole` with length === playerCount.
 */
function buildRoleList(
  playerCount: number,
  settings: RoomSettings,
): PlayerRole[] {
  let mafiaCount = getMafiaCount(playerCount);

  if (settings.mafiaCount !== undefined) {
    const validation = validateMafiaCount(settings.mafiaCount, playerCount);
    if (validation.valid) {
      mafiaCount = settings.mafiaCount;
    } else {
      console.warn(
        `[cardDistribution] Invalid custom mafiaCount=${settings.mafiaCount} for playerCount=${playerCount}. Falling back to auto=${mafiaCount}.`,
      );
    }
  }

  const roles: PlayerRole[] = [];

  // 1. Assign mafia slots
  for (let i = 0; i < mafiaCount; i++) {
    roles.push("mafia");
  }

  let citizenSlots = playerCount - mafiaCount;

  // 2. Assign special citizen roles (one each, if enabled and slots remain)
  if (settings.enabledRoles.sheikh && citizenSlots > 0) {
    roles.push("sheikh");
    citizenSlots--;
  }
  if (settings.enabledRoles.girl && citizenSlots > 0) {
    roles.push("girl");
    citizenSlots--;
  }
  if (settings.enabledRoles.boy && citizenSlots > 0) {
    roles.push("boy");
    citizenSlots--;
  }

  // 3. Fill remaining with plain citizens
  for (let i = 0; i < citizenSlots; i++) {
    roles.push("citizen");
  }

  return roles;
}

// ---------------------------------------------------------------------------
// Internal mutation — called by rooms.startGame via scheduler
// ---------------------------------------------------------------------------

export const distributeCards = internalMutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found.");
    if (game.phase !== "cardDistribution") {
      throw new ConvexError("Game is not in cardDistribution phase.");
    }

    const room = await ctx.db.get(game.roomId);
    if (!room) throw new ConvexError("Room not found.");

    const players = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    if (players.length < 3) {
      throw new ConvexError("Not enough players to distribute cards.");
    }

    // Build roles and shuffle
    const roles = buildRoleList(players.length, room.settings);
    const shuffledRoles = shuffleArray([...roles]);

    // Assign roles to players
    for (let i = 0; i < players.length; i++) {
      await ctx.db.patch(players[i]._id, {
        role: shuffledRoles[i],
      });
    }

    // Phase stays at cardDistribution — the frontend shows the reveal animation.
    // advancePhase (manual by owner or auto) moves to discussion.
  },
});

// ---------------------------------------------------------------------------
// Public queries — role visibility
// ---------------------------------------------------------------------------

export const getMyRole = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new ConvexError("Game not found.");
    }
    if (!isRoleVisiblePhase(game.phase)) {
      throw new ConvexError("Role is not visible in the current phase.");
    }

    const cardsDistributed = await hasCardsDistributedEvent(ctx, args.gameId);
    if (!cardsDistributed) {
      return null;
    }

    const player = await ctx.db
      .query("players")
      .withIndex("by_gameId_userId", (q) =>
        q.eq("gameId", args.gameId).eq("userId", userId),
      )
      .first();

    if (!player) {
      throw new ConvexError("You are not a player in this game.");
    }

    return {
      playerId: player._id,
      role: player.role,
      isAlive: player.isAlive,
    };
  },
});

export const getMafiaTeammates = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new ConvexError("Game not found.");
    }
    if (!isRoleVisiblePhase(game.phase)) {
      return [];
    }

    const cardsDistributed = await hasCardsDistributedEvent(ctx, args.gameId);
    if (!cardsDistributed) {
      return [];
    }

    const me = await ctx.db
      .query("players")
      .withIndex("by_gameId_userId", (q) =>
        q.eq("gameId", args.gameId).eq("userId", userId),
      )
      .first();

    if (!me) {
      throw new ConvexError("You are not a player in this game.");
    }

    if (me.role !== "mafia") {
      // Return empty — non-mafia must never see teammate info
      return [];
    }

    const allPlayers = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    const teammates = allPlayers.filter(
      (p) => p.role === "mafia" && p._id !== me._id,
    );

    const userDocs = await Promise.all(
      teammates.map((p) => ctx.db.get(p.userId)),
    );

    return teammates.map((p, i) => ({
      playerId: p._id,
      userId: p.userId,
      username: userDocs[i]?.username ?? userDocs[i]?.name ?? "Unknown",
      isAlive: p.isAlive,
    }));
  },
});
