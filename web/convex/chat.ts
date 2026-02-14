import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import {
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import {
  CHAT_TEMPLATES,
  getTemplatesForChannel,
  resolveTemplateFallback,
  TEMPLATE_KEY_SET,
} from "./chatTemplates";
import { requireAuthUserId } from "./lib/auth";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CONTENT_LENGTH = 500;
const RATE_LIMIT_WINDOW_MS = 10_000; // 10 seconds
const RATE_LIMIT_MAX_MESSAGES = 5;
const MAX_MESSAGES_RETURNED = 100;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getPlayerInGame(
  ctx: QueryCtx | MutationCtx,
  gameId: Id<"games">,
  userId: Id<"users">,
) {
  return ctx.db
    .query("players")
    .withIndex("by_gameId_userId", (q) =>
      q.eq("gameId", gameId).eq("userId", userId),
    )
    .first();
}

async function checkRateLimit(
  ctx: MutationCtx,
  gameId: Id<"games">,
  senderId: Id<"users">,
) {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;

  // Fetch recent messages by this sender in this game
  const recentMessages = await ctx.db
    .query("chatMessages")
    .withIndex("by_gameId_timestamp", (q) =>
      q.eq("gameId", gameId).gte("timestamp", cutoff),
    )
    .collect();

  const senderMessages = recentMessages.filter(
    (msg) => msg.senderId === senderId,
  );

  if (senderMessages.length >= RATE_LIMIT_MAX_MESSAGES) {
    throw new ConvexError("RATE_LIMITED");
  }
}

// ---------------------------------------------------------------------------
// sendChatMessage — send a chat message (text or template)
// ---------------------------------------------------------------------------

const VALID_VOICE_KEYS = new Set([
  "ya_patl",
  "7hl_3ne",
  "lh_lh_lh",
  "lk_mbsoot",
  "lk_3la_meen",
  "laaa",
]);

// ---------------------------------------------------------------------------
// sendChatMessage — send a chat message (text, template, or voice)
// ---------------------------------------------------------------------------

export const sendChatMessage = mutation({
  args: {
    gameId: v.id("games"),
    channel: v.union(v.literal("public"), v.literal("mafia")),
    // Free-form text message
    content: v.optional(v.string()),
    // Template message
    templateKey: v.optional(v.string()),
    templateParams: v.optional(v.any()),
    // Anonymous mode
    anonymous: v.optional(v.boolean()),
    // Voice Message
    voiceClipKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    // ── Validate game exists ────────────────────────────────────────────
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found.");

    // ── Validate caller is a player ─────────────────────────────────────
    const player = await getPlayerInGame(ctx, args.gameId, userId);
    if (!player) throw new ConvexError("You are not a player in this game.");

    // ── Dead players cannot send ────────────────────────────────────────
    if (!player.isAlive) {
      throw new ConvexError("Eliminated players cannot send messages.");
    }

    // ── Channel-specific permission checks ──────────────────────────────
    if (args.channel === "mafia") {
      if (player.role !== "mafia") {
        throw new ConvexError("NOT_MAFIA_MEMBER");
      }
      // Anonymous not allowed in mafia channel
      if (args.anonymous) {
        throw new ConvexError("ANONYMOUS_NOT_ALLOWED");
      }
    }

    if (args.channel === "public") {
      // Check if chat is muted at game level
      if (game.chatMuted) {
        throw new ConvexError("CHAT_MUTED");
      }

      // Check if chat is enabled at room level
      const room = await ctx.db.get(game.roomId);
      if (room && room.settings.chatEnabled === false) {
        throw new ConvexError("Chat is disabled by the room owner.");
      }
    }

    // ── Anonymous Validation ────────────────────────────────────────────
    if (args.anonymous) {
      if (player.role !== "mafia") {
        throw new ConvexError("ANONYMOUS_NOT_ALLOWED");
      }
      if (args.channel !== "public") {
        // redundancy check, already covered above but good for safety
        throw new ConvexError("ANONYMOUS_NOT_ALLOWED");
      }
    }

    // ── Rate limit ──────────────────────────────────────────────────────
    await checkRateLimit(ctx, args.gameId, userId);

    // ── Build message content ───────────────────────────────────────────
    let content: string;
    let isTemplate = false;
    let templateKey: string | undefined;
    let templateParams: Record<string, string> | undefined;
    let isVoice = false;
    let voiceClipKey: string | undefined;

    if (args.voiceClipKey) {
      // Voice Message
      if (!VALID_VOICE_KEYS.has(args.voiceClipKey)) {
        throw new ConvexError("INVALID_VOICE_CLIP");
      }
      isVoice = true;
      voiceClipKey = args.voiceClipKey;
      content = "🔊 Voice message"; // Fallback text
    } else if (args.templateKey) {
      // Template message
      if (!TEMPLATE_KEY_SET.has(args.templateKey)) {
        throw new ConvexError("Invalid template key.");
      }

      const template = CHAT_TEMPLATES.find((t) => t.key === args.templateKey);
      if (!template) throw new ConvexError("Template not found.");

      // Validate template is allowed in this channel
      if (!template.channels.includes(args.channel)) {
        throw new ConvexError("Template not available for this channel.");
      }

      templateKey = args.templateKey;
      templateParams = (args.templateParams as Record<string, string>) ?? {};
      content = resolveTemplateFallback(template, templateParams);
      isTemplate = true;
    } else if (args.content) {
      // Free-form text message
      content = args.content.trim();
      if (content.length === 0) {
        throw new ConvexError("Message cannot be empty.");
      }
      if (content.length > MAX_CONTENT_LENGTH) {
        throw new ConvexError(
          `Message cannot exceed ${MAX_CONTENT_LENGTH} characters.`,
        );
      }
    } else {
      throw new ConvexError(
        "One of content, templateKey, or voiceClipKey must be provided.",
      );
    }

    // ── Resolve Sender Info ─────────────────────────────────────────────
    let senderUsername: string;
    let isAnonymous = false;
    let anonymousAlias: string | undefined;

    if (args.anonymous) {
      senderUsername = "MAFIA";
      isAnonymous = true;
      anonymousAlias = "MAFIA";
    } else {
      const user = await ctx.db.get(userId);
      senderUsername = user?.username ?? "Unknown";
    }

    // ── Insert message ──────────────────────────────────────────────────
    const messageId = await ctx.db.insert("chatMessages", {
      gameId: args.gameId,
      channel: args.channel,
      senderId: userId, // Real sender ID as per Option A
      realSenderId: userId, // Redundant but requested
      senderUsername,
      content,
      isTemplate: isTemplate || undefined,
      templateKey,
      templateParams,
      isAnonymous: isAnonymous || undefined,
      anonymousAlias,
      isVoice: isVoice || undefined,
      voiceClipKey,
      timestamp: Date.now(),
    });

    return { messageId };
  },
});

// ---------------------------------------------------------------------------
// getChatMessages — retrieve messages for a channel
// ---------------------------------------------------------------------------

export const getChatMessages = query({
  args: {
    gameId: v.id("games"),
    channel: v.union(v.literal("public"), v.literal("mafia")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    // Validate game exists
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found.");

    // Validate caller is a player
    const player = await getPlayerInGame(ctx, args.gameId, userId);
    if (!player) throw new ConvexError("You are not a player in this game.");

    // Mafia channel: silently return empty for non-mafia (no error to avoid
    // leaking channel existence)
    if (args.channel === "mafia" && player.role !== "mafia") {
      return [];
    }

    // Fetch messages ordered by timestamp (newest last)
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_gameId_channel", (q) =>
        q.eq("gameId", args.gameId).eq("channel", args.channel),
      )
      .order("asc")
      .take(MAX_MESSAGES_RETURNED);

    return messages.map((msg) => {
      // Hide identity for anonymous messages in public channel
      if (msg.isAnonymous && msg.channel === "public") {
        return {
          _id: msg._id,
          senderId: null, // Hide real sender
          senderUsername: msg.anonymousAlias ?? "MAFIA",
          content: msg.content,
          isTemplate: msg.isTemplate,
          templateKey: msg.templateKey,
          templateParams: msg.templateParams,
          timestamp: msg.timestamp,
          channel: msg.channel,
          isAnonymous: true,
          anonymousAlias: msg.anonymousAlias,
          isVoice: msg.isVoice,
          voiceClipKey: msg.voiceClipKey,
        };
      }

      return {
        _id: msg._id,
        senderId: msg.senderId,
        senderUsername: msg.senderUsername,
        content: msg.content,
        isTemplate: msg.isTemplate,
        templateKey: msg.templateKey,
        templateParams: msg.templateParams,
        timestamp: msg.timestamp,
        channel: msg.channel,
        isAnonymous: msg.isAnonymous, // Just validation, likely undefined or false
        anonymousAlias: msg.anonymousAlias,
        isVoice: msg.isVoice,
        voiceClipKey: msg.voiceClipKey,
      };
    });
  },
});

// ---------------------------------------------------------------------------
// toggleChat — owner-only: enable/disable public chat
// ---------------------------------------------------------------------------

export const toggleChat = mutation({
  args: {
    roomId: v.id("rooms"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new ConvexError("Room not found.");
    if (room.ownerId !== userId) {
      throw new ConvexError("Only the room owner can toggle chat.");
    }

    await ctx.db.patch(args.roomId, {
      settings: {
        ...room.settings,
        chatEnabled: args.enabled,
      },
    });

    return { success: true };
  },
});

// ---------------------------------------------------------------------------
// muteAllChat — owner-only: mute/unmute all public chat
// ---------------------------------------------------------------------------

export const muteAllChat = mutation({
  args: {
    gameId: v.id("games"),
    muted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found.");

    // Verify caller is room owner
    const room = await ctx.db.get(game.roomId);
    if (!room) throw new ConvexError("Room not found.");
    if (room.ownerId !== userId) {
      throw new ConvexError("Only the room owner can mute/unmute chat.");
    }

    await ctx.db.patch(args.gameId, {
      chatMuted: args.muted,
    });

    return { success: true };
  },
});

// ---------------------------------------------------------------------------
// getTemplates — return available templates for the caller's role & channel
// ---------------------------------------------------------------------------

export const getTemplates = query({
  args: {
    gameId: v.id("games"),
    channel: v.union(v.literal("public"), v.literal("mafia")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found.");

    const player = await getPlayerInGame(ctx, args.gameId, userId);
    if (!player) throw new ConvexError("You are not a player in this game.");

    // Mafia channel templates only for mafia players
    if (args.channel === "mafia" && player.role !== "mafia") {
      return [];
    }

    const templates = getTemplatesForChannel(args.channel);
    return templates.map((t) => ({
      key: t.key,
      placeholders: t.placeholders,
      fallbackEn: t.fallbackEn,
    }));
  },
});

// ---------------------------------------------------------------------------
// getChatState — helper query for UI to check chat enabled/muted status
// ---------------------------------------------------------------------------

export const getChatState = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found.");

    const player = await getPlayerInGame(ctx, args.gameId, userId);
    if (!player) throw new ConvexError("You are not a player in this game.");

    const room = await ctx.db.get(game.roomId);
    const chatEnabled = room?.settings.chatEnabled !== false;
    const chatMuted = game.chatMuted === true;
    const isMafia = player.role === "mafia";
    const isAlive = player.isAlive;

    return {
      chatEnabled,
      chatMuted,
      isMafia,
      isAlive,
    };
  },
});
