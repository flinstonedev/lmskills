import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Submit a new skill
 */
export const submitSkill = mutation({
  args: {
    repoUrl: v.string(),
    name: v.string(),
    description: v.string(),
    license: v.optional(v.string()),
    skillMdContent: v.string(),
    stars: v.number(),
    lastSyncedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if skill with this repo URL already exists
    const existingSkill = await ctx.db
      .query("skills")
      .withIndex("by_repo_url", (q) => q.eq("repoUrl", args.repoUrl))
      .first();

    if (existingSkill) {
      throw new Error("A skill from this repository has already been submitted");
    }

    const now = Date.now();

    // Create the skill
    const skillId = await ctx.db.insert("skills", {
      repoUrl: args.repoUrl,
      name: args.name,
      description: args.description,
      license: args.license,
      skillMdContent: args.skillMdContent,
      stars: args.stars,
      ownerUserId: user._id,
      visibility: "public",
      lastSyncedAt: args.lastSyncedAt,
      createdAt: now,
      updatedAt: now,
    });

    return skillId;
  },
});

/**
 * Get all skills (paginated) with optional search
 */
export const listSkills = query({
  args: {
    limit: v.optional(v.number()),
    query: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // If there's a search query, filter results
    if (args.query && args.query.trim()) {
      const searchQuery = args.query.toLowerCase();

      const allSkills = await ctx.db
        .query("skills")
        .withIndex("by_created_at")
        .order("desc")
        .collect();

      const filtered = allSkills.filter(
        (skill) =>
          skill.name.toLowerCase().includes(searchQuery) ||
          skill.description.toLowerCase().includes(searchQuery)
      );

      const limited = filtered.slice(0, limit);

      const skillsWithOwners = await Promise.all(
        limited.map(async (skill) => {
          const owner = await ctx.db.get(skill.ownerUserId);
          return {
            ...skill,
            owner: owner ? {
              handle: owner.handle,
              avatarUrl: owner.avatarUrl,
            } : null,
          };
        })
      );

      return skillsWithOwners;
    }

    // Otherwise, return all skills
    const skills = await ctx.db
      .query("skills")
      .withIndex("by_created_at")
      .order("desc")
      .take(limit);

    // Fetch owner info for each skill
    const skillsWithOwners = await Promise.all(
      skills.map(async (skill) => {
        const owner = await ctx.db.get(skill.ownerUserId);
        return {
          ...skill,
          owner: owner ? {
            handle: owner.handle,
            avatarUrl: owner.avatarUrl,
          } : null,
        };
      })
    );

    return skillsWithOwners;
  },
});

/**
 * Get a single skill by owner and name
 */
export const getSkill = query({
  args: {
    owner: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // First, find the user by handle
    const owner = await ctx.db
      .query("users")
      .withIndex("by_handle", (q) => q.eq("handle", args.owner))
      .first();

    if (!owner) {
      return null;
    }

    // Find the skill by owner and name
    const skills = await ctx.db
      .query("skills")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", owner._id))
      .collect();

    const skill = skills.find((s) => s.name === args.name);

    if (!skill) {
      return null;
    }

    return {
      ...skill,
      owner: {
        handle: owner.handle,
        avatarUrl: owner.avatarUrl,
      },
    };
  },
});

/**
 * Search skills by name or description
 */
export const searchSkills = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const searchQuery = args.query.toLowerCase();

    // Get all skills (we'll implement proper search later with a search index)
    const allSkills = await ctx.db
      .query("skills")
      .withIndex("by_created_at")
      .order("desc")
      .collect();

    // Filter by name or description
    const filtered = allSkills.filter(
      (skill) =>
        skill.name.toLowerCase().includes(searchQuery) ||
        skill.description.toLowerCase().includes(searchQuery)
    );

    // Take only the limit
    const limited = filtered.slice(0, limit);

    // Fetch owner info
    const skillsWithOwners = await Promise.all(
      limited.map(async (skill) => {
        const owner = await ctx.db.get(skill.ownerUserId);
        return {
          ...skill,
          owner: owner ? {
            handle: owner.handle,
            avatarUrl: owner.avatarUrl,
          } : null,
        };
      })
    );

    return skillsWithOwners;
  },
});

/**
 * Get skills by owner (user handle)
 */
export const getSkillsByOwner = query({
  args: {
    ownerHandle: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the user
    const owner = await ctx.db
      .query("users")
      .withIndex("by_handle", (q) => q.eq("handle", args.ownerHandle))
      .first();

    if (!owner) {
      return [];
    }

    // Get their skills
    const skills = await ctx.db
      .query("skills")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", owner._id))
      .collect();

    return skills.map((skill) => ({
      ...skill,
      owner: {
        handle: owner.handle,
        avatarUrl: owner.avatarUrl,
      },
    }));
  },
});

/**
 * Get skills for the current authenticated user
 */
export const getMySkills = query({
  args: {},
  handler: async (ctx) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    // Get their skills
    const skills = await ctx.db
      .query("skills")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", user._id))
      .order("desc")
      .collect();

    // Add owner info to each skill for consistency
    return skills.map((skill) => ({
      ...skill,
      owner: {
        handle: user.handle,
        avatarUrl: user.avatarUrl,
      },
    }));
  },
});

/**
 * Delete a skill (read-only, skills stay synced with GitHub)
 */
export const deleteSkill = mutation({
  args: {
    skillId: v.id("skills"),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the skill
    const skill = await ctx.db.get(args.skillId);
    if (!skill) {
      throw new Error("Skill not found");
    }

    // Check ownership
    if (skill.ownerUserId !== user._id) {
      throw new Error("Not authorized to delete this skill");
    }

    // Delete related data first
    // Delete skill tags
    const skillTags = await ctx.db
      .query("skillTags")
      .withIndex("by_skill", (q) => q.eq("skillId", args.skillId))
      .collect();
    for (const skillTag of skillTags) {
      await ctx.db.delete(skillTag._id);
    }

    // Delete comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_skill", (q) => q.eq("skillId", args.skillId))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete ratings
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_skill", (q) => q.eq("skillId", args.skillId))
      .collect();
    for (const rating of ratings) {
      await ctx.db.delete(rating._id);
    }

    // Delete favorites
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_skill", (q) => q.eq("skillId", args.skillId))
      .collect();
    for (const favorite of favorites) {
      await ctx.db.delete(favorite._id);
    }

    // Finally, delete the skill
    await ctx.db.delete(args.skillId);

    return { success: true };
  },
});
