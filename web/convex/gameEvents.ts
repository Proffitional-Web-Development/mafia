import { ConvexError, v } from "convex/values";
import { MutationCtx, query } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";
import { GameEventType, pickRandomTemplate } from "./gameEventTemplates";
import { Id } from "./_generated/dataModel";

type EventParamsByType = {
    VOTE_ELIMINATION: { player: string };
    MAFIA_ELIMINATION: { player: string };
    MAFIA_FAILED_ELIMINATION: { player: string };
    SHEIKH_INVESTIGATION_CITIZEN: { player: string };
    SHEIKH_INVESTIGATION_MAFIA: { player: string };
    ROUND_END: { round: number };
    VOTE_TIE: { players: string };
    MAFIA_VOTE_TIE_RANDOM: { player: string };
};

type PublicGameEventType = Exclude<
    GameEventType,
    "SHEIKH_INVESTIGATION_CITIZEN" | "SHEIKH_INVESTIGATION_MAFIA"
> | "SHEIKH_INVESTIGATION";

function getPublicMessageKey(eventType: GameEventType, messageKey: string) {
    if (
        eventType === "SHEIKH_INVESTIGATION_CITIZEN" ||
        eventType === "SHEIKH_INVESTIGATION_MAFIA"
    ) {
        return messageKey.replace(
            "SHEIKH_INVESTIGATION_MAFIA",
            "SHEIKH_INVESTIGATION_CITIZEN",
        );
    }
    return messageKey;
}

function sanitizePublicParams(
    eventType: GameEventType,
    params: unknown,
): Record<string, unknown> | undefined {
    if (!params || typeof params !== "object") return undefined;
    const payload = params as Record<string, unknown>;

    if (
        eventType === "VOTE_ELIMINATION" ||
        eventType === "MAFIA_ELIMINATION" ||
        eventType === "MAFIA_FAILED_ELIMINATION" ||
        eventType === "SHEIKH_INVESTIGATION_CITIZEN" ||
        eventType === "SHEIKH_INVESTIGATION_MAFIA" ||
        eventType === "MAFIA_VOTE_TIE_RANDOM"
    ) {
        return typeof payload.player === "string"
            ? { player: payload.player }
            : undefined;
    }

    if (eventType === "ROUND_END") {
        return typeof payload.round === "number"
            ? { round: payload.round }
            : undefined;
    }

    if (eventType === "VOTE_TIE") {
        return typeof payload.players === "string"
            ? { players: payload.players }
            : undefined;
    }

    return undefined;
}

function warnIfPotentialLeak(
    eventType: GameEventType,
    messageKey: string,
    params?: Record<string, unknown>,
) {
    const containsRoleOrFaction = (value: unknown) =>
        typeof value === "string" &&
        /(\bmafia\b|\bcitizen\b|\bsheikh\b|\bgirl\b|مافيا|مواطن|شيخ|فتاة)/i.test(value);

    if (
        (eventType === "SHEIKH_INVESTIGATION_CITIZEN" ||
            eventType === "SHEIKH_INVESTIGATION_MAFIA") &&
        /MAFIA/i.test(messageKey)
    ) {
        console.warn(
            `[gameEvents] Potential leak: Sheikh investigation messageKey may expose faction (${messageKey}).`,
        );
    }

    if (eventType === "MAFIA_FAILED_ELIMINATION" && /girl|فتاة/i.test(messageKey)) {
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
    }[GameEventType]
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
    warnIfPotentialLeak(eventType, publicMessageKey, params);

    await ctx.db.insert("gameEvents", {
        gameId,
        eventType,
        resolvedMessage: publicMessageKey,
        messageKey: publicMessageKey,
        messageParams: params,
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
                q.eq("gameId", args.gameId).eq("userId", userId)
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
            .filter((e) => Boolean(e.eventType) && Boolean(e.messageKey))
            .map((e) => {
            let safeType: PublicGameEventType = e.eventType;
            if (
                e.eventType === "SHEIKH_INVESTIGATION_CITIZEN" ||
                e.eventType === "SHEIKH_INVESTIGATION_MAFIA"
            ) {
                safeType = "SHEIKH_INVESTIGATION";
            }
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
