import { v } from "convex/values";
import type { GenericMutationCtx } from "convex/server";
import { internalMutation } from "./_generated/server";
import type { DataModel } from "./_generated/dataModel";

type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
};

function getWindowStart(now: number, windowMs: number) {
  return Math.floor(now / windowMs) * windowMs;
}

export function logSecurityEvent(event: string, details: Record<string, string | number | boolean | null>) {
  const payload = {
    event,
    ...details,
    timestamp: new Date().toISOString(),
  };
  console.warn(`[security] ${JSON.stringify(payload)}`);
}

export async function enforceRateLimitWithDb(ctx: GenericMutationCtx<DataModel>, config: RateLimitConfig) {
  const now = Date.now();
  const windowStart = getWindowStart(now, config.windowMs);
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", config.key))
    .first();

  if (!existing || existing.windowStart !== windowStart) {
    if (existing) {
      await ctx.db.patch(existing._id, {
        windowStart,
        count: 1,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("rateLimits", {
        key: config.key,
        windowStart,
        count: 1,
        updatedAt: now,
      });
    }
    return;
  }

  if (existing.count >= config.limit) {
    throw new Error("Rate limit exceeded");
  }

  await ctx.db.patch(existing._id, {
    count: existing.count + 1,
    updatedAt: now,
  });
}

export const enforceRateLimit = internalMutation({
  args: {
    key: v.string(),
    limit: v.number(),
    windowMs: v.number(),
  },
  handler: async (ctx, args) => {
    await enforceRateLimitWithDb(ctx, args);
  },
});
