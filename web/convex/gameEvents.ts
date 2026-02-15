import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, query } from "./_generated/server";
import { type GameEventType, pickRandomTemplate } from "./gameEventTemplates";
import { requireAuthUserId } from "./lib/auth";

type EventParamsByType = {
  VOTE_ELIMINATION: { player: string };
  MAFIA_ELIMINATION: { player: string };
  MAFIA_FAILED_ELIMINATION: Record<string, never>;
  SHEIKH_INVESTIGATION_CITIZEN: Record<string, never>;
  SHEIKH_INVESTIGATION_MAFIA: Record<string, never>;
  ROUND_END: { round: number };
  VOTE_TIE: { players: string };
  MAFIA_VOTE_TIE_RANDOM: { player: string };
  OWNER_PROMOTED_COORDINATOR: Record<string, never>;
};

type PublicGameEventType =
  | Exclude<
    GameEventType,
    "SHEIKH_INVESTIGATION_CITIZEN" | "SHEIKH_INVESTIGATION_MAFIA"
  >
  | "SHEIKH_INVESTIGATION";

type RoundSummaryEventType =
  | PublicGameEventType
  | "SHEIKH_INVESTIGATION_CITIZEN"
  | "SHEIKH_INVESTIGATION_MAFIA"
  | "GIRL_PROTECTION";

type RoundSummaryEvent = {
  eventId: string;
  eventType: RoundSummaryEventType;
  messageKey: string;
  messageParams?: Record<string, unknown>;
  round: number;
  timestamp: number;
  memeLevel: "NORMAL" | "FUN" | "CHAOS";
};

function getPublicMessageKey(eventType: GameEventType, messageKey: string) {
  if (
    eventType === "SHEIKH_INVESTIGATION_CITIZEN" ||
    eventType === "SHEIKH_INVESTIGATION_MAFIA"
  ) {
    return messageKey
      .replace("SHEIKH_INVESTIGATION_CITIZEN", "SHEIKH_INVESTIGATION")
      .replace("SHEIKH_INVESTIGATION_MAFIA", "SHEIKH_INVESTIGATION");
  }
  return messageKey;
}

function sanitizePublicParams(
  eventType: GameEventType,
  params: unknown,
): Record<string, unknown> | undefined {
  if (!params || typeof params !== "object") return undefined;
  const payload = params as Record<string, unknown>;

  const safeKeysByEvent: Partial<Record<GameEventType, string[]>> = {
    VOTE_ELIMINATION: ["player"],
    MAFIA_ELIMINATION: ["player"],
    MAFIA_VOTE_TIE_RANDOM: ["player"],
    ROUND_END: ["round"],
    VOTE_TIE: ["players"],
    OWNER_PROMOTED_COORDINATOR: [],
  };

  const safeKeys = safeKeysByEvent[eventType] ?? [];
  if (safeKeys.length === 0) {
    return undefined;
  }

  const sanitized: Record<string, unknown> = {};
  for (const key of safeKeys) {
    const value = payload[key];
    if (typeof value === "string" || typeof value === "number") {
      sanitized[key] = value;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function warnIfPotentialLeak(
  eventType: GameEventType,
  messageKey: string,
  params?: Record<string, unknown>,
) {
  const containsRoleOrFaction = (value: unknown) =>
    typeof value === "string" &&
    /(\bmafia\b|\bcitizen\b|\bsheikh\b|\bgirl\b|مافيا|مواطن|شيخ|فتاة)/i.test(
      value,
    );

  if (
    (eventType === "SHEIKH_INVESTIGATION_CITIZEN" ||
      eventType === "SHEIKH_INVESTIGATION_MAFIA") &&
    /MAFIA/i.test(messageKey)
  ) {
    console.warn(
      `[gameEvents] Potential leak: Sheikh investigation messageKey may expose faction (${messageKey}).`,
    );
  }

  if (
    eventType === "MAFIA_FAILED_ELIMINATION" &&
    /girl|فتاة/i.test(messageKey)
  ) {
    console.warn(
      `[gameEvents] Potential leak: Mafia failed elimination messageKey references Girl (${messageKey}).`,
    );
  }

  if (params && Object.values(params).some(containsRoleOrFaction)) {
    console.warn(
      `[gameEvents] Potential leak: messageParams contain role/faction keywords for ${eventType}.`,
    );
  }
}

/**
 * Internal helper to log a game event.
 * Not exposed as a public mutation.
 */
export async function logGameEvent(
  ctx: MutationCtx,
  args: {
    [K in GameEventType]: {
      gameId: Id<"games">;
      eventType: K;
      params: EventParamsByType[K];
    };
  }[GameEventType],
) {
  const { gameId, eventType, params } = args;
  const game = await ctx.db.get(gameId);
  if (!game) return;

  const room = await ctx.db.get(game.roomId);
  if (!room) return;

  // Default to FUN if not set (matches schema default idea, though schema is optional)
  const memeLevel = room.memeLevel || "FUN";
  const messageKey = pickRandomTemplate(eventType, memeLevel);
  const publicMessageKey = getPublicMessageKey(eventType, messageKey);
  const safeParams = sanitizePublicParams(eventType, params);
  warnIfPotentialLeak(eventType, publicMessageKey, safeParams);

  await ctx.db.insert("gameEvents", {
    gameId,
    eventType,
    resolvedMessage: publicMessageKey,
    messageKey: publicMessageKey,
    messageParams: safeParams,
    round: game.round,
    timestamp: Date.now(),
    memeLevel,
  });
}

export const getGameEvents = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    // 1. Auth check
    const userId = await requireAuthUserId(ctx);

    // 2. Check if user is a player in this game
    const player = await ctx.db
      .query("players")
      .withIndex("by_gameId_userId", (q) =>
        q.eq("gameId", args.gameId).eq("userId", userId),
      )
      .first();

    if (!player) {
      throw new ConvexError("You are not a player in this game.");
    }

    // 3. Fetch events
    const events = await ctx.db
      .query("gameEvents")
      .withIndex("by_gameId_timestamp", (q) => q.eq("gameId", args.gameId))
      .order("desc") // Newest first
      .collect();

    return events
      .filter(
        (e): e is typeof e & { eventType: GameEventType; messageKey: string } =>
          Boolean(e.eventType) && Boolean(e.messageKey),
      )
      .map((e) => {
        const safeType: PublicGameEventType =
          e.eventType === "SHEIKH_INVESTIGATION_CITIZEN" ||
            e.eventType === "SHEIKH_INVESTIGATION_MAFIA"
            ? "SHEIKH_INVESTIGATION"
            : e.eventType;
        return {
          eventType: safeType,
          messageKey: getPublicMessageKey(e.eventType, e.messageKey),
          messageParams: sanitizePublicParams(e.eventType, e.messageParams),
          round: e.round,
          timestamp: e.timestamp,
          memeLevel: e.memeLevel ?? "FUN",
          _id: e._id,
        };
      });
  },
});

export const getRoundSummary = query({
  args: {
    gameId: v.id("games"),
    round: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    const player = await ctx.db
      .query("players")
      .withIndex("by_gameId_userId", (q) =>
        q.eq("gameId", args.gameId).eq("userId", userId),
      )
      .first();

    if (!player) {
      throw new ConvexError("You are not a player in this game.");
    }

    const isSheikh = player.role === "sheikh";
    const isGirl = player.role === "girl";

    const roundEvents = await ctx.db
      .query("gameEvents")
      .withIndex("by_gameId_round", (q) =>
        q.eq("gameId", args.gameId).eq("round", args.round),
      )
      .collect();

    const summarizedEvents: RoundSummaryEvent[] = roundEvents
      .filter(
        (e): e is typeof e & { eventType: GameEventType; messageKey: string } =>
          Boolean(e.eventType) && Boolean(e.messageKey),
      )
      .map((e) => {
        const isSheikhInvestigation =
          e.eventType === "SHEIKH_INVESTIGATION_CITIZEN" ||
          e.eventType === "SHEIKH_INVESTIGATION_MAFIA";

        if (isSheikhInvestigation && isSheikh) {
          const sheikhMessageKey = e.messageKey.replace(
            "SHEIKH_INVESTIGATION",
            e.eventType,
          );

          return {
            eventId: String(e._id),
            eventType: e.eventType,
            messageKey: sheikhMessageKey,
            messageParams:
              e.messageParams && typeof e.messageParams === "object"
                ? (e.messageParams as Record<string, unknown>)
                : undefined,
            round: e.round,
            timestamp: e.timestamp,
            memeLevel: e.memeLevel ?? "FUN",
          };
        }

        const safeType: PublicGameEventType =
          e.eventType === "SHEIKH_INVESTIGATION_CITIZEN" ||
            e.eventType === "SHEIKH_INVESTIGATION_MAFIA"
            ? "SHEIKH_INVESTIGATION"
            : e.eventType;

        return {
          eventId: String(e._id),
          eventType: safeType,
          messageKey: getPublicMessageKey(e.eventType, e.messageKey),
          messageParams: sanitizePublicParams(e.eventType, e.messageParams),
          round: e.round,
          timestamp: e.timestamp,
          memeLevel: e.memeLevel ?? "FUN",
        };
      });

    if (isGirl) {
      const girlAction = await ctx.db
        .query("actions")
        .withIndex("by_gameId_round_actorId", (q) =>
          q
            .eq("gameId", args.gameId)
            .eq("round", args.round)
            .eq("actorId", player._id),
        )
        .first();

      if (girlAction && girlAction.role === "girl") {
        summarizedEvents.push({
          eventId: `girl-protection-${args.gameId}-${args.round}-${String(girlAction._id)}`,
          eventType: "GIRL_PROTECTION",
          messageKey: "events.GIRL_PROTECTION.summary",
          messageParams: undefined,
          round: args.round,
          timestamp: girlAction.timestamp,
          memeLevel: "FUN" as const,
        });
      }
    }

    return summarizedEvents.sort((a, b) => a.timestamp - b.timestamp);
  },
});
