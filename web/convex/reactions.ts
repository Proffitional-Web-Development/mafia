import { ConvexError, v } from "convex/values";

import { mutation } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";

// ---------------------------------------------------------------------------
// Allowed emojis — validated server-side to prevent abuse
// ---------------------------------------------------------------------------

export const ALLOWED_EMOJIS = [
  "😂",
  "🤣",
  "😭",
  "😢",
  "😤",
  "😡",
  "😱",
  "🤔",
  "🤨",
  "🧐",
  "😏",
  "😈",
  "👀",
  "🤫",
  "🤥",
  "💀",
  "☠️",
  "🔥",
  "❤️",
  "💔",
  "👍",
  "👎",
  "👏",
  "🙏",
  "✌️",
  "🤞",
  "🫡",
  "🫣",
  "😬",
  "🤡",
] as const;

const ALLOWED_EMOJI_SET = new Set<string>(ALLOWED_EMOJIS);

// ---------------------------------------------------------------------------
// setEmojiReaction – set or clear an emoji reaction during publicVoting
// ---------------------------------------------------------------------------

export const setEmojiReaction = mutation({
  args: {
    gameId: v.id("games"),
    emoji: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    // Validate game exists and is in publicVoting phase
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found.");
    if (game.phase !== "publicVoting") {
      throw new ConvexError(
        "Reactions are only allowed during the voting phase."
      );
    }

    // Validate caller is an alive player in this game
    const player = await ctx.db
      .query("players")
      .withIndex("by_gameId_userId", (q) =>
        q.eq("gameId", args.gameId).eq("userId", userId)
      )
      .first();
    if (!player) throw new ConvexError("You are not a player in this game.");
    if (!player.isAlive)
      throw new ConvexError("Eliminated players cannot react.");

    // Validate emoji is from allowed set (or null to clear)
    if (args.emoji !== null && !ALLOWED_EMOJI_SET.has(args.emoji)) {
      throw new ConvexError("Invalid emoji.");
    }

    await ctx.db.patch(player._id, {
      emojiReaction: args.emoji ?? undefined,
    });

    return { success: true };
  },
});
