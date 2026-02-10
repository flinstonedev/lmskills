import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // Clerk user ID - used to link to Clerk
    clerkId: v.string(),

    // Basic user info
    email: v.string(),
    handle: v.string(), // Unique, slug-friendly username
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),

    // Auth metadata
    authProvider: v.string(), // "github" or "email"

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_handle", ["handle"])
    .index("by_email", ["email"]),

  // Skills table - metadata only, no content stored for security
  skills: defineTable({
    source: v.optional(v.union(v.literal("github"), v.literal("hosted"))),
    handle: v.optional(v.string()), // Owner handle
    slug: v.optional(v.string()), // Skill slug
    fullName: v.optional(v.string()), // handle/slug
    repoUrl: v.optional(v.string()), // GitHub repo URL (unique)
    name: v.string(),
    description: v.string(),
    license: v.optional(v.string()),
    ownerUserId: v.id("users"),
    ownerOrg: v.optional(v.string()), // For GitHub org repos
    defaultVersionId: v.optional(v.id("skillVersions")),
    visibility: v.optional(v.union(v.literal("public"), v.literal("unlisted"))),
    stars: v.optional(v.number()), // GitHub stars count
    lastSyncedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_repo_url", ["repoUrl"])
    .index("by_owner", ["ownerUserId"])
    .index("by_created_at", ["createdAt"])
    .index("by_full_name", ["fullName"])
    .index("by_visibility_created_at", ["visibility", "createdAt"])
    .index("by_owner_visibility", ["ownerUserId", "visibility"]),

  // Hosted skill versions (content stored in object storage)
  skillVersions: defineTable({
    skillId: v.id("skills"),
    version: v.string(), // semver
    changelog: v.optional(v.string()),
    storageKey: v.string(), // R2/S3 key
    contentHash: v.string(), // sha256
    sizeBytes: v.number(),
    manifest: v.optional(v.string()), // JSON string
    publishedBy: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("verified"), v.literal("rejected")),
    verificationId: v.optional(v.id("skillVerifications")),
  })
    .index("by_skill", ["skillId"])
    .index("by_skill_and_version", ["skillId", "version"])
    .index("by_status", ["status"]),

  // Verification runs for hosted skills
  skillVerifications: defineTable({
    skillVersionId: v.id("skillVersions"),
    status: v.union(v.literal("running"), v.literal("passed"), v.literal("failed")),
    checks: v.optional(v.string()), // JSON of check results
    errors: v.optional(v.array(v.string())),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  }),

  // Tags for categorizing skills
  tags: defineTable({
    name: v.string(), // e.g., "prompt-engineering", "tool-use"
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  // Many-to-many relationship between skills and tags
  skillTags: defineTable({
    skillId: v.id("skills"),
    tagId: v.id("tags"),
    createdAt: v.number(),
  })
    .index("by_skill", ["skillId"])
    .index("by_tag", ["tagId"]),

  // Comments on skills
  comments: defineTable({
    skillId: v.id("skills"),
    userId: v.id("users"),
    body: v.string(), // Markdown, sanitized
    parentCommentId: v.optional(v.id("comments")), // For nested replies
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_skill", ["skillId"])
    .index("by_user", ["userId"])
    .index("by_parent", ["parentCommentId"]),

  // Ratings for skills
  ratings: defineTable({
    skillId: v.id("skills"),
    userId: v.id("users"),
    score: v.number(), // 1-5
    body: v.optional(v.string()), // Optional review text, markdown
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_skill", ["skillId"])
    .index("by_user", ["userId"])
    .index("by_skill_and_user", ["skillId", "userId"]),

  // User favorites/stars
  favorites: defineTable({
    userId: v.id("users"),
    skillId: v.id("skills"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_skill", ["skillId"])
    .index("by_user_and_skill", ["userId", "skillId"]),

  // Moderation queue
  moderationItems: defineTable({
    type: v.string(), // "skill" | "comment"
    targetId: v.string(), // skill_id or comment_id
    reporterUserId: v.id("users"),
    reason: v.string(), // "spam" | "inappropriate" | "broken" | "other"
    status: v.string(), // "pending" | "resolved" | "dismissed"
    adminNotes: v.optional(v.string()),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_reporter", ["reporterUserId"]),

  // Skills Lab discussion posts
  skillsLabPosts: defineTable({
    title: v.string(),
    body: v.string(), // Markdown
    userId: v.id("users"),
    pinned: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_pinned", ["pinned"])
    .index("by_created_at", ["createdAt"]),

  // Skills Lab replies
  skillsLabReplies: defineTable({
    postId: v.id("skillsLabPosts"),
    userId: v.id("users"),
    body: v.string(), // Markdown
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"]),

  // Rate limiting state (per-key window counters)
  rateLimits: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
