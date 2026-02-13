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

function parseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
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
  const roundEvents = await ctx.db
    .query("gameEvents")
    .withIndex("by_gameId_round", (q) =>
      q.eq("gameId", gameId).eq("round", round),
    )
    .collect();

  const appliedEvent = roundEvents.find(
    (event) => event.type === "round_resolution_applied",
  );
  if (!appliedEvent) return [] as string[];

  const payload = parseJson<{ boyPendingIds?: string[] }>(appliedEvent.payload);
  return payload?.boyPendingIds ?? [];
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

    const roundEvents = await ctx.db
      .query("gameEvents")
      .withIndex("by_gameId_round", (q) =>
        q.eq("gameId", args.gameId).eq("round", game.round),
      )
      .collect();

    const alreadyApplied = roundEvents.some(
      (event) => event.type === "round_resolution_applied",
    );
    if (alreadyApplied) {
      return { skipped: true, reason: "already_applied" as const };
    }

    const causesByPlayer = new Map<string, Set<EliminationCause>>();

    for (const event of roundEvents) {
      if (event.type === "public_elimination") {
        const payload = parseJson<{ eliminatedPlayerId?: string }>(
          event.payload,
        );
        if (payload?.eliminatedPlayerId) {
          const causes =
            causesByPlayer.get(payload.eliminatedPlayerId) ??
            new Set<EliminationCause>();
          causes.add("publicVote");
          causesByPlayer.set(payload.eliminatedPlayerId, causes);
        }
      }

      if (event.type === "mafia_vote_result") {
        const payload = parseJson<{ eliminatedPlayerId?: string | null }>(
          event.payload,
        );
        if (payload?.eliminatedPlayerId) {
          const causes =
            causesByPlayer.get(payload.eliminatedPlayerId) ??
            new Set<EliminationCause>();
          causes.add("mafiaVote");
          causesByPlayer.set(payload.eliminatedPlayerId, causes);
        }
      }
    }

    const eliminatedPlayerIds = [...causesByPlayer.keys()];
    const boyPendingIds: string[] = [];
    const now = Date.now();

    for (const playerId of eliminatedPlayerIds) {
      const playerDoc = await ctx.db.get(playerId as Id<"players">);
      if (!playerDoc || playerDoc.gameId !== args.gameId) continue;

      if (playerDoc.isAlive) {
        await ctx.db.patch(playerDoc._id, {
          isAlive: false,
          eliminatedAtRound: game.round,
        });
      }

      if (playerDoc.role === "boy") {
        boyPendingIds.push(String(playerDoc._id));
      }

      await ctx.db.insert("gameEvents", {
        gameId: args.gameId,
        round: game.round,
        type: "elimination_applied",
        payload: JSON.stringify({
          playerId,
          causes: [
            ...(causesByPlayer.get(playerId) ?? new Set<EliminationCause>()),
          ],
        }),
        timestamp: now,
      });
    }

    const uniqueBoyPendingIds = unique(boyPendingIds);

    await ctx.db.insert("gameEvents", {
      gameId: args.gameId,
      round: game.round,
      type: "round_resolution_applied",
      payload: JSON.stringify({
        eliminatedPlayerIds,
        boyPendingIds: uniqueBoyPendingIds,
      }),
      timestamp: now,
    });

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

    if (uniqueBoyPendingIds.length === 0) {
      await advanceFromResolution(ctx, args.gameId);
      return {
        skipped: false,
        waitingForBoyRevenge: false,
        eliminatedPlayerIds,
      };
    }

    const deadlineAt = now + BOY_REVENGE_MS;
    await ctx.db.patch(game._id, {
      phaseDeadlineAt: deadlineAt,
    });

    await ctx.db.insert("gameEvents", {
      gameId: args.gameId,
      round: game.round,
      type: "boy_revenge_window_opened",
      payload: JSON.stringify({
        boyPlayerIds: uniqueBoyPendingIds,
        deadlineAt,
      }),
      timestamp: now,
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
      boyPendingIds: uniqueBoyPendingIds,
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

    await ctx.db.insert("gameEvents", {
      gameId: args.gameId,
      round: game.round,
      type: "boy_revenge_elimination",
      payload: JSON.stringify({
        boyPlayerId: me._id,
        targetPlayerId: target._id,
      }),
      timestamp: now,
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

    if (forfeitedBoyIds.length > 0) {
      await ctx.db.insert("gameEvents", {
        gameId: args.gameId,
        round: game.round,
        type: "boy_revenge_forfeited",
        payload: JSON.stringify({ boyPlayerIds: forfeitedBoyIds }),
        timestamp: Date.now(),
      });
    }

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

    const roundEvents = await ctx.db
      .query("gameEvents")
      .withIndex("by_gameId_round", (q) =>
        q.eq("gameId", args.gameId).eq("round", game.round),
      )
      .collect();

    const eliminationEvents = roundEvents.filter(
      (event) => event.type === "elimination_applied",
    );

    const eliminated = eliminationEvents
      .map((event) =>
        parseJson<{ playerId?: string; causes?: EliminationCause[] }>(
          event.payload,
        ),
      )
      .filter(
        (item): item is { playerId: string; causes?: EliminationCause[] } =>
          Boolean(item?.playerId),
      )
      .map((item) => {
        const player = allPlayers.find((p) => String(p._id) === item.playerId);
        const user = player ? userById.get(player.userId) : null;
        return {
          playerId: item.playerId,
          username: user?.username ?? "Unknown",
          causes: item.causes ?? [],
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
