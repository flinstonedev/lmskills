# LMSkills — MVP Plan: Skills Directory

## Vision
A public, LLM-agnostic platform for sharing, discovering, and collaborating on Claude skills and similar LLM-powered tools. Long-term monetization via subscriptions; initial phase focuses on public, shareable skills to build momentum with indie builders and teams.

---

## Core Principles

1. **LLM-Agnostic**: Treat skills as universal; assume other LLMs will adopt the same APIs over time.
2. **Public & Shareable**: All skills start public to maximize discoverability and community engagement.
3. **Collaborative**: Comments, ratings, and discussion threads drive community feedback.
4. **Open Evaluation Frameworks**: Skills Lab is a space to co-define evaluation standards, not a walled sandbox.

---

## Scope: Initial Phase

### Small Impact (Core Directory)

- **Skill Submission (by Git URL)**
  - Accept GitHub links with the url of the skill (add a guide on how to upload a skill to github for begineers).
  - Track tags, license, owner, last updated.
  - Preview before publish; one-click submission.

- **Directory Listing**
  - Search by title/description.
  - Filters: tags, language, maintained/unmaintained.
  - Sort: new, trending (by rating + stars), rating.

- **Skill Detail Page**
  - Render Skill's SKILL.md as main content.
  - Display maintainers, license, last updated, git tags/commits (version history).
  - Links: GitHub repo, issues, discussions.
  - Share buttons: copy link, OG card for social.

- **Public Sharing**
  - SEO-friendly URL slugs: `lmskills.dev/skills/{handle}/{skill-name}`.
  - Open Graph cards for social media previews.

### Medium Impact (Community & Collaboration)

- **Comments**
  - Threaded comments per skill.
  - Markdown support; sanitized for XSS.
  - Nested replies; timestamp; author info.

- **Ratings**
  - 1–5 star scale with optional text review.
  - User can rate once per skill (edit allowed).
  - Aggregate display: average + count.
  - (Dimensions like "quality," "reliability," "cost" deferred to later phases.)

- **Favorites/Stars**
  - Users star skills to save to profile.
  - Public star count drives "trending" ranking.
  - Trending = recent + high star count (simple formula).

- **Collaboration Hooks**
  - "Discuss this skill" links to onsite discussion board or GitHub Issues.
  - "Propose improvement" offers guided flow: fork repo, commit, open PR, notify maintainer.
  - Skill owner notified of new comments and ratings.

- **Moderation**
  - Report skill or comment (spam, inappropriate, broken).
  - Admin review queue; unpublish or delete. All skills and comments must be manually reviewed before publishing
  - User suspension for repeat abuse.

---

## Data Model (Minimum Viable)

```
User
├── id (uuid)
├── handle (unique, slug-friendly)
├── email
├── avatar_url
├── bio
├── auth_provider (github, email)
├── auth_id
├── created_at
└── updated_at

Skill
├── id (uuid)
├── repo_url (unique, e.g., https://github.com/user/skill-repo)
├── name
├── description (from README or user input)
├── license (parsed or inferred)
├── owner_user_id (fk User)
├── owner_org (optional, for GitHub Org repos)
├── visibility (public — only option in MVP)
├── last_synced_at (when README was fetched)
├── created_at
└── updated_at

SkillVersion (optional in MVP; can defer)
├── id (uuid)
├── skill_id (fk)
├── tag_or_sha (git tag or commit SHA)
├── released_at
└── created_at

Tag
├── id (uuid)
├── name (e.g., "prompt-engineering", "tool-use")
└── created_at

SkillTag
├── skill_id (fk)
├── tag_id (fk)
└── created_at

Comment
├── id (uuid)
├── skill_id (fk)
├── user_id (fk)
├── body (markdown, sanitized)
├── parent_comment_id (fk, for nested replies)
├── created_at
└── updated_at

Rating
├── id (uuid)
├── skill_id (fk)
├── user_id (fk)
├── score (1–5)
├── body (optional review text, markdown)
├── created_at
└── updated_at

Favorite
├── user_id (fk)
├── skill_id (fk)
└── created_at

ModerationItem
├── id (uuid)
├── type (skill | comment)
├── target_id (skill_id or comment_id)
├── reporter_user_id (fk)
├── reason (spam | inappropriate | broken | other)
├── status (pending | resolved | dismissed)
├── admin_notes
├── created_at
└── resolved_at

SkillsLabPost (for open discussion on eval frameworks)
├── id (uuid)
├── title
├── body (markdown)
├── user_id (fk)
├── pinned (bool)
├── created_at
└── updated_at

SkillsLabReply
├── id (uuid)
├── post_id (fk)
├── user_id (fk)
├── body (markdown)
├── created_at
└── updated_at
```

---

## Architecture & Stack

### Frontend
- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Server-side rendering**: Yes (SEO, OG cards)
- **Impact**: Small

### Authentication
- **Providers**: GitHub OAuth (primary); email magic link (secondary)
- **Library**: Clerk
- **Impact**: Small

### Backend / Database
- **Database**: Convex

### Ingestion Pipeline
- **Git ingest**: Simple Node.js + `octokit` (GitHub API) to:
  - Fetch SKILL.md (raw content).
  - Parse license (if present).
  - Extract tags/keywords (optional heuristics).
  - Sanitize Markdown (markdown-it + DOMPurify).
  - Cache in DB.
- **Trigger**: Manual on submit (MVP); webhook on push (later).
- **Impact**: Medium (webhook deferred)

### Deployment
- **Frontend + API**: Any Next.js-compatible hosting platform
- **Database**: Convex
- **Impact**: Small

### Safety & Compliance
- **Markdown sanitization**: markdown-it + DOMPurify.
- **XSS prevention**: Content Security Policy headers.
- **Rate limiting**: Middleware-based rate limiting.
- **Moderation queue**: Admin dashboard for reports.
- **Impact**: Small

### Search (MVP)
- **Simple SQL full-text search** on skill name + description.
- **Later**: Upgrade to Typesense, Meilisearch, or Algolia if needed.

---

## Key User Flows

### 1. Submit a Skill
```
User → "Submit Skill" → Paste GitHub URL → Preview (SKILL, license, owner) → "Publish"
→ Skill added to DB, ingested, admin reviews and approves or rejects, if rejected it appears in directory within minutes.
```

### 2. Browse Directory
```
User → Search/filter (tags, language) → Sort (trending, rating, new)
→ Click skill → Detail page → SKILL + maintainers + versions + comments/ratings.
```

### 3. Comment & Rate
```
Auth required → Open skill detail → "Add rating" + "Post comment"
→ Comment appears in thread; rating aggregated.
→ Skill owner notified.
```

### 4. Favorite & Share
```
Click star icon → Skill saved to user's profile.
Click share → Copy link; OG card auto-generated for social.
```

### 5. Propose Improvement
```
"Propose improvement" → Guided fork/PR workflow → PR opened on original repo.
→ Maintainer notified; conversation threads on GitHub.
```

### 6. Skills Lab Discussion
```
"Discuss evaluation frameworks" → Browse pinned proposals + threads.
→ Add reply; link to datasets or spec docs.
→ (Later: attach eval runs; create leaderboards.)
```

---

## Edge Cases to Handle Early

- **Duplicate submissions**: Reject if repo_url already exists; suggest linking to existing skill.
- **Repo moved/deleted**: Track 404s; offer maintainer contact flow; mark as "inactive" after X days.
- **Private repos**: Reject or warn; cannot ingest README if private.
- **Missing license**: Allow submission; display "License not specified"; owner can add later.
- **Malicious README**: Strict Markdown sanitization; no iframe/script tags; link rel=nofollow.
- **Rating spam**: One rating per user per skill; edit allowed; cooldown (none at MVP); report flow.
- **Comment spam/toxicity**: Report button; admin review; auto-hide after N reports.

---

## Deferred (Consistent with Your Direction)

- **Subscriptions / Premium Skills Paywall**: Implement once traction is clear.
- **In-Browser "Try It"**: Safe, sandboxed runner for skills; planned later.
- **Deep Evaluations Runner**: Hosted eval engine; Skills Lab can reference external evals.
- **Reputation-Weighted Ratings**: Rater trust scores; prevents gaming; phase 2+.
- **Agent Templates & Visual Composer**: Skill chaining; UX research needed.
- **Git-Native CI/CD**: GitHub integration for test gating; post-MVP.
- **Enterprise Features**: Orgs, SSO, private marketplaces; post-MVP.
- **Observability Dashboards**: Usage analytics, cost tracking; post-MVP.

---

## Development Milestones

| Milestone | Focus | Effort | Status |
|-----------|-------|--------|--------|
| **0.1** | Scaffold app, auth, DB, landing page, user profiles | Small | — |
| **0.2** | Skill submission (URL), ingest pipeline, detail rendering | Small | — |
| **0.3** | Directory search, filtering, sorting | Small | — |
| **0.4** | Comments and ratings | Medium | — |
| **0.5** | Favorites, trending rank | Small | — |
| **0.6** | Moderation (report, review queue, unpublish) | Medium | — |
| **0.7** | GitHub webhook refresh (on push) | Medium | — |
| **0.8** | Skills Lab (discussion posts + threads, pinned proposals) | Small | — |

---

## Configuration

### 1. Database Host
- Convex.

### 2. Rating Model
- Single 1–5 star score (MVP).

### 3. Naming
- "LMSkills."

---

## Quality Assurance & Testing

### Manual Testing (MVP)
- [ ] Submit skill from public GitHub repo; verify ingest + display.
- [ ] Search/filter; verify results.
- [ ] Add comment + rating; verify notification (if email ready).
- [ ] Favorite skill; verify appears on profile.
- [ ] Share link; verify OG card in social media.
- [ ] Report skill/comment; verify admin queue.

### Automated Testing (post-MVP)
- API route tests (ingest, submit, rate).
- Component tests (comment thread, rating display).
- E2E tests (full skill submission flow).

---

## Suggested Tech Stack (Detailed)

```
Frontend:
├── Next.js 15 (App Router, TypeScript)
├── React 19
├── Tailwind CSS 4
├── Shadcn/ui (component library)
├── markdown-it (Markdown rendering)
└── DOMPurify (XSS prevention)

Backend:
├── Next.js Server Actions + API Routes
├── Convex (ORM)
├── octokit (GitHub API)
└── axios or node-fetch (HTTP)

Database:
└── Convex

Authentication:
├── Clerk

Deployment:
├── Any Next.js-compatible hosting platform

Observability (later):
├── PostHog

Security:
├── Content Security Policy (CSP) headers
├── CORS (Next.js auto-handles)
├── Rate limiting (Next.js Middleware)
└── Input validation (Zod)
```

---

## Timeline Estimate


---

## Post-MVP Roadmap

1. **Subscriptions & Premium Skills** (Q2 2025)
   - Stripe integration; usage-based or flat-rate tiers.
   - Skill paywall; private skills for paid members.

2. **In-Browser "Try It"** (Q2 2025)
   - Safe sandbox runner; display latency, token usage, cost.
   - Sharable run permalinks.

3. **Skills Lab Evaluations** (Q3 2025)
   - Dataset runs; A/B testing; guardrail tests.
   - Leaderboards; proposed improvements from meta-LLM.

4. **Agent Templates & Composer** (Q3 2025)
   - Visual graph builder for skill chaining.
   - Publish agent templates.

5. **Advanced Ratings & Reputation** (Q2–Q3 2025)
   - Reputation-weighted ratings; verified identities.
   - Bounties for improvements.

6. **Enterprise Features** (Q4 2025+)
   - Orgs, SSO/SAML, private marketplaces.
   - Audit logs, VPC connectors, SLAs.

---

## Success Metrics (MVP Phase)

- **Adoption**: 100+ indexed skills, 500+ registered users in first 3 months.
- **Engagement**: Avg 2+ comments/ratings per skill; 20% skill favoriting rate.
- **Quality**: <5% moderation items (abuse/spam); <1% reported skills.
- **Performance**: <2s page load; <500ms search response.
- **SEO**: Top 10 search for "Claude skills" + "LLM skills"; organic traffic >10% of total.

---

