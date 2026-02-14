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
import { logGameEvent } from "./gameEvents";
import { requireAuthUserId } from "./lib/auth";

const PUBLIC_VOTING_MS = 45_000;
const MAX_PUBLIC_RUNOFF_SUBROUNDS = 1;

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

    const tiedCandidates = game.tiedCandidates ?? [];
    const isRunoff = tiedCandidates.length > 0;
    const isSkip = !isRunoff && (Boolean(args.isSkip) || !args.targetPlayerId);

    if (isRunoff && !args.targetPlayerId) {
      throw new ConvexError(
        "Runoff votes must target one of the tied players.",
      );
    }

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
      if (
        isRunoff &&
        !tiedCandidates.some((candidateId) => candidateId === target._id)
      ) {
        throw new ConvexError("Target is not part of the runoff candidates.");
      }
    }

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
      await ctx.db.patch(existingVote._id, {
        targetId: isSkip ? undefined : args.targetPlayerId,
        isSkip,
        timestamp: now,
      });
    } else {
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

export const getPublicVotes = query({
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
        q.eq("gameId", args.gameId).eq("userId", userId),
      )
      .first();
    if (!me) throw new ConvexError("You are not a player in this game.");

    const votes = await ctx.db
      .query("votes")
      .withIndex("by_gameId_round_phase", (q) =>
        q
          .eq("gameId", args.gameId)
          .eq("round", game.round)
          .eq("phase", "public"),
      )
      .collect();

    const alivePlayers = await ctx.db
      .query("players")
      .withIndex("by_gameId_isAlive", (q) =>
        q.eq("gameId", args.gameId).eq("isAlive", true),
      )
      .collect();

    const userDocs = await Promise.all(
      alivePlayers.map((player) => ctx.db.get(player.userId)),
    );
    const userById = new Map(
      userDocs
        .filter((user): user is NonNullable<typeof user> => user !== null)
        .map((user) => [user._id, user]),
    );
    const playerById = new Map(
      alivePlayers.map((player) => [player._id, player]),
    );

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

    const votesAgainstMe = votes
      .filter((vote) => vote.targetId === me._id)
      .map((vote) => {
        const voterPlayer = playerById.get(vote.voterId);
        const voterUser = voterPlayer ? userById.get(voterPlayer.userId) : null;
        return {
          voterId: vote.voterId,
          voterPlayerId: vote.voterId,
          voterUsername: voterUser?.username ?? "Unknown",
          voterAvatarUrl: voterUser?.image,
        };
      });

    return {
      round: game.round,
      votingSubRound: game.votingSubRound ?? 0,
      tiedCandidates: game.tiedCandidates ?? [],
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
      votesAgainstMe,
    };
  },
});

export const getPublicVotingRunoffState = query({
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
        q.eq("gameId", args.gameId).eq("userId", userId),
      )
      .first();
    if (!me) throw new ConvexError("You are not a player in this game.");

    const tiedCandidates = game.tiedCandidates ?? [];
    const isRunoff = tiedCandidates.length > 0;

    if (!isRunoff) {
      return {
        isRunoff: false,
        subRound: game.votingSubRound ?? 0,
        tiedCandidates: [] as Array<{
          playerId: Id<"players">;
          userId: Id<"users">;
          username: string;
          avatarUrl: string | undefined;
        }>,
      };
    }

    const players = await Promise.all(
      tiedCandidates.map((playerId) => ctx.db.get(playerId)),
    );
    const validPlayers = players.filter(
      (player): player is NonNullable<typeof player> => Boolean(player),
    );

    const users = await Promise.all(
      validPlayers.map((player) => ctx.db.get(player.userId)),
    );
    const userById = new Map(
      users
        .filter((user): user is NonNullable<typeof user> => Boolean(user))
        .map((user) => [user._id, user]),
    );

    return {
      isRunoff: true,
      subRound: game.votingSubRound ?? 0,
      tiedCandidates: validPlayers.map((player) => ({
        playerId: player._id,
        userId: player.userId,
        username: userById.get(player.userId)?.username ?? "Unknown",
        avatarUrl: userById.get(player.userId)?.image,
      })),
    };
  },
});

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

    if (!result.runoffStarted) {
      await ctx.scheduler.runAfter(
        0,
        internal.stateMachine.advancePhaseInternal,
        { gameId: args.gameId, reason: "timer_auto_resolve" },
      );
    }

    return result;
  },
});

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

  const tally: Record<string, number> = {};
  let skipCount = 0;

  for (const vote of votes) {
    if (vote.isSkip) {
      skipCount++;
    } else if (vote.targetId) {
      tally[vote.targetId] = (tally[vote.targetId] ?? 0) + 1;
    }
  }

  const entries = Object.entries(tally);
  let eliminatedPlayerId: string | null = null;
  let noElimination = false;

  const votingSubRound = game.votingSubRound ?? 0;

  if (entries.length === 0) {
    noElimination = true;
  } else {
    const maxVotes = Math.max(...entries.map(([, count]) => count));
    const topCandidates = entries.filter(([, count]) => count === maxVotes);

    if (topCandidates.length > 1) {
      if (votingSubRound < MAX_PUBLIC_RUNOFF_SUBROUNDS) {
        const now = Date.now();
        const nextSubRound = votingSubRound + 1;
        const tiedCandidates = topCandidates.map(
          ([playerId]) => playerId as Id<"players">,
        );
        const nextPhaseToken = (game.phaseToken ?? 0) + 1;

        for (const vote of votes) {
          await ctx.db.delete(vote._id);
        }

        await ctx.db.patch(game._id, {
          votingSubRound: nextSubRound,
          tiedCandidates,
          phaseStartedAt: now,
          phaseDeadlineAt: now + PUBLIC_VOTING_MS,
          phaseToken: nextPhaseToken,
        });

        const tiedCandidatesDocs = await Promise.all(
          tiedCandidates.map((id) => ctx.db.get(id)),
        );
        const tiedInfo = await Promise.all(
          tiedCandidatesDocs.map(async (p) => {
            if (!p) return "Unknown";
            const u = await ctx.db.get(p.userId);
            return u?.displayName ?? u?.username ?? "Unknown";
          }),
        );

        await logGameEvent(ctx, {
          gameId,
          eventType: "VOTE_TIE",
          params: { players: tiedInfo.join(", ") },
        });

        await ctx.scheduler.runAfter(
          PUBLIC_VOTING_MS,
          internal.publicVoting.autoResolvePublicVoting,
          {
            gameId,
            expectedToken: nextPhaseToken,
          },
        );

        return {
          eliminated: null,
          noElimination: false,
          tally,
          skipCount,
          runoffStarted: true,
          votingSubRound: nextSubRound,
          tiedCandidates,
        };
      }

      noElimination = true;
    } else if (skipCount >= maxVotes) {
      noElimination = true;
    } else {
      eliminatedPlayerId = topCandidates[0][0];
    }
  }

  if (eliminatedPlayerId) {
    await ctx.db.patch(eliminatedPlayerId as Id<"players">, {
      isAlive: false,
      eliminatedAtRound: game.round,
    });

    const eliminatedPlayer = await ctx.db.get(
      eliminatedPlayerId as Id<"players">,
    );
    const eliminatedUser = eliminatedPlayer
      ? await ctx.db.get(eliminatedPlayer.userId)
      : null;
    const eliminatedName =
      eliminatedUser?.displayName ?? eliminatedUser?.username ?? "Unknown";

    await logGameEvent(ctx, {
      gameId,
      eventType: "VOTE_ELIMINATION",
      params: {
        player: eliminatedName,
      },
    });
  } else {
    // No elimination (skip or tie without runoff) - no event logged per current specs
  }

  await ctx.db.patch(game._id, {
    votingSubRound: 0,
    tiedCandidates: undefined,
  });

  return {
    eliminated: eliminatedPlayerId ?? null,
    noElimination,
    tally,
    skipCount,
    runoffStarted: false,
    votingSubRound: game.votingSubRound ?? 0,
    tiedCandidates: [] as Id<"players">[],
  };
}

export const autoResolvePublicVoting = internalMutation({
  args: {
    gameId: v.id("games"),
    expectedToken: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return { skipped: true, reason: "game_not_found" as const };
    if (game.phase !== "publicVoting") {
      return { skipped: true, reason: "phase_changed" as const };
    }
    if (
      args.expectedToken !== undefined &&
      (game.phaseToken ?? 0) !== args.expectedToken
    ) {
      return { skipped: true, reason: "token_mismatch" as const };
    }

    const result = await resolvePublicVoting(ctx, args.gameId);

    if (!result.runoffStarted) {
      await ctx.scheduler.runAfter(
        0,
        internal.stateMachine.advancePhaseInternal,
        { gameId: args.gameId, reason: "timer_auto_resolve" },
      );
    }

    return result;
  },
});
