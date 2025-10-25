import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Query to get user by Clerk ID
export const getUserByClerkId = query({
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
    return await ctx.db
      .query("users")
      .withIndex("by_handle", (q) => q.eq("handle", args.handle))
      .first();
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

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
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
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    const now = Date.now();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        handle: args.handle,
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
        handle: args.handle,
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

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
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});
