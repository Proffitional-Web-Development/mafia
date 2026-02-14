/**
 * Rate limiter for Convex mutations.
 *
 * Implements a sliding-window counter stored in a dedicated table.
 * Each key (typically `userId:action`) is tracked with a count and
 * window start timestamp. When the limit is exceeded a ConvexError
 * is thrown.
 *
 * Usage:
 *   import { rateLimit } from "./lib/rateLimiter";
 *   // In a mutation handler:
 *   await rateLimit(ctx, {
 *     key: `${userId}:createRoom`,
 *     limit: 5,
 *     windowMs: 60_000, // 5 per minute
 *   });
 */

import { ConvexError } from "convex/values";
import type { GenericMutationCtx, GenericDataModel } from "convex/server";

interface RateLimitOpts {
  /** Unique key, e.g. `userId:action` */
  key: string;
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

/**
 * Enforce a rate limit.
 * Uses the `rateLimits` table to track request counts per key/window.
 * Throws ConvexError("RATE_LIMITED") if the limit is exceeded.
 */
export async function rateLimit(
  ctx: GenericMutationCtx<GenericDataModel>,
  opts: RateLimitOpts,
) {
  const now = Date.now();
  const { key, limit, windowMs } = opts;

  const existing = await (ctx.db as any)
    .query("rateLimits")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .unique();

  if (!existing) {
    // First request — create entry
    await (ctx.db as any).insert("rateLimits", {
      key,
      count: 1,
      windowStart: now,
    });
    return;
  }

  // If the window has expired, reset
  if (now - existing.windowStart > windowMs) {
    await (ctx.db as any).patch(existing._id, {
      count: 1,
      windowStart: now,
    });
    return;
  }

  // Window is active — check limit
  if (existing.count >= limit) {
    throw new ConvexError("RATE_LIMITED");
  }

  // Increment counter
  await (ctx.db as any).patch(existing._id, {
    count: existing.count + 1,
  });
}
