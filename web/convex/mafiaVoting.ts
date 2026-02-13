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

async function getMafiaVoterOrThrow(
  ctx: MutationCtx,
  gameId: Id<"games">,
  userId: Id<"users">,
) {
  const game = await ctx.db.get(gameId);
  if (!game) throw new ConvexError("Game not found.");
  if (game.phase !== "mafiaVoting") {
    throw new ConvexError("Game is not in mafia voting phase.");
  }

  const voter = await ctx.db
    .query("players")
    .withIndex("by_gameId_userId", (q) =>
      q.eq("gameId", gameId).eq("userId", userId),
    )
    .first();

  if (!voter) throw new ConvexError("You are not a player in this game.");
  if (!voter.isAlive || voter.role !== "mafia") {
    throw new ConvexError("Only alive mafia members can vote.");
  }

  return { game, voter };
}

function parseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function resolveMafiaVoting(
  ctx: MutationCtx,
  gameId: Id<"games">,
  expectedToken?: number,
) {
  const game = await ctx.db.get(gameId);
  if (!game) throw new ConvexError("Game not found.");
  if (game.phase !== "mafiaVoting") {
    throw new ConvexError("Game is not in mafia voting phase.");
  }
  if (expectedToken !== undefined && (game.phaseToken ?? 0) !== expectedToken) {
    return { skipped: true, reason: "token_mismatch" as const };
  }

  const events = await ctx.db
    .query("gameEvents")
    .withIndex("by_gameId_round", (q) =>
      q.eq("gameId", gameId).eq("round", game.round),
    )
    .collect();
  const existingResult = events.find(
    (event) => event.type === "mafia_vote_result",
  );
  if (existingResult) {
    const payload =
      parseJson<{
        eliminatedPlayerId: string | null;
        noElimination: boolean;
        protectionBlocked: boolean;
        tally: Record<string, number>;
      }>(existingResult.payload) ?? null;

    return {
      skipped: true,
      reason: "already_resolved" as const,
      result: {
        eliminatedPlayerId: payload?.eliminatedPlayerId ?? null,
        noElimination: payload?.noElimination ?? true,
        protectionBlocked: payload?.protectionBlocked ?? false,
        tally: payload?.tally ?? {},
      },
    };
  }

  const votes = await ctx.db
    .query("votes")
    .withIndex("by_gameId_round_phase", (q) =>
      q.eq("gameId", gameId).eq("round", game.round).eq("phase", "mafia"),
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

  if (entries.length === 0) {
    noElimination = true;
  } else {
    const maxVotes = Math.max(...entries.map(([, count]) => count));
    const top = entries.filter(([, count]) => count === maxVotes);

    if (top.length > 1) {
      noElimination = true;
    } else {
      eliminatedPlayerId = top[0][0];
    }
  }

  let protectionBlocked = false;
  if (eliminatedPlayerId) {
    const girlAction = await ctx.db
      .query("actions")
      .withIndex("by_gameId_round_role", (q) =>
        q.eq("gameId", gameId).eq("round", game.round).eq("role", "girl"),
      )
      .first();

    if (girlAction?.targetId === eliminatedPlayerId) {
      protectionBlocked = true;
      eliminatedPlayerId = null;
      noElimination = true;
    }
  }

  await ctx.db.insert("gameEvents", {
    gameId,
    round: game.round,
    type: "mafia_vote_result",
    payload: JSON.stringify({
      eliminatedPlayerId,
      noElimination,
      protectionBlocked,
      tally,
      totalVotes: votes.length,
    }),
    timestamp: Date.now(),
  });

  return {
    skipped: false,
    result: {
      eliminatedPlayerId,
      noElimination,
      protectionBlocked,
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
      userId,
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
          .eq("voterId", voter._id),
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
        q.eq("gameId", args.gameId).eq("userId", userId),
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
      allPlayers.map((p) => ctx.db.get(p.userId)),
    );
    const userById = new Map(
      userDocs
        .filter((u): u is NonNullable<typeof u> => u !== null)
        .map((u) => [u._id, u]),
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
        q
          .eq("gameId", args.gameId)
          .eq("round", game.round)
          .eq("phase", "mafia"),
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
      },
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
      args.expectedToken,
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
      },
    );

    return resolved;
  },
});
