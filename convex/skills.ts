import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { enforceRateLimitWithDb, logSecurityEvent } from "./security";

/**
 * Helper: Convert skill to object for list views
 */
function toSkillWithOwner(skill: Doc<"skills">, owner: Doc<"users"> | null) {
  return {
    _id: skill._id,
    source: skill.source,
    slug: skill.slug,
    fullName: skill.fullName,
    name: skill.name,
    description: skill.description ?? "",
    visibility: skill.visibility ?? "public",
    defaultVersionId: skill.defaultVersionId,
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
const UPLOAD_RATE_LIMIT = { limit: 20, windowMs: 60_000 };
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const MAX_SKILL_SIZE = 10 * 1024 * 1024; // 10MB
const VERIFICATION_BATCH_LIMIT = 25;

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

function parseManifestJson(manifest: string | undefined) {
  if (!manifest) {
    return null;
  }
  try {
    const parsed = JSON.parse(manifest) as {
      entry?: string;
      files?: string[];
    };
    return parsed;
  } catch {
    return null;
  }
}

async function verifyHostedSkillVersion(
  ctx: MutationCtx,
  versionId: Id<"skillVersions">
) {
  const version = await ctx.db.get(versionId);
  if (!version) {
    return null;
  }

  const startedAt = Date.now();
  const verificationId = await ctx.db.insert("skillVerifications", {
    skillVersionId: versionId,
    status: "running",
    startedAt,
  });

  await ctx.db.patch(versionId, {
    verificationId,
    status: "pending",
  });

  const checks: Record<string, boolean> = {
    hasStoredArtifact: false,
    sizeMatches: false,
    hashMatches: false,
    manifestValid: false,
  };
  const errors: string[] = [];

  try {
    const metadata = await ctx.storage.getMetadata(
      version.storageKey as Id<"_storage">
    );
    if (!metadata) {
      errors.push("Artifact not found in storage");
    } else {
      checks.hasStoredArtifact = true;

      checks.sizeMatches = metadata.size === version.sizeBytes;
      if (!checks.sizeMatches) {
        errors.push(
          `Artifact size mismatch (expected ${version.sizeBytes}, got ${metadata.size})`
        );
      }

      checks.hashMatches =
        metadata.sha256.toLowerCase() === version.contentHash.toLowerCase();
      if (!checks.hashMatches) {
        errors.push("Artifact hash does not match contentHash");
      }

      const manifest = parseManifestJson(version.manifest);
      checks.manifestValid =
        manifest === null ||
        (typeof manifest.entry === "string" &&
          manifest.entry.length > 0 &&
          Array.isArray(manifest.files) &&
          manifest.files.length > 0 &&
          manifest.files.includes(manifest.entry));
      if (!checks.manifestValid) {
        errors.push("Manifest JSON is invalid or missing required entry/files");
      }
    }
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : "Unknown verification error"
    );
  }

  const passed = errors.length === 0;
  const completedAt = Date.now();

  await ctx.db.patch(verificationId, {
    status: passed ? "passed" : "failed",
    checks: JSON.stringify(checks),
    errors: passed ? undefined : errors,
    completedAt,
  });

  await ctx.db.patch(versionId, {
    status: passed ? "verified" : "rejected",
    verificationId,
  });

  if (passed) {
    const skill = await ctx.db.get(version.skillId);
    if (skill && !skill.defaultVersionId) {
      await ctx.db.patch(skill._id, {
        defaultVersionId: versionId,
        updatedAt: Date.now(),
      });
    }
  }

  return {
    verificationId,
    status: passed ? "verified" : "rejected",
    errors,
  };
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
 * Create a repository skill entry
 */
export const createRepository = mutation({
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
      key: `user:${identity.subject}:createRepository`,
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
      source: "repository",
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
 * Get one repository skill for the current user by slug.
 */
export const getMyRepositoryBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    const normalizedSlug = normalizeSlug(args.slug);
    const fullName = `${user.handle}/${normalizedSlug}`;
    const skill = await ctx.db
      .query("skills")
      .withIndex("by_full_name", (q) => q.eq("fullName", fullName))
      .first();

    if (!skill || skill.ownerUserId !== user._id || skill.source !== "repository") {
      return null;
    }

    return {
      _id: skill._id,
      name: skill.name,
      slug: skill.slug,
      fullName: skill.fullName,
      visibility: skill.visibility ?? "public",
      defaultVersionId: skill.defaultVersionId,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
    };
  },
});

/**
 * List repository skills and versions for the current user.
 */
export const getMyRepositories = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const skills = await ctx.db
      .query("skills")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", user._id))
      .collect();

    const repoSkills = skills
      .filter((skill) => skill.source === "repository")
      .sort((left, right) => right.updatedAt - left.updatedAt);

    const records = await Promise.all(
      repoSkills.map(async (skill) => {
        const versions = await ctx.db
          .query("skillVersions")
          .withIndex("by_skill", (q) => q.eq("skillId", skill._id))
          .collect();
        const enriched = await Promise.all(
          versions.map(async (version) => {
            const verification = version.verificationId
              ? await ctx.db.get(version.verificationId)
              : null;
            return {
              _id: version._id,
              version: version.version,
              changelog: version.changelog,
              sizeBytes: version.sizeBytes,
              status: version.status,
              publishedAt: version.publishedAt,
              verification: verification
                ? {
                    _id: verification._id,
                    status: verification.status,
                    checks: verification.checks,
                    errors: verification.errors,
                    startedAt: verification.startedAt,
                    completedAt: verification.completedAt,
                  }
                : null,
            };
          })
        );
        const sorted = enriched.sort((left, right) =>
          right.version.localeCompare(left.version, undefined, {
            numeric: true,
            sensitivity: "base",
          })
        );
        return {
          _id: skill._id,
          name: skill.name,
          description: skill.description,
          slug: skill.slug,
          fullName: skill.fullName,
          visibility: skill.visibility ?? "public",
          defaultVersionId: skill.defaultVersionId,
          createdAt: skill.createdAt,
          updatedAt: skill.updatedAt,
          versions: sorted,
        };
      })
    );

    return records;
  },
});

/**
 * Generate an upload URL for a repository skill artifact.
 */
export const generateRepositoryUploadUrl = mutation({
  args: {
    skillId: v.id("skills"),
    version: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await enforceRateLimitWithDb(ctx, {
      key: `user:${identity.subject}:generateRepositoryUploadUrl`,
      ...UPLOAD_RATE_LIMIT,
    });

    if (args.version.length > 128) {
      throw new Error("Version string is too long");
    }

    if (!SEMVER_PATTERN.test(args.version)) {
      throw new Error("Version must be valid semver");
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
    if (skill.source !== "repository") {
      throw new Error("Only repository skills can upload artifacts");
    }
    if (skill.ownerUserId !== user._id) {
      throw new Error("Not authorized to upload for this skill");
    }

    const existing = await ctx.db
      .query("skillVersions")
      .withIndex("by_skill_and_version", (q) =>
        q.eq("skillId", args.skillId).eq("version", args.version)
      )
      .first();
    if (existing) {
      throw new Error("This version already exists");
    }

    const uploadUrl = await ctx.storage.generateUploadUrl();
    return { uploadUrl };
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

    // Validate size is positive and within limit
    if (args.sizeBytes <= 0 || args.sizeBytes > MAX_SKILL_SIZE) {
      throw new Error("sizeBytes must be between 1 byte and 10MB");
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

    if (skill.source !== "repository") {
      throw new Error("Only repository skills can publish versions");
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

    const now = Date.now();
    const versionId = await ctx.db.insert("skillVersions", {
      skillId: args.skillId,
      version: args.version,
      changelog: args.changelog,
      storageKey: args.storageKey,
      contentHash: args.contentHash,
      sizeBytes: args.sizeBytes,
      manifest: args.manifest,
      publishedBy: user._id,
      publishedAt: now,
      status: "pending",
    });

    await verifyHostedSkillVersion(ctx, versionId);

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

    await enforceRateLimitWithDb(ctx, {
      key: `user:${identity.subject}:setDefaultVersion`,
      ...SUBMIT_RATE_LIMIT,
    });

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

    if (version.status !== "verified") {
      throw new Error("Only verified versions can be set as default");
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

    const identity = await ctx.auth.getUserIdentity();
    const isOwner = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
          .first()
          .then((u) => u?._id === skill.ownerUserId)
      : false;

    const isPublic = skill.visibility === "public";
    if (!isPublic && !(skill.visibility === "unlisted" && isOwner)) {
      return null;
    }

    const versionsQuery = ctx.db
      .query("skillVersions")
      .withIndex("by_skill", (q) => q.eq("skillId", skill._id));
    const versions = isPublic
      ? await versionsQuery.filter((q) => q.eq(q.field("status"), "verified")).collect()
      : await versionsQuery.collect();

    // Sanitize versions - remove sensitive fields
    const sanitizedVersions = versions.map((version) => ({
      _id: version._id,
      skillId: version.skillId,
      version: version.version,
      changelog: version.changelog,
      sizeBytes: version.sizeBytes,
      publishedAt: version.publishedAt,
      status: version.status,
      publishedBy: version.publishedBy,
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
 * Get a specific skill version (public-safe)
 * - Sanitizes output (no storageKey, contentHash)
 * - Respects visibility (unlisted only visible to owner)
 */
export const getSkillVersion = query({
  args: {
    skillId: v.id("skills"),
    version: v.string(),
  },
  handler: async (ctx, args) => {
    const skill = await ctx.db.get(args.skillId);
    if (!skill) {
      return null;
    }

    const identity = await ctx.auth.getUserIdentity();
    const isOwner = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
          .first()
          .then((u) => u?._id === skill.ownerUserId)
      : false;

    const isPublic = skill.visibility === "public";
    if (!isPublic && !(skill.visibility === "unlisted" && isOwner)) {
      return null;
    }

    const version = await ctx.db
      .query("skillVersions")
      .withIndex("by_skill_and_version", (q) =>
        q.eq("skillId", args.skillId).eq("version", args.version)
      )
      .first();

    if (!version || (isPublic && version.status !== "verified")) {
      return null;
    }

    // Return sanitized version (no sensitive fields)
    return {
      _id: version._id,
      skillId: version.skillId,
      version: version.version,
      changelog: version.changelog,
      sizeBytes: version.sizeBytes,
      publishedAt: version.publishedAt,
      status: version.status,
      publishedBy: version.publishedBy,
    };
  },
});

/**
 * Get a download URL for a skill version (requires authentication)
 */
export const getVersionDownloadUrl = query({
  args: {
    skillId: v.id("skills"),
    version: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const skill = await ctx.db.get(args.skillId);
    if (!skill || skill.source !== "repository") {
      return null;
    }

    let versionDoc;
    if (args.version) {
      versionDoc = await ctx.db
        .query("skillVersions")
        .withIndex("by_skill_and_version", (q) =>
          q.eq("skillId", args.skillId).eq("version", args.version!)
        )
        .first();
    } else if (skill.defaultVersionId) {
      versionDoc = await ctx.db.get(skill.defaultVersionId);
    } else {
      // Fall back to latest verified version
      const versions = await ctx.db
        .query("skillVersions")
        .withIndex("by_skill", (q) => q.eq("skillId", args.skillId))
        .collect();
      const verified = versions
        .filter((v) => v.status === "verified")
        .sort((a, b) =>
          b.version.localeCompare(a.version, undefined, {
            numeric: true,
            sensitivity: "base",
          })
        );
      versionDoc = verified[0] ?? null;
    }

    if (!versionDoc || versionDoc.status !== "verified") {
      return null;
    }

    const url = await ctx.storage.getUrl(
      versionDoc.storageKey as Id<"_storage">
    );

    return {
      url,
      version: versionDoc.version,
      sizeBytes: versionDoc.sizeBytes,
      contentHash: versionDoc.contentHash,
    };
  },
});

/**
 * Internal query to get version storage key for download (bypasses auth for API routes)
 */
export const getVersionStorageKey = internalQuery({
  args: {
    fullName: v.string(),
    version: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const skill = await ctx.db
      .query("skills")
      .withIndex("by_full_name", (q) => q.eq("fullName", args.fullName))
      .first();

    if (!skill || skill.source !== "repository") {
      return null;
    }

    let versionDoc;
    if (args.version) {
      versionDoc = await ctx.db
        .query("skillVersions")
        .withIndex("by_skill_and_version", (q) =>
          q.eq("skillId", skill._id).eq("version", args.version!)
        )
        .first();
    } else if (skill.defaultVersionId) {
      versionDoc = await ctx.db.get(skill.defaultVersionId);
    } else {
      const versions = await ctx.db
        .query("skillVersions")
        .withIndex("by_skill", (q) => q.eq("skillId", skill._id))
        .collect();
      const verified = versions
        .filter((v) => v.status === "verified")
        .sort((a, b) =>
          b.version.localeCompare(a.version, undefined, {
            numeric: true,
            sensitivity: "base",
          })
        );
      versionDoc = verified[0] ?? null;
    }

    if (!versionDoc || versionDoc.status !== "verified") {
      return null;
    }

    const url = await ctx.storage.getUrl(
      versionDoc.storageKey as Id<"_storage">
    );

    return {
      url,
      storageKey: versionDoc.storageKey,
      version: versionDoc.version,
      sizeBytes: versionDoc.sizeBytes,
      contentHash: versionDoc.contentHash,
    };
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
    const searchQuery = sanitizedQuery.toLowerCase();

    if (sanitizedQuery) {
      const allSkills = await ctx.db
        .query("skills")
        .withIndex("by_created_at")
        .order("desc")
        .collect();

      const visibleSkills = allSkills.filter(
        (skill) => (skill.visibility ?? "public") === "public"
      );

      const filtered = visibleSkills.filter(
        (skill) =>
          skill.name.toLowerCase().includes(searchQuery) ||
          skill.description.toLowerCase().includes(searchQuery)
      );

      const cursorValue = args.paginationOpts.cursor
        ? parseInt(args.paginationOpts.cursor, 10)
        : 0;
      const startIndex = isNaN(cursorValue) ? 0 : cursorValue;
      const numItems = args.paginationOpts.numItems;

      const paginated = filtered.slice(startIndex, startIndex + numItems);

      const skillsWithOwners = await Promise.all(
        paginated.map(async (skill) => {
          const owner = await ctx.db.get(skill.ownerUserId);
          return toSkillWithOwner(skill, owner);
        })
      );

      const hasMore = filtered.length > startIndex + numItems;

      return {
        page: skillsWithOwners,
        isDone: !hasMore,
        continueCursor: hasMore ? (startIndex + numItems).toString() : "",
      };
    }

    const result = await ctx.db
      .query("skills")
      .withIndex("by_visibility_created_at", (q) =>
        q.eq("visibility", "public")
      )
      .order("desc")
      .paginate(args.paginationOpts);

    const skillsWithOwners = await Promise.all(
      result.page.map(async (skill) => {
        const owner = await ctx.db.get(skill.ownerUserId);
        return toSkillWithOwner(skill, owner);
      })
    );

    return {
      ...result,
      page: skillsWithOwners,
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

    // Find the skill by owner and name (try fullName index first, then fallback)
    const fullName = `${owner.handle}/${args.name}`;
    let skill = await ctx.db
      .query("skills")
      .withIndex("by_full_name", (q) => q.eq("fullName", fullName))
      .first();

    // Fallback: match by display name for backwards compatibility with GitHub skills
    if (!skill) {
      const skills = await ctx.db
        .query("skills")
        .withIndex("by_owner", (q) => q.eq("ownerUserId", owner._id))
        .collect();

      skill = skills.find((s) => s.name === args.name) ?? null;
    }

    if (!skill) {
      return null;
    }

    // Check visibility - unlisted skills only visible to owner
    const identity = await ctx.auth.getUserIdentity();
    const isOwner = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
          .first()
          .then((u) => u?._id === skill.ownerUserId)
      : false;

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
        (skill.visibility ?? "public") === "public" &&
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
    const isOwner = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
          .first()
          .then((u) => u?._id === owner._id)
      : false;

    const query = isOwner
      ? ctx.db
          .query("skills")
          .withIndex("by_owner", (q) => q.eq("ownerUserId", owner._id))
      : ctx.db.query("skills").withIndex("by_owner_visibility", (q) =>
          q.eq("ownerUserId", owner._id).eq("visibility", "public")
        );

    const result = await query.paginate(args.paginationOpts);

    const skillsWithOwner = result.page.map((skill) =>
      toSkillWithOwner(skill, owner)
    );

    return {
      ...result,
      page: skillsWithOwner,
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
    // Delete skill verifications and versions (repository skills)
    const skillVersions = await ctx.db
      .query("skillVersions")
      .withIndex("by_skill", (q) => q.eq("skillId", args.skillId))
      .collect();
    for (const version of skillVersions) {
      const verifications = await ctx.db
        .query("skillVerifications")
        .withIndex("by_skill_version", (q) => q.eq("skillVersionId", version._id))
        .collect();
      for (const verification of verifications) {
        await ctx.db.delete(verification._id);
      }
      await ctx.db.delete(version._id);
    }

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
 * Re-run verification for a repository skill version (owner only).
 */
export const reverifySkillVersion = mutation({
  args: {
    skillId: v.id("skills"),
    versionId: v.id("skillVersions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await enforceRateLimitWithDb(ctx, {
      key: `user:${identity.subject}:reverifySkillVersion`,
      ...SUBMIT_RATE_LIMIT,
    });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    const skill = await ctx.db.get(args.skillId);
    if (!skill || skill.source !== "repository") {
      throw new Error("Repository skill not found");
    }
    if (skill.ownerUserId !== user._id) {
      throw new Error("Not authorized to verify this skill");
    }

    const version = await ctx.db.get(args.versionId);
    if (!version || version.skillId !== args.skillId) {
      throw new Error("Skill version not found");
    }

    await ctx.db.patch(args.versionId, {
      status: "pending",
    });

    return await verifyHostedSkillVersion(ctx, args.versionId);
  },
});

/**
 * Internal mutation that verifies pending skill versions in batches.
 */
export const runPendingSkillVerifications = internalMutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(
      1,
      Math.min(args.limit ?? VERIFICATION_BATCH_LIMIT, VERIFICATION_BATCH_LIMIT)
    );
    const pendingVersions = await ctx.db
      .query("skillVersions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(limit);

    const results = [];
    for (const version of pendingVersions) {
      const result = await verifyHostedSkillVersion(ctx, version._id);
      if (result) {
        results.push(result);
      }
    }

    return {
      scanned: pendingVersions.length,
      processed: results.length,
      verified: results.filter((result) => result.status === "verified").length,
      rejected: results.filter((result) => result.status === "rejected").length,
    };
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
 * Internal mutation to backfill missing visibility to public.
 */
export const backfillSkillVisibility = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    logSecurityEvent("skills.backfill_visibility", {
      dryRun: args.dryRun ?? false,
    });

    const dryRun = args.dryRun ?? false;
    const skills = await ctx.db.query("skills").collect();
    let updated = 0;

    for (const skill of skills) {
      if (!skill.visibility) {
        updated += 1;
        if (!dryRun) {
          await ctx.db.patch(skill._id, {
            visibility: "public",
            updatedAt: Date.now(),
          });
        }
      }
    }

    return {
      scanned: skills.length,
      updated,
      dryRun,
    };
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
    // Delete skill verifications and versions (repository skills)
    const skillVersions = await ctx.db
      .query("skillVersions")
      .withIndex("by_skill", (q) => q.eq("skillId", args.skillId))
      .collect();
    for (const version of skillVersions) {
      const verifications = await ctx.db
        .query("skillVerifications")
        .withIndex("by_skill_version", (q) => q.eq("skillVersionId", version._id))
        .collect();
      for (const verification of verifications) {
        await ctx.db.delete(verification._id);
      }
      await ctx.db.delete(version._id);
    }

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
 * Internal migration: backfill existing "hosted" skills to "repository" source.
 */
export const migrateHostedToRepository = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    logSecurityEvent("skills.migrate_hosted_to_repository", {
      dryRun: args.dryRun ?? false,
    });

    const dryRun = args.dryRun ?? false;
    const skills = await ctx.db.query("skills").collect();
    let updated = 0;

    for (const skill of skills) {
      if ((skill.source as string) === "hosted") {
        updated += 1;
        if (!dryRun) {
          await ctx.db.patch(skill._id, {
            source: "repository",
            updatedAt: Date.now(),
          });
        }
      }
    }

    return {
      scanned: skills.length,
      updated,
      dryRun,
    };
  },
});
