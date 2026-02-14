import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";

const BOY_REVENGE_MS = 30_000;

type EliminationCause = "publicVote" | "mafiaVote";

function getAliveCounts(players: Doc<"players">[]) {
  const alivePlayers = players.filter((player) => player.isAlive);
  const aliveMafia = alivePlayers.filter(
    (player) => player.role === "mafia",
  ).length;
  const aliveCitizens = alivePlayers.length - aliveMafia;
  return { aliveMafia, aliveCitizens };
}

function getWinnerFaction(players: Doc<"players">[]) {
  const { aliveMafia, aliveCitizens } = getAliveCounts(players);
  if (aliveMafia === 0) return "citizens" as const;
  if (aliveMafia >= aliveCitizens) return "mafia" as const;
  return null;
}

async function checkAndTriggerWinCondition(
  ctx: MutationCtx,
  gameId: Id<"games">,
  reason: string,
): Promise<boolean> {
  const allPlayers = await ctx.db
    .query("players")
    .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
    .collect();
  const winner = getWinnerFaction(allPlayers);
  if (winner) {
    await ctx.scheduler.runAfter(0, internal.stateMachine.checkWinCondition, {
      gameId,
      reason,
    });
    return true;
  }
  return false;
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

async function advanceFromResolution(ctx: MutationCtx, gameId: Id<"games">) {
  await ctx.scheduler.runAfter(0, internal.stateMachine.advancePhaseInternal, {
    gameId,
    reason: "timer_auto_resolve",
  });
}

async function getPendingBoyIdsForRound(
  ctx: MutationCtx | QueryCtx,
  gameId: Id<"games">,
  round: number,
) {
  const players = await ctx.db
    .query("players")
    .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
    .collect();

  return players
    .filter(
      (player) => player.role === "boy" && player.eliminatedAtRound === round,
    )
    .map((player) => String(player._id));
}

async function getBoyActionsForRound(
  ctx: MutationCtx | QueryCtx,
  gameId: Id<"games">,
  round: number,
) {
  return ctx.db
    .query("actions")
    .withIndex("by_gameId_round_role", (q) =>
      q.eq("gameId", gameId).eq("round", round).eq("role", "boy"),
    )
    .collect();
}

async function maybeFinalizeResolution(ctx: MutationCtx, gameId: Id<"games">) {
  const game = await ctx.db.get(gameId);
  if (!game || game.phase !== "resolution") return;

  const pendingBoyIds = await getPendingBoyIdsForRound(ctx, gameId, game.round);
  if (pendingBoyIds.length === 0) {
    await advanceFromResolution(ctx, gameId);
    return;
  }

  const boyActions = await getBoyActionsForRound(ctx, gameId, game.round);
  const actedBoyIds = new Set(
    boyActions.map((action) => String(action.actorId)),
  );
  const unresolved = pendingBoyIds.filter((boyId) => !actedBoyIds.has(boyId));

  if (unresolved.length === 0) {
    await advanceFromResolution(ctx, gameId);
  }
}

export const resolveRound = internalMutation({
  args: {
    gameId: v.id("games"),
    expectedRound: v.optional(v.number()),
    expectedToken: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return { skipped: true, reason: "game_not_found" as const };
    if (game.phase !== "resolution") {
      return { skipped: true, reason: "phase_changed" as const };
    }
    if (args.expectedRound !== undefined && game.round !== args.expectedRound) {
      return { skipped: true, reason: "round_changed" as const };
    }
    if (
      args.expectedToken !== undefined &&
      (game.phaseToken ?? 0) !== args.expectedToken
    ) {
      return { skipped: true, reason: "token_mismatch" as const };
    }

    const allPlayers = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    const eliminatedThisRound = allPlayers.filter(
      (player) => player.eliminatedAtRound === game.round,
    );
    const eliminatedPlayerIds = eliminatedThisRound.map((player) =>
      String(player._id),
    );
    const boyPendingIds = eliminatedThisRound
      .filter((player) => player.role === "boy")
      .map((player) => String(player._id));
    const now = Date.now();

    const uniqueBoyPendingIds = unique(boyPendingIds);
    const boyActions = await getBoyActionsForRound(
      ctx,
      args.gameId,
      game.round,
    );
    const actedBoyIds = new Set(
      boyActions.map((action) => String(action.actorId)),
    );
    const unresolvedBoyIds = uniqueBoyPendingIds.filter(
      (id) => !actedBoyIds.has(id),
    );

    // T13: Check win condition immediately after applying eliminations
    const winnerDetected = await checkAndTriggerWinCondition(
      ctx,
      args.gameId,
      "elimination_detected_in_resolution",
    );
    if (winnerDetected) {
      return {
        skipped: false,
        waitingForBoyRevenge: false,
        eliminatedPlayerIds,
        winnerDetected: true,
      };
    }

    if (unresolvedBoyIds.length === 0) {
      await advanceFromResolution(ctx, args.gameId);
      return {
        skipped: false,
        waitingForBoyRevenge: false,
        eliminatedPlayerIds,
      };
    }

    if (game.phaseDeadlineAt && Date.now() < game.phaseDeadlineAt) {
      return {
        skipped: false,
        waitingForBoyRevenge: true,
        eliminatedPlayerIds,
        boyPendingIds: unresolvedBoyIds,
        deadlineAt: game.phaseDeadlineAt,
      };
    }

    const deadlineAt = now + BOY_REVENGE_MS;
    await ctx.db.patch(game._id, {
      phaseDeadlineAt: deadlineAt,
    });

    await ctx.scheduler.runAfter(
      BOY_REVENGE_MS,
      internal.resolution.autoForfeitBoyRevenge,
      {
        gameId: args.gameId,
        expectedRound: game.round,
        expectedToken: game.phaseToken ?? 0,
      },
    );

    return {
      skipped: false,
      waitingForBoyRevenge: true,
      eliminatedPlayerIds,
      boyPendingIds: unresolvedBoyIds,
      deadlineAt,
    };
  },
});

export const useBoyRevenge = mutation({
  args: {
    gameId: v.id("games"),
    targetPlayerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found.");
    if (game.phase !== "resolution") {
      throw new ConvexError("Game is not in resolution phase.");
    }

    const me = await ctx.db
      .query("players")
      .withIndex("by_gameId_userId", (q) =>
        q.eq("gameId", args.gameId).eq("userId", userId),
      )
      .first();
    if (!me) throw new ConvexError("You are not a player in this game.");
    if (me.role !== "boy") {
      throw new ConvexError("Only Boy can use revenge.");
    }
    if (me.isAlive || me.eliminatedAtRound !== game.round) {
      throw new ConvexError(
        "Boy revenge is only available when eliminated this round.",
      );
    }

    const pendingBoyIds = await getPendingBoyIdsForRound(
      ctx,
      args.gameId,
      game.round,
    );
    if (!pendingBoyIds.includes(String(me._id))) {
      throw new ConvexError("No pending revenge for this player.");
    }

    const existingAction = await ctx.db
      .query("actions")
      .withIndex("by_gameId_round_actorId", (q) =>
        q
          .eq("gameId", args.gameId)
          .eq("round", game.round)
          .eq("actorId", me._id),
      )
      .first();
    if (existingAction) {
      throw new ConvexError("Boy revenge has already been used this round.");
    }

    const target = await ctx.db.get(args.targetPlayerId);
    if (!target || target.gameId !== args.gameId) {
      throw new ConvexError("Target player not found in this game.");
    }
    if (!target.isAlive) {
      throw new ConvexError("Target must be alive.");
    }
    if (target._id === me._id) {
      throw new ConvexError("Cannot target yourself.");
    }

    const now = Date.now();
    await ctx.db.insert("actions", {
      gameId: args.gameId,
      round: game.round,
      role: "boy",
      actorId: me._id,
      targetId: target._id,
      result: "revenge_elimination",
      timestamp: now,
    });

    await ctx.db.patch(target._id, {
      isAlive: false,
      eliminatedAtRound: game.round,
    });

    // T13: Check win condition immediately after boy revenge elimination
    const winnerDetected = await checkAndTriggerWinCondition(
      ctx,
      args.gameId,
      "elimination_detected_in_boy_revenge",
    );
    if (winnerDetected) {
      return { success: true, winnerDetected: true };
    }

    await maybeFinalizeResolution(ctx, args.gameId);

    return { success: true };
  },
});

export const autoForfeitBoyRevenge = internalMutation({
  args: {
    gameId: v.id("games"),
    expectedRound: v.number(),
    expectedToken: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return { skipped: true, reason: "game_not_found" as const };
    if (game.phase !== "resolution") {
      return { skipped: true, reason: "phase_changed" as const };
    }
    if (game.round !== args.expectedRound) {
      return { skipped: true, reason: "round_changed" as const };
    }
    if (
      args.expectedToken !== undefined &&
      (game.phaseToken ?? 0) !== args.expectedToken
    ) {
      return { skipped: true, reason: "token_mismatch" as const };
    }
    if (!game.phaseDeadlineAt || Date.now() < game.phaseDeadlineAt) {
      return { skipped: true, reason: "deadline_not_reached" as const };
    }

    const pendingBoyIds = await getPendingBoyIdsForRound(
      ctx,
      args.gameId,
      game.round,
    );

    const boyActions = await getBoyActionsForRound(
      ctx,
      args.gameId,
      game.round,
    );
    const acted = new Set(boyActions.map((action) => String(action.actorId)));
    const forfeitedBoyIds = pendingBoyIds.filter((id) => !acted.has(id));

    await advanceFromResolution(ctx, args.gameId);

    return {
      skipped: false,
      forfeitedBoyIds,
    };
  },
});

export const getResolutionState = query({
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

    const eliminatedThisRound = allPlayers.filter(
      (player) => player.eliminatedAtRound === game.round,
    );
    const roundEvents = await ctx.db
      .query("gameEvents")
      .withIndex("by_gameId_round", (q) =>
        q.eq("gameId", args.gameId).eq("round", game.round),
      )
      .collect();
    const hasPublicElimination = roundEvents.some(
      (event) => event.eventType === "VOTE_ELIMINATION",
    );
    const hasMafiaElimination = roundEvents.some(
      (event) => event.eventType === "MAFIA_ELIMINATION",
    );

    const eliminated = eliminatedThisRound.map((player) => {
      const user = userById.get(player.userId);
      const causes: EliminationCause[] = [];
      if (hasPublicElimination) causes.push("publicVote");
      if (hasMafiaElimination) causes.push("mafiaVote");
      return {
        playerId: String(player._id),
        username: user?.username ?? "Unknown",
        causes,
      };
    });

    const pendingBoyIds = await getPendingBoyIdsForRound(
      ctx,
      args.gameId,
      game.round,
    );
    const boyActions = await getBoyActionsForRound(
      ctx,
      args.gameId,
      game.round,
    );
    const actedBoyIds = new Set(
      boyActions.map((action) => String(action.actorId)),
    );
    const pendingBoyRevengeIds = pendingBoyIds.filter(
      (id) => !actedBoyIds.has(id),
    );

    return {
      phase: game.phase,
      round: game.round,
      phaseDeadlineAt: game.phaseDeadlineAt,
      eliminated,
      pendingBoyRevengeIds,
      isCurrentPlayerPendingBoy:
        me.role === "boy" && pendingBoyRevengeIds.includes(String(me._id)),
      players: allPlayers.map((player) => ({
        playerId: player._id,
        userId: player.userId,
        username: userById.get(player.userId)?.username ?? "Unknown",
        avatarUrl: userById.get(player.userId)?.image,
        isAlive: player.isAlive,
        eliminatedAtRound: player.eliminatedAtRound,
      })),
    };
  },
});
