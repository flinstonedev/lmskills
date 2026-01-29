import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { assertValidEmail, assertValidHandle, isValidHandle, normalizeHandle } from "./validation";
import { enforceRateLimitWithDb, logSecurityEvent } from "./security";

const MAX_BIO_LENGTH = 500;
const PROFILE_RATE_LIMIT = { limit: 5, windowMs: 60_000 };

function toPublicUser(user: Doc<"users"> | null) {
  if (!user) return null;
  return {
    handle: user.handle,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// Internal query to get user by Clerk ID (server-side only)
export const getUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Query to get user by handle
export const getUserByHandle = query({
  args: { handle: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_handle", (q) => q.eq("handle", args.handle))
      .first();
    // Public profile: never expose email or Clerk identifiers.
    return toPublicUser(user);
  },
});

// Query to get current user (from auth context)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    // Return public profile only to avoid exposing email/Clerk IDs to clients.
    return toPublicUser(user);
  },
});

// Internal mutation to create or update user (called by webhook)
export const upsertUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    handle: v.string(),
    avatarUrl: v.optional(v.string()),
    authProvider: v.string(),
  },
  handler: async (ctx, args) => {
    logSecurityEvent("users.upsert_internal", {
      clerkIdPrefix: args.clerkId.slice(0, 8),
      hasEmail: Boolean(args.email),
    });
    assertValidEmail(args.email);
    const normalizedHandle = normalizeHandle(args.handle);
    const safeHandle = isValidHandle(normalizedHandle)
      ? normalizedHandle
      : `user-${args.clerkId.slice(0, 8)}`;
    if (!isValidHandle(safeHandle)) {
      logSecurityEvent("user.handle_invalid", {
        clerkId: args.clerkId,
        source: "upsertUser",
      });
      throw new Error("Invalid handle");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    const now = Date.now();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        handle: safeHandle,
        avatarUrl: args.avatarUrl,
        authProvider: args.authProvider,
        updatedAt: now,
      });
      return existingUser._id;
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        handle: safeHandle,
        avatarUrl: args.avatarUrl,
        authProvider: args.authProvider,
        bio: undefined,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Mutation to update user profile
export const updateProfile = mutation({
  args: {
    handle: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Input validation
    if (args.handle !== undefined) {
      assertValidHandle(args.handle);
    }
    if (args.bio !== undefined && args.bio.length > MAX_BIO_LENGTH) {
      throw new Error("Bio is too long (max 500 characters)");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    await enforceRateLimitWithDb(ctx, {
      key: `user:${identity.subject}:updateProfile`,
      ...PROFILE_RATE_LIMIT,
    });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if handle is taken (if changing handle)
    if (args.handle && args.handle !== user.handle) {
      const newHandle = args.handle; // Extract to const for type narrowing
      const existingHandle = await ctx.db
        .query("users")
        .withIndex("by_handle", (q) => q.eq("handle", newHandle))
        .first();

      if (existingHandle) {
        throw new Error("Handle already taken");
      }
    }

    await ctx.db.patch(user._id, {
      ...(args.handle && { handle: args.handle }),
      ...(args.bio !== undefined && { bio: args.bio }),
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

// Internal mutation to delete user (called by webhook)
export const deleteUser = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    logSecurityEvent("users.delete_internal", {
      clerkIdPrefix: args.clerkId.slice(0, 8),
    });
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});
