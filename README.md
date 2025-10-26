# LMSkills

A public, LLM-agnostic platform for sharing, discovering, and collaborating on Claude skills and similar LLM-powered tools.

## Features (Milestone 0.1)

- ✅ User authentication with Clerk (GitHub OAuth + Email magic link)
- ✅ User profiles with customizable handles and bios
- ✅ Convex database integration
- ✅ Responsive landing page
- ✅ Modern UI with shadcn/ui components
- ✅ Full TypeScript support

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Database**: Convex
- **Authentication**: Clerk

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Clerk account ([clerk.com](https://clerk.com))
- Convex account ([convex.dev](https://convex.dev))

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd lmskills
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

4. Configure Convex:
   ```bash
   npx convex dev
   ```
   This will open your browser to log in and create a project. The command will automatically add `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` to your `.env.local`.

5. Configure Clerk:
   - Create a new application in [Clerk Dashboard](https://dashboard.clerk.com)
   - Enable GitHub OAuth and Email magic link
   - Create a JWT template named "convex" (see `CLERK_SETUP.md` for details)
   - Add your Clerk keys to `.env.local`:
     ```
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
     CLERK_SECRET_KEY=sk_test_...
     ```

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
lmskills/
├── convex/                 # Convex backend
│   ├── schema.ts          # Database schema
│   ├── users.ts           # User queries and mutations
│   ├── http.ts            # HTTP endpoints (webhooks)
│   └── auth.config.ts     # Clerk auth configuration
├── src/
│   ├── app/               # Next.js app router pages
│   │   ├── layout.tsx     # Root layout with providers
│   │   ├── page.tsx       # Landing page
│   │   └── users/         # User profile pages
│   ├── components/        # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── header.tsx     # Navigation header
│   │   ├── footer.tsx     # Footer
│   │   └── providers/     # Context providers
│   ├── lib/               # Utilities
│   └── middleware.ts      # Clerk middleware
├── public/                # Static assets
└── ...config files
```

## Convex HTTP Endpoint

The Clerk webhook endpoint is available at:
```
https://your-convex-deployment.convex.site/clerk-webhook
```

Configure this in Clerk Dashboard → Webhooks after deployment.

## Deployment

This is a standard Next.js application and can be deployed to any platform that supports Next.js.

### Environment Variables

Ensure the following environment variables are configured in your deployment platform:
- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`

### Post-Deployment Setup

After deployment, configure the Clerk webhook:
1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain/api/webhooks/clerk`
3. Subscribe to: `user.created`, `user.updated`, `user.deleted`
4. Copy the signing secret and add it as `CLERK_WEBHOOK_SECRET` environment variable

## Development Roadmap

See `MVP_PLAN.md` for the complete roadmap.

### Milestone 0.1 ✅ (Current)
- Authentication and user management
- Landing page
- User profiles

### Milestone 0.2 (Next)
- Skill submission via GitHub URL
- Skill ingestion pipeline
- Skill detail pages

### Milestone 0.3
- Directory listing with search and filters
- Sorting (trending, new, rating)

### Future Milestones
- Comments and ratings
- Favorites/stars
- Moderation
- Skills Lab discussions

## Contributing

Contributions are welcome! Please read our contributing guidelines (coming soon).

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please open a GitHub issue or reach out to the team.
