import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, query } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";

function toFaction(role: Doc<"players">["role"]): "mafia" | "citizens" {
  return role === "mafia" ? "mafia" : "citizens";
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

  const sheikhDone =
    !hasAliveSheikh || actionsThisRound.some((a) => a.role === "sheikh");
  const girlDone =
    !hasAliveGirl || actionsThisRound.some((a) => a.role === "girl");

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
      timestamp: now,
    });

    await ctx.db.insert("gameEvents", {
      gameId: args.gameId,
      round: game.round,
      type: "sheikh_investigated",
      payload: JSON.stringify({ actorId: actor._id }),
      timestamp: now,
    });

    await maybeCompleteAbilityPhase(ctx, args.gameId);

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
      timestamp: now,
    });

    await ctx.db.insert("gameEvents", {
      gameId: args.gameId,
      round: game.round,
      type: "girl_protected",
      payload: JSON.stringify({ actorId: actor._id }),
      timestamp: now,
    });

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
          sheikhAction?.actorId === me._id
            ? sheikhAction.result === "mafia"
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
