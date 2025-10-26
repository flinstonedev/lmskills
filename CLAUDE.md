# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

LMSkills is a public, LLM-agnostic platform for sharing, discovering, and collaborating on Claude skills and similar LLM-powered tools. The platform allows users to submit skills via GitHub URLs, browse a directory of skills, and engage through comments, ratings, and favorites.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Database & Backend**: Convex (serverless backend with real-time database)
- **Authentication**: Clerk (GitHub OAuth + Email magic link)
- **Deployment**: Vercel

## Development Commands

### Setup
```bash
npm install                      # Install dependencies
cp .env.local.example .env.local # Copy environment variables template
npx convex dev                   # Start Convex backend (opens browser for login)
```

### Development
```bash
npm run dev                      # Start Next.js dev server (http://localhost:3000)
npx convex dev                   # Run Convex backend in development mode
```

### Build & Lint
```bash
npm run build                    # Build production bundle
npm run lint                     # Run ESLint
```

## Architecture

### Authentication Flow
- Clerk handles authentication (GitHub OAuth, Email magic link)
- Clerk webhooks sync user data to Convex via `/api/webhooks/clerk`
- Clerk JWT template named "convex" provides auth tokens for Convex
- Middleware (`src/middleware.ts`) protects routes using `clerkMiddleware()`

### Database Schema (Convex)
The schema (`convex/schema.ts`) defines the complete data model:
- **users**: User profiles with handle, email, bio, auth metadata
- **skills**: Skill submissions with GitHub repo URL, SKILL.md content, stars
- **tags** & **skillTags**: Tag system for categorizing skills
- **comments**: Threaded comments on skills (supports nested replies via `parentCommentId`)
- **ratings**: 1-5 star ratings with optional review text
- **favorites**: User favorites/stars for skills
- **moderationItems**: Moderation queue for reported skills/comments
- **skillsLabPosts** & **skillsLabReplies**: Discussion forum for evaluation frameworks

### Convex Backend Structure
- `convex/auth.config.ts`: Clerk authentication configuration
- `convex/users.ts`: User queries and mutations (getUserByHandle, getCurrentUser, upsertUser)
- `convex/skills.ts`: Skill CRUD operations (submitSkill, getSkills, getSkillByRepoUrl)
- `convex/github.ts`: GitHub API integration for fetching skill metadata
- `convex/http.ts`: HTTP endpoints including Clerk webhook handler
- `convex/schema.ts`: Database schema definitions with indexes

### Frontend Structure
- `src/app/`: Next.js App Router pages
  - `page.tsx`: Landing page
  - `skills/`: Skill submission, browsing, and detail pages
  - `users/`: User profile pages
  - `dashboard/`: User dashboard
  - `docs/`: Documentation pages
- `src/components/`: React components
  - `ui/`: shadcn/ui components (button, dialog, input, etc.)
  - `providers/`: Context providers (ConvexClientProvider)
  - `header.tsx`: Navigation with auth status
  - `footer.tsx`: Site footer
  - `safe-markdown.tsx`: Sanitized markdown renderer (uses DOMPurify)
  - `cookie-consent-banner.tsx`: GDPR cookie consent
- `src/lib/`: Utility functions and helpers
- `src/hooks/`: Custom React hooks

### Path Aliases
TypeScript is configured with path aliases:
- `@/*` → `./src/*`
- `@/convex/*` → `./convex/*`

### Key Patterns

**Convex Queries & Mutations**: Backend functions are type-safe and defined with validators using `v` from `convex/values`. Queries read data, mutations write data. Use `useQuery` and `useMutation` hooks in React components.

**Authentication Context**: Access current user with `getCurrentUser` query. Check authentication in Convex functions via `ctx.auth.getUserIdentity()`.

**Skill Submission Flow**:
1. User submits GitHub URL
2. Backend fetches SKILL.md and repo metadata via GitHub API
3. Validate repo exists and SKILL.md is present
4. Store skill in Convex with parsed metadata
5. Skills appear in directory after admin review (moderation queue)

**Markdown Rendering**: All user-generated markdown (skill content, comments, reviews) must be sanitized using the `SafeMarkdown` component which uses DOMPurify to prevent XSS attacks.

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
- `CLERK_SECRET_KEY`: Clerk secret key
- `CONVEX_DEPLOYMENT`: Convex deployment name
- `NEXT_PUBLIC_CONVEX_URL`: Convex API URL
- `CLERK_WEBHOOK_SECRET`: Webhook signing secret (production only)

## Clerk Configuration

1. Create application in Clerk Dashboard
2. Enable GitHub OAuth and Email magic link authentication
3. Create JWT template named "convex" with following settings:
   - Token lifetime: as desired
   - Include standard claims
4. Configure webhook endpoint: `https://your-domain/api/webhooks/clerk`
5. Subscribe to events: `user.created`, `user.updated`, `user.deleted`

## Development Roadmap

See `MVP_PLAN.md` for detailed roadmap. Current status:

**Milestone 0.1** ✅ (Complete)
- Authentication and user management
- Landing page
- User profiles

**Milestone 0.2** (In Progress)
- Skill submission via GitHub URL
- Skill ingestion pipeline
- Skill detail pages

**Milestone 0.3** (Next)
- Directory listing with search and filters
- Sorting (trending, new, rating)

**Future Milestones**
- Comments and ratings system
- Favorites/stars functionality
- Moderation queue and tools
- Skills Lab discussion forum
- GitHub webhook auto-sync

## Important Constraints

- All skills are public in MVP (no private skills)
- One rating per user per skill (editable)
- Comments support nested replies via `parentCommentId`
- All markdown content must be sanitized before rendering
- Handle uniqueness enforced at database level
- GitHub repo URLs must be unique per skill
- Skills Lab is for open discussion on evaluation frameworks, not a walled sandbox
