import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import type { Doc } from "./_generated/dataModel";
import { enforceRateLimitWithDb, logSecurityEvent } from "./security";

/**
 * Helper: Convert skill to object for list views
 */
function toSkillWithOwner(skill: Doc<"skills">, owner: Doc<"users"> | null) {
  return {
    _id: skill._id,
    name: skill.name,
    description: skill.description ?? "",
    license: skill.license,
    stars: skill.stars,
    repoUrl: skill.repoUrl,
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
    owner: owner ? {
      handle: owner.handle,
      avatarUrl: owner.avatarUrl,
    } : null,
  };
}

// Input validation constants
const MAX_URL_LENGTH = 500;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_LICENSE_LENGTH = 50;
const MAX_SEARCH_QUERY_LENGTH = 200;
const MAX_SLUG_LENGTH = 100;
const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\/tree\/[\w.-]+\/[\w./-]+)?$/;
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
const SUBMIT_RATE_LIMIT = { limit: 5, windowMs: 60_000 };
const DELETE_RATE_LIMIT = { limit: 10, windowMs: 60_000 };
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const MAX_SKILL_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate GitHub URL format
 */
function isValidGitHubUrl(url: string): boolean {
  if (url.includes("..")) return false;
  return GITHUB_URL_PATTERN.test(url);
}

function normalizeSlug(rawSlug: string) {
  return rawSlug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function assertValidSlug(slug: string) {
  if (!slug) {
    throw new Error("Slug is required");
  }
  if (slug.length > MAX_SLUG_LENGTH) {
    throw new Error("Slug is too long");
  }
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error("Slug can only contain lowercase letters, numbers, and hyphens");
  }
}

function sanitizeSearchQuery(query: string) {
  return query.replace(/[\u0000-\u001f\u007f]/g, "").trim();
}

/**
 * Submit a new skill (metadata only - no content stored for security)
 */
export const submitSkill = mutation({
  args: {
    repoUrl: v.string(),
    name: v.string(),
    description: v.string(),
    license: v.optional(v.string()),
    stars: v.number(),
    lastSyncedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Input validation
    if (args.repoUrl.length > MAX_URL_LENGTH) {
      throw new Error("Repository URL is too long");
    }
    if (!isValidGitHubUrl(args.repoUrl)) {
      throw new Error("Invalid GitHub URL format");
    }
    if (args.name.length > MAX_NAME_LENGTH) {
      throw new Error("Skill name is too long");
    }
    if (args.description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error("Description is too long");
    }
    if (args.license && args.license.length > MAX_LICENSE_LENGTH) {
      throw new Error("License is too long");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    await enforceRateLimitWithDb(ctx, {
      key: `user:${identity.subject}:submitSkill`,
      ...SUBMIT_RATE_LIMIT,
    });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const existingSkill = await ctx.db
      .query("skills")
      .withIndex("by_repo_url", (q) => q.eq("repoUrl", args.repoUrl))
      .first();

    if (existingSkill) {
      throw new Error("A skill from this repository has already been submitted");
    }

    const now = Date.now();

    const normalizedSlug = normalizeSlug(args.name);
    assertValidSlug(normalizedSlug);

    const fullName = `${user.handle}/${normalizedSlug}`;
    const existingFullName = await ctx.db
      .query("skills")
      .withIndex("by_full_name", (q) => q.eq("fullName", fullName))
      .first();

    if (existingFullName) {
      throw new Error("A skill with this handle and slug already exists");
    }

    const skillId = await ctx.db.insert("skills", {
      source: "github",
      handle: user.handle,
      slug: normalizedSlug,
      fullName,
      repoUrl: args.repoUrl,
      name: args.name,
      description: args.description,
      license: args.license,
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
 * Create a hosted skill entry
 */
export const createHostedSkill = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    visibility: v.union(v.literal("public"), v.literal("unlisted")),
  },
  handler: async (ctx, args) => {
    if (args.name.length > MAX_NAME_LENGTH) {
      throw new Error("Skill name is too long");
    }
    if (args.description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error("Description is too long");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await enforceRateLimitWithDb(ctx, {
      key: `user:${identity.subject}:createHostedSkill`,
      ...SUBMIT_RATE_LIMIT,
    });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const normalizedSlug = normalizeSlug(args.slug);
    assertValidSlug(normalizedSlug);

    const fullName = `${user.handle}/${normalizedSlug}`;
    const existingSkill = await ctx.db
      .query("skills")
      .withIndex("by_full_name", (q) => q.eq("fullName", fullName))
      .first();

    if (existingSkill) {
      throw new Error("A skill with this handle and slug already exists");
    }

    const now = Date.now();

    const skillId = await ctx.db.insert("skills", {
      source: "hosted",
      handle: user.handle,
      slug: normalizedSlug,
      fullName,
      name: args.name,
      description: args.description,
      ownerUserId: user._id,
      visibility: args.visibility,
      createdAt: now,
      updatedAt: now,
    });

    return skillId;
  },
});

/**
 * Publish a hosted skill version (metadata only)
 */
export const publishSkillVersion = mutation({
  args: {
    skillId: v.id("skills"),
    version: v.string(),
    changelog: v.optional(v.string()),
    storageKey: v.string(),
    contentHash: v.string(),
    sizeBytes: v.number(),
    manifest: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await enforceRateLimitWithDb(ctx, {
      key: `user:${identity.subject}:publishSkillVersion`,
      ...SUBMIT_RATE_LIMIT,
    });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Validate version format (semver)
    if (!SEMVER_PATTERN.test(args.version)) {
      throw new Error("Version must be valid semver");
    }

    // Validate size is non-negative and within limit
    if (args.sizeBytes < 0 || args.sizeBytes > MAX_SKILL_SIZE) {
      throw new Error("sizeBytes must be between 0 and 10MB");
    }

    // Validate contentHash is a valid SHA-256 hex digest
    if (!SHA256_PATTERN.test(args.contentHash)) {
      throw new Error("contentHash must be a valid SHA-256 hex digest");
    }

    // Validate storageKey is non-empty
    if (!args.storageKey || args.storageKey.trim().length === 0) {
      throw new Error("storageKey is required");
    }

    const skill = await ctx.db.get(args.skillId);
    if (!skill) {
      throw new Error("Skill not found");
    }

    if (skill.ownerUserId !== user._id) {
      throw new Error("Not authorized to publish this skill");
    }

    if (skill.source !== "hosted") {
      throw new Error("Only hosted skills can publish versions");
    }

    const existingVersion = await ctx.db
      .query("skillVersions")
      .withIndex("by_skill_and_version", (q) =>
        q.eq("skillId", args.skillId).eq("version", args.version)
      )
      .first();

    if (existingVersion) {
      throw new Error("This version already exists");
    }

    const versionId = await ctx.db.insert("skillVersions", {
      skillId: args.skillId,
      version: args.version,
      changelog: args.changelog,
      storageKey: args.storageKey,
      contentHash: args.contentHash,
      sizeBytes: args.sizeBytes,
      manifest: args.manifest,
      publishedBy: user._id,
      status: "pending",
    });

    return versionId;
  },
});

/**
 * Set the default hosted skill version
 */
export const setDefaultVersion = mutation({
  args: {
    skillId: v.id("skills"),
    versionId: v.id("skillVersions"),
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

    const skill = await ctx.db.get(args.skillId);
    if (!skill) {
      throw new Error("Skill not found");
    }

    if (skill.ownerUserId !== user._id) {
      throw new Error("Not authorized to update this skill");
    }

    const version = await ctx.db.get(args.versionId);
    if (!version || version.skillId !== args.skillId) {
      throw new Error("Skill version not found");
    }

    await ctx.db.patch(args.skillId, {
      defaultVersionId: args.versionId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get a skill by full name with its versions (public-safe)
 * - Sanitizes versions (no storageKey, contentHash)
 * - Respects visibility (unlisted only visible to owner)
 */
export const getSkillWithVersions = query({
  args: {
    fullName: v.string(),
  },
  handler: async (ctx, args) => {
    const skill = await ctx.db
      .query("skills")
      .withIndex("by_full_name", (q) => q.eq("fullName", args.fullName))
      .first();

    if (!skill) {
      return null;
    }

    // Check visibility - unlisted skills only visible to owner
    const identity = await ctx.auth.getUserIdentity();
    const isOwner = identity ? await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first().then(u => u?._id === skill.ownerUserId) : false;

    if (skill.visibility === "unlisted" && !isOwner) {
      return null;
    }

    const versions = await ctx.db
      .query("skillVersions")
      .withIndex("by_skill", (q) => q.eq("skillId", skill._id))
      .collect();

    // Sanitize versions - remove sensitive fields
    const sanitizedVersions = versions.map(v => ({
      _id: v._id,
      skillId: v.skillId,
      version: v.version,
      changelog: v.changelog,
      sizeBytes: v.sizeBytes,
      status: v.status,
      publishedBy: v.publishedBy,
    }));

    return {
      skill,
      versions: sanitizedVersions,
    };
  },
});

/**
 * Get full skill versions with storage keys (owner/internal only)
 */
export const getSkillVersionsInternal = internalQuery({
  args: {
    skillId: v.id("skills"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("skillVersions")
      .withIndex("by_skill", (q) => q.eq("skillId", args.skillId))
      .collect();
  },
});

/**
 * Get a specific skill version
 */
export const getSkillVersion = query({
  args: {
    skillId: v.id("skills"),
    version: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("skillVersions")
      .withIndex("by_skill_and_version", (q) =>
        q.eq("skillId", args.skillId).eq("version", args.version)
      )
      .first();
  },
});

/**
 * Get all skills (paginated) with optional search
 * - Only returns public skills (unlisted skills excluded from listings)
 */
export const listSkills = query({
  args: {
    paginationOpts: paginationOptsValidator,
    query: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate search query length
    const sanitizedQuery = args.query ? sanitizeSearchQuery(args.query) : "";
    if (sanitizedQuery && sanitizedQuery.length > MAX_SEARCH_QUERY_LENGTH) {
      throw new Error("Search query is too long");
    }

    // If there's a search query, filter results
    if (sanitizedQuery) {
      const searchQuery = sanitizedQuery.toLowerCase();

      const allSkills = await ctx.db
        .query("skills")
        .withIndex("by_created_at")
        .order("desc")
        .collect();

      // Filter by search query AND visibility (public only)
      const filtered = allSkills.filter(
        (skill) =>
          skill.visibility === "public" &&
          (skill.name.toLowerCase().includes(searchQuery) ||
           skill.description.toLowerCase().includes(searchQuery))
      );

      // Manual pagination for filtered results using N+1 pattern
      const cursorValue = args.paginationOpts.cursor
        ? parseInt(args.paginationOpts.cursor, 10)
        : 0;
      const startIndex = isNaN(cursorValue) ? 0 : cursorValue;
      const numItems = args.paginationOpts.numItems;

      // Fetch one extra item to determine if there are more results
      const endIndex = startIndex + numItems + 1;
      const paginated = filtered.slice(startIndex, endIndex);

      const skillsWithOwners = await Promise.all(
        paginated.map(async (skill) => {
          const owner = await ctx.db.get(skill.ownerUserId);
          return toSkillWithOwner(skill, owner);
        })
      );

      // If we got more than numItems, there are more results
      const hasMore = skillsWithOwners.length > numItems;
      const pageToReturn = hasMore
        ? skillsWithOwners.slice(0, numItems)
        : skillsWithOwners;

      return {
        page: pageToReturn,
        isDone: !hasMore,
        continueCursor: hasMore ? (startIndex + numItems).toString() : "",
      };
    }

    // Otherwise, return public skills with proper pagination
    // Use N+1 pattern: fetch one extra item to know if there are more results
    const result = await ctx.db
      .query("skills")
      .withIndex("by_created_at")
      .order("desc")
      .paginate({
        ...args.paginationOpts,
        numItems: args.paginationOpts.numItems + 1,
      });

    // Filter to public skills only
    const publicSkills = result.page.filter((skill) => skill.visibility === "public");

    // Fetch owner info for each skill
    const skillsWithOwners = await Promise.all(
      publicSkills.map(async (skill) => {
        const owner = await ctx.db.get(skill.ownerUserId);
        return toSkillWithOwner(skill, owner);
      })
    );

    // If we got more items than requested, there are definitely more results
    const hasMore = skillsWithOwners.length > args.paginationOpts.numItems;

    // Return only the requested number of items
    const pageToReturn = hasMore
      ? skillsWithOwners.slice(0, args.paginationOpts.numItems)
      : skillsWithOwners;

    return {
      ...result,
      isDone: !hasMore,
      page: pageToReturn,
    };
  },
});

/**
 * Get a single skill by owner and name
 * - Respects visibility (unlisted only visible to owner)
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

    // Check visibility - unlisted skills only visible to owner
    const identity = await ctx.auth.getUserIdentity();
    const isOwner = identity ? await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first().then(u => u?._id === skill.ownerUserId) : false;

    if (skill.visibility === "unlisted" && !isOwner) {
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
 * - Only returns public skills (unlisted skills excluded from search)
 */
export const searchSkills = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const sanitizedQuery = sanitizeSearchQuery(args.query);
    if (sanitizedQuery.length > MAX_SEARCH_QUERY_LENGTH) {
      throw new Error("Search query is too long");
    }
    const searchQuery = sanitizedQuery.toLowerCase();

    // Get all skills (we'll implement proper search later with a search index)
    const allSkills = await ctx.db
      .query("skills")
      .withIndex("by_created_at")
      .order("desc")
      .collect();

    // Filter by search query AND visibility (public only)
    const filtered = allSkills.filter(
      (skill) =>
        skill.visibility === "public" &&
        (skill.name.toLowerCase().includes(searchQuery) ||
         skill.description.toLowerCase().includes(searchQuery))
    );

    // Take only the limit
    const limited = filtered.slice(0, limit);

    // Fetch owner info
    const skillsWithOwners = await Promise.all(
      limited.map(async (skill) => {
        const owner = await ctx.db.get(skill.ownerUserId);
        return toSkillWithOwner(skill, owner);
      })
    );

    return skillsWithOwners;
  },
});

/**
 * Get skills by owner (user handle)
 * - Shows public skills to everyone
 * - Shows unlisted skills only to the owner
 */
export const getSkillsByOwner = query({
  args: {
    ownerHandle: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Find the user
    const owner = await ctx.db
      .query("users")
      .withIndex("by_handle", (q) => q.eq("handle", args.ownerHandle))
      .first();

    if (!owner) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    // Check if viewer is the owner
    const identity = await ctx.auth.getUserIdentity();
    const isOwner = identity ? await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first().then(u => u?._id === owner._id) : false;

    // Get their skills with pagination using N+1 pattern
    // Fetch one extra item to know if there are more results
    const result = await ctx.db
      .query("skills")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", owner._id))
      .paginate({
        ...args.paginationOpts,
        numItems: args.paginationOpts.numItems + 1,
      });

    // Filter skills by visibility (public only unless viewer is owner)
    const visibleSkills = result.page.filter((skill) =>
      skill.visibility === "public" || isOwner
    );

    const skillsWithOwner = visibleSkills.map((skill) =>
      toSkillWithOwner(skill, owner)
    );

    // If we got more items than requested, there are definitely more results
    const hasMore = skillsWithOwner.length > args.paginationOpts.numItems;

    // Return only the requested number of items
    const pageToReturn = hasMore
      ? skillsWithOwner.slice(0, args.paginationOpts.numItems)
      : skillsWithOwner;

    return {
      ...result,
      isDone: !hasMore,
      page: pageToReturn,
    };
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
    return skills.map((skill) => toSkillWithOwner(skill, user));
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
    await enforceRateLimitWithDb(ctx, {
      key: `user:${identity.subject}:deleteSkill`,
      ...DELETE_RATE_LIMIT,
    });

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

/**
 * Internal query to get all skills (for admin operations)
 */
export const getAllSkills = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("skills").collect();
  },
});

/**
 * Internal mutation to delete a skill by ID (bypasses auth for admin operations)
 */
export const deleteSkillInternal = internalMutation({
  args: {
    skillId: v.id("skills"),
  },
  handler: async (ctx, args) => {
    logSecurityEvent("skills.delete_internal", {
      skillId: args.skillId,
    });
    // Get the skill
    const skill = await ctx.db.get(args.skillId);
    if (!skill) {
      return { success: false, error: "Skill not found" };
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
