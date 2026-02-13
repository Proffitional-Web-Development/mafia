import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function validateUsername(username: string) {
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 24) {
    throw new ConvexError("Username must be between 3 and 24 characters.");
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    throw new ConvexError(
      "Username can only include letters, numbers, and underscores."
    );
  }
  return trimmed;
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthUserId(ctx);
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
      username: user.username,
      avatarUrl,
      hasCompletedProfile: Boolean(user.username),
      stats: user.stats ?? {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
      },
    };
  },
});

export const completeProfile = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const username = validateUsername(args.username);
    const usernameLower = normalizeUsername(username);

    const existing = await ctx.db
      .query("users")
      .withIndex("by_usernameLower", (queryBuilder) =>
        queryBuilder.eq("usernameLower", usernameLower)
      )
      .first();

    if (existing && existing._id !== userId) {
      throw new ConvexError("Username is already taken.");
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser) {
      throw new ConvexError("Authenticated user record not found.");
    }

    await ctx.db.patch(userId, {
      username,
      usernameLower,
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
