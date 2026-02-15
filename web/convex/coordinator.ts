import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { type MutationCtx, type QueryCtx, query } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";

export async function isCoordinator(
  ctx: QueryCtx | MutationCtx,
  game: Doc<"games">,
  player: Doc<"players"> | null,
  userId: Id<"users">,
) {
  if (player?.isCoordinator) return true;

  const room = await ctx.db.get(game.roomId);
  if (!room) return false;

  return (
    room.ownerId === userId &&
    (room.settings.ownerMode === "coordinator" ||
      room.settings.ownerMode === "player") &&
    player?.isCoordinator === true
  );
}

// Helper that doesn't rely on player object being already fetched/checked with isCoordinator flag
// This handles the case where ownerMode IS "coordinator" and thus NO player record exists.
export async function isCoordinatorUser(
  ctx: QueryCtx | MutationCtx,
  gameId: Id<"games">,
  userId: Id<"users">,
) {
  const game = await ctx.db.get(gameId);
  if (!game) return false;

  const player = await ctx.db
    .query("players")
    .withIndex("by_gameId_userId", (q) =>
      q.eq("gameId", gameId).eq("userId", userId),
    )
    .first();

  if (player?.isCoordinator) return true;

  const room = await ctx.db.get(game.roomId);
  if (!room) return false;

  // If owner matches and mode is coordinator, they are coordinator (even without player record)
  if (room.ownerId === userId && room.settings.ownerMode === "coordinator") {
    return true;
  }

  // If owner matches and mode is player, they must be eliminated (isCoordinator on player record would handle it)
  // But strictly speaking, "isCoordinator" checks rights.
  // If they are owner in player mode, they are NOT coordinator unless promoted.

  return false;
}

export const getCoordinatorState = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const isCoord = await isCoordinatorUser(ctx, args.gameId, userId);

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found.");

    if (!isCoord) {
      // Allow room owner to see it if game is finished?
      if (game.phase !== "finished") {
        throw new ConvexError("Only coordinators can view this state.");
      }
      // If finished, standard queries likely suffice, but let's allow owner access for potential debug/review
      const room = await ctx.db.get(game.roomId);
      if (room?.ownerId !== userId) {
        throw new ConvexError("Unauthorized.");
      }
    }

    const allPlayers = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    const userDocs = await Promise.all(
      allPlayers.map((player) => ctx.db.get(player.userId)),
    );
    const userById = new Map(
      userDocs
        .filter((user): user is NonNullable<typeof user> => user !== null)
        .map((user) => [user._id, user]),
    );

    const playerViews = allPlayers.map((player) => {
      const user = userById.get(player.userId);
      return {
        playerId: player._id,
        userId: player.userId,
        username: user?.username ?? "Unknown",
        avatarUrl: user?.image,
        isAlive: player.isAlive,
        isConnected: player.isConnected,
        eliminatedAtRound: player.eliminatedAtRound,
        role: player.role, // FULL VISIBILITY
        emojiReaction: player.emojiReaction,
        isCoordinator: player.isCoordinator,
      };
    });

    // Fetch all votes for the game (full history)
    const publicVotes = await ctx.db
      .query("votes")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("phase"), "public"))
      .collect();

    const mafiaVotes = await ctx.db
      .query("votes")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("phase"), "mafia"))
      .collect();

    // Fetch all actions (sheikh, girl, boy) for the game (full history)
    const actions = await ctx.db
      .query("actions")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    return {
      game: {
        id: game._id,
        roomId: game.roomId,
        phase: game.phase,
        round: game.round,
        phaseDeadlineAt: game.phaseDeadlineAt,
      },
      players: playerViews,
      votes: {
        public: publicVotes,
        mafia: mafiaVotes,
      },
      actions,
      isCoordinator: true,
    };
  },
});

export const checkIsCoordinator = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    return isCoordinatorUser(ctx, args.gameId, userId);
  },
});
