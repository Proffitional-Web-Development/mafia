import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getOptionalAuthUserId, requireAuthUserId } from "./lib/auth";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getOptionalAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError("Authenticated user record not found.");
    }

    let avatarUrl = user.image;
    if (user.avatarStorageId) {
      const storageUrl = await ctx.storage.getUrl(user.avatarStorageId);
      if (storageUrl) {
        avatarUrl = storageUrl;
      }
    }

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      displayName: user.displayName,
      username: user.username,
      avatarUrl,
      hasCompletedProfile: Boolean(user.displayName),
      stats: user.stats ?? {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
      },
      musicEnabled: user.musicEnabled ?? true,
      themeColor: user.themeColor ?? null,
    };
  },
});

export const updateDisplayName = mutation({
  args: {
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const displayName = args.displayName.trim();

    if (displayName.length < 3 || displayName.length > 32) {
      throw new ConvexError(
        "Display name must be between 3 and 32 characters.",
      );
    }

    await ctx.db.patch(userId, {
      displayName,
    });

    return { success: true };
  },
});

export const toggleMusic = mutation({
  args: {
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await ctx.db.patch(userId, {
      musicEnabled: args.enabled,
    });
    return { success: true };
  },
});

export const getAuthMethod = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getOptionalAuthUserId(ctx);
    if (!userId) return null;

    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .first();

    if (!account) return { method: "oauth" }; // Default or unknown

    return {
      method: account.provider === "password" ? "password" : "oauth",
    };
  },
});

/*
 * Note on changePassword:
 * Direct password updates are not supported via a simple mutation because
 * we leverage @convex-dev/auth which handles password hashing internally.
 * To change a password, the frontend should use the `signIn` flow with
 * `flow: "reset"` or trigger a password reset email if configured.
 * Alternatively, use the `signIn` method with `newPassword` if the provider supports
 * account updates (depends on configuration).
 */

export const completeProfile = mutation({
  args: {
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const displayName = args.displayName.trim(); // basic trim, maybe length check

    if (displayName.length < 3 || displayName.length > 32) {
      throw new ConvexError(
        "Display name must be between 3 and 32 characters.",
      );
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser) {
      throw new ConvexError("Authenticated user record not found.");
    }

    await ctx.db.patch(userId, {
      displayName,
      createdAt: currentUser.createdAt ?? Date.now(),
      stats: currentUser.stats ?? {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
      },
    });

    return { success: true };
  },
});

export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuthUserId(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

export const setAvatarFromStorage = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const storageUrl = await ctx.storage.getUrl(args.storageId);
    if (!storageUrl) {
      throw new ConvexError("Uploaded avatar file could not be resolved.");
    }

    await ctx.db.patch(userId, {
      avatarStorageId: args.storageId,
      image: storageUrl,
    });

    return { success: true };
  },
});

export const setThemeColor = mutation({
  args: {
    themeColor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    if (args.themeColor !== null) {
      if (!/^#[0-9a-fA-F]{6}$/.test(args.themeColor)) {
        throw new ConvexError("Invalid hex color code.");
      }
    }

    await ctx.db.patch(userId, {
      themeColor: args.themeColor,
    });

    return { success: true };
  },
});
