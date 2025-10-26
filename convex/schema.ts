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

  // Skills table
  skills: defineTable({
    repoUrl: v.string(), // GitHub repo URL (unique)
    name: v.string(),
    description: v.string(),
    license: v.optional(v.string()),
    skillMdContent: v.string(), // Raw SKILL.md markdown content
    ownerUserId: v.id("users"),
    ownerOrg: v.optional(v.string()), // For GitHub org repos
    visibility: v.string(), // "public" only in MVP
    stars: v.optional(v.number()), // GitHub stars count
    lastSyncedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_repo_url", ["repoUrl"])
    .index("by_owner", ["ownerUserId"])
    .index("by_created_at", ["createdAt"]),

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

  // GitHub API response cache
  githubCache: defineTable({
    url: v.string(), // Full GitHub API URL (unique key)
    response: v.string(), // JSON stringified response
    expiresAt: v.number(), // Cache expiry timestamp
    createdAt: v.number(),
  })
    .index("by_url", ["url"])
    .index("by_expires", ["expiresAt"]),
});
