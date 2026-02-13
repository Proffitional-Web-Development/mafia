import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

import type { QueryCtx, MutationCtx } from "../_generated/server";

export async function requireAuthUserId(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError("Authentication required.");
  }
  return userId;
}

export async function getOptionalAuthUserId(ctx: QueryCtx | MutationCtx) {
  return getAuthUserId(ctx);
}
