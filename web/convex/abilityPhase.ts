import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, query } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";
import { logGameEvent } from "./gameEvents";

function toFaction(role: Doc<"players">["role"]): "mafia" | "citizens" {
  return role === "mafia" ? "mafia" : "citizens";
}

function parseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function getGameInAbilityPhaseOrThrow(
  ctx: MutationCtx,
  gameId: Id<"games">,
) {
  const game = await ctx.db.get(gameId);
  if (!game) {
    throw new ConvexError("Game not found.");
  }
  if (game.phase !== "abilityPhase") {
    throw new ConvexError("Game is not in ability phase.");
  }
  return game;
}

async function getPlayerOrThrow(
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

  if (!player) {
    throw new ConvexError("You are not a player in this game.");
  }
  return player;
}

async function getActionForActorThisRound(
  ctx: MutationCtx,
  gameId: Id<"games">,
  round: number,
  actorId: Id<"players">,
) {
  return ctx.db
    .query("actions")
    .withIndex("by_gameId_round_actorId", (q) =>
      q.eq("gameId", gameId).eq("round", round).eq("actorId", actorId),
    )
    .first();
}

async function maybeCompleteAbilityPhase(
  ctx: MutationCtx,
  gameId: Id<"games">,
) {
  const game = await ctx.db.get(gameId);
  if (!game || game.phase !== "abilityPhase") {
    return;
  }

  const alivePlayers = await ctx.db
    .query("players")
    .withIndex("by_gameId_isAlive", (q) =>
      q.eq("gameId", gameId).eq("isAlive", true),
    )
    .collect();

  const hasAliveSheikh = alivePlayers.some((p) => p.role === "sheikh");
  const hasAliveGirl = alivePlayers.some((p) => p.role === "girl");

  const actionsThisRound = await ctx.db
    .query("actions")
    .withIndex("by_gameId_round", (q) =>
      q.eq("gameId", gameId).eq("round", game.round),
    )
    .collect();

  const sheikhAction = actionsThisRound.find((a) => a.role === "sheikh");
  const girlAction = actionsThisRound.find((a) => a.role === "girl");

  const sheikhDone = !hasAliveSheikh || Boolean(sheikhAction?.confirmed);
  const girlDone = !hasAliveGirl || Boolean(girlAction?.confirmed);

  if (!sheikhDone || !girlDone) {
    return;
  }

  await ctx.db.patch(game._id, {
    phaseDeadlineAt: Date.now(),
  });

  await ctx.scheduler.runAfter(0, internal.stateMachine.handlePhaseTimer, {
    gameId,
    expectedPhase: "abilityPhase",
    expectedToken: game.phaseToken ?? 0,
  });
}

export const useSheikhAbility = mutation({
  args: {
    gameId: v.id("games"),
    targetPlayerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const game = await getGameInAbilityPhaseOrThrow(ctx, args.gameId);
    const actor = await getPlayerOrThrow(ctx, args.gameId, userId);

    if (!actor.isAlive || actor.role !== "sheikh") {
      throw new ConvexError("Only an alive Sheikh can use this ability.");
    }

    if (actor._id === args.targetPlayerId) {
      throw new ConvexError("Sheikh cannot investigate themselves.");
    }

    const target = await ctx.db.get(args.targetPlayerId);
    if (!target || target.gameId !== args.gameId) {
      throw new ConvexError("Target player not found in this game.");
    }
    if (!target.isAlive) {
      throw new ConvexError("Target must be alive.");
    }

    const existing = await getActionForActorThisRound(
      ctx,
      args.gameId,
      game.round,
      actor._id,
    );
    if (existing) {
      throw new ConvexError("You have already used your ability this round.");
    }

    const faction = toFaction(target.role);
    const now = Date.now();

    await ctx.db.insert("actions", {
      gameId: args.gameId,
      round: game.round,
      role: "sheikh",
      actorId: actor._id,
      targetId: target._id,
      result: faction,
      confirmed: false,
      timestamp: now,
    });

    await logGameEvent(ctx, {
      gameId: args.gameId,
      eventType: faction === "mafia" ? "SHEIKH_INVESTIGATION_MAFIA" : "SHEIKH_INVESTIGATION_CITIZEN",
      params: {},
    });

    return { success: true, faction };
  },
});

export const useGirlAbility = mutation({
  args: {
    gameId: v.id("games"),
    targetPlayerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const game = await getGameInAbilityPhaseOrThrow(ctx, args.gameId);
    const actor = await getPlayerOrThrow(ctx, args.gameId, userId);

    if (!actor.isAlive || actor.role !== "girl") {
      throw new ConvexError("Only an alive Girl can use this ability.");
    }

    const target = await ctx.db.get(args.targetPlayerId);
    if (!target || target.gameId !== args.gameId) {
      throw new ConvexError("Target player not found in this game.");
    }
    if (!target.isAlive) {
      throw new ConvexError("Target must be alive.");
    }

    const existing = await getActionForActorThisRound(
      ctx,
      args.gameId,
      game.round,
      actor._id,
    );
    if (existing) {
      throw new ConvexError("You have already used your ability this round.");
    }

    const now = Date.now();

    await ctx.db.insert("actions", {
      gameId: args.gameId,
      round: game.round,
      role: "girl",
      actorId: actor._id,
      targetId: target._id,
      confirmed: false,
      timestamp: now,
    });

    // Private action logging is handled by 'actions' table. No public event for Girl usage.

    return { success: true };
  },
});

export const confirmAbilityAction = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const game = await getGameInAbilityPhaseOrThrow(ctx, args.gameId);
    const actor = await getPlayerOrThrow(ctx, args.gameId, userId);

    if (!actor.isAlive || (actor.role !== "sheikh" && actor.role !== "girl")) {
      throw new ConvexError(
        "Only alive Sheikh or Girl players can confirm an ability action.",
      );
    }

    const action = await getActionForActorThisRound(
      ctx,
      args.gameId,
      game.round,
      actor._id,
    );

    if (!action || action.role !== actor.role) {
      throw new ConvexError("You must use your ability before confirming.");
    }

    if (!action.confirmed) {
      await ctx.db.patch(action._id, { confirmed: true });

      // No public confirmed event.
    }

    await maybeCompleteAbilityPhase(ctx, args.gameId);

    return { success: true };
  },
});

export const getAbilityPhaseState = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new ConvexError("Game not found.");
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

    const alivePlayers = allPlayers.filter((p) => p.isAlive);
    const hasAliveSheikh = alivePlayers.some((p) => p.role === "sheikh");
    const hasAliveGirl = alivePlayers.some((p) => p.role === "girl");

    const actionsThisRound = await ctx.db
      .query("actions")
      .withIndex("by_gameId_round", (q) =>
        q.eq("gameId", args.gameId).eq("round", game.round),
      )
      .collect();

    const sheikhAction = actionsThisRound.find((a) => a.role === "sheikh");
    const girlAction = actionsThisRound.find((a) => a.role === "girl");
    const myAction = actionsThisRound.find((a) => a.actorId === me._id);

    const base = {
      phase: game.phase,
      round: game.round,
      phaseDeadlineAt: game.phaseDeadlineAt,
      isAlive: me.isAlive,
    };

    const roleCanAct =
      me.isAlive && (me.role === "sheikh" || me.role === "girl");
    if (game.phase !== "abilityPhase" || !roleCanAct) {
      return {
        ...base,
        roleView: "waiting" as const,
        canAct: false,
        canConfirm: false,
      };
    }

    if (me.role === "sheikh") {
      const history = (
        await ctx.db
          .query("actions")
          .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
          .collect()
      )
        .filter((a) => a.role === "sheikh" && a.actorId === me._id)
        .sort((a, b) => a.round - b.round)
        .map((a) => {
          const target = a.targetId
            ? allPlayers.find((p) => p._id === a.targetId)
            : null;
          const targetUser = target ? userById.get(target.userId) : null;
          return {
            round: a.round,
            targetPlayerId: a.targetId,
            targetUsername:
              targetUser?.username ?? targetUser?.name ?? "Unknown",
            faction: a.result === "mafia" ? "mafia" : "citizens",
            timestamp: a.timestamp,
          };
        });

      return {
        ...base,
        roleView: "sheikh" as const,
        canAct: hasAliveSheikh && !sheikhAction,
        canConfirm: Boolean(myAction && !myAction.confirmed),
        players: alivePlayers
          .filter((p) => p._id !== me._id)
          .map((p) => ({
            playerId: p._id,
            userId: p.userId,
            username: userById.get(p.userId)?.username ?? "Unknown",
            avatarUrl: userById.get(p.userId)?.image,
            isAlive: p.isAlive,
          })),
        lastResult:
          myAction?.role === "sheikh"
            ? myAction.result === "mafia"
              ? "mafia"
              : "citizens"
            : null,
        investigationHistory: history,
      };
    }

    return {
      ...base,
      roleView: "girl" as const,
      canAct: hasAliveGirl && !girlAction,
      canConfirm: Boolean(myAction && !myAction.confirmed),
      players: alivePlayers.map((p) => ({
        playerId: p._id,
        userId: p.userId,
        username: userById.get(p.userId)?.username ?? "Unknown",
        avatarUrl: userById.get(p.userId)?.image,
        isAlive: p.isAlive,
      })),
    };
  },
});

export const getSheikhInvestigationLog = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    const me = await ctx.db
      .query("players")
      .withIndex("by_gameId_userId", (q) =>
        q.eq("gameId", args.gameId).eq("userId", userId),
      )
      .first();

    if (!me) {
      throw new ConvexError("You are not a player in this game.");
    }
    if (me.role !== "sheikh") {
      throw new ConvexError("Only Sheikh can access investigation logs.");
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

    const actions = (
      await ctx.db
        .query("actions")
        .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
        .collect()
    )
      .filter((action) => action.role === "sheikh" && action.actorId === me._id)
      .sort((a, b) => b.round - a.round);

    return actions.map((action) => {
      const target = action.targetId
        ? allPlayers.find((player) => player._id === action.targetId)
        : null;
      const targetUser = target ? userById.get(target.userId) : null;

      return {
        round: action.round,
        targetPlayerId: action.targetId,
        targetUsername: targetUser?.username ?? targetUser?.name ?? "Unknown",
        targetAvatarUrl: targetUser?.image,
        faction: action.result === "mafia" ? "mafia" : "citizens",
        timestamp: action.timestamp,
      };
    });
  },
});

export const getGirlProtectionLog = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    const me = await ctx.db
      .query("players")
      .withIndex("by_gameId_userId", (q) =>
        q.eq("gameId", args.gameId).eq("userId", userId),
      )
      .first();

    if (!me) {
      throw new ConvexError("You are not a player in this game.");
    }
    if (me.role !== "girl") {
      throw new ConvexError("Only Girl can access protection logs.");
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

    const actions = (
      await ctx.db
        .query("actions")
        .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
        .collect()
    )
      .filter((action) => action.role === "girl" && action.actorId === me._id)
      .sort((a, b) => b.round - a.round);

    const mafiaVoteResults = (
      await ctx.db
        .query("gameEvents")
        .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
        .collect()
    )
      .filter((event) => event.eventType === "MAFIA_FAILED_ELIMINATION")
      .map((event) => {
        return {
          round: event.round,
          protectionBlocked: true,
        };
      });

    const mafiaResultByRound = new Map(
      mafiaVoteResults.map((result) => [result.round, result]),
    );

    return actions.map((action) => {
      const target = action.targetId
        ? allPlayers.find((player) => player._id === action.targetId)
        : null;
      const targetUser = target ? userById.get(target.userId) : null;
      const mafiaResult = mafiaResultByRound.get(action.round);

      return {
        round: action.round,
        targetPlayerId: action.targetId,
        targetUsername: targetUser?.username ?? targetUser?.name ?? "Unknown",
        targetAvatarUrl: targetUser?.image,
        outcome: mafiaResult?.protectionBlocked ? "successful" : "not_used",
        timestamp: action.timestamp,
      };
    });
  },
});
