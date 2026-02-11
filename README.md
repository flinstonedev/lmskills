# LMSkills

A public, LLM-agnostic platform for sharing, discovering, and collaborating on Claude skills and similar LLM-powered tools.

## Features

- ✅ User authentication with Clerk (GitHub OAuth + Email magic link)
- ✅ User profiles with customizable handles and bios
- ✅ Convex database integration
- ✅ Hosted skills with versioned artifact publishing and verification
- ✅ Responsive landing page
- ✅ Modern UI with shadcn/ui components
- ✅ Full TypeScript support

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Database**: Convex
- **Authentication**: Clerk
- **Deployment**: Vercel

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
│   └── middleware.ts      # Next.js middleware (auth, rewrites)
├── public/                # Static assets
└── ...config files
```

## Convex HTTP Endpoint

The Clerk webhook endpoint is available at:
```
https://your-convex-deployment.convex.site/clerk-webhook
```

Configure this in Clerk Dashboard → Webhooks after deployment.

## Hosted Skill Publishing

LMSkills supports two skill sources:

- GitHub-backed skills (submitted from a repo URL)
- Hosted skills (published as versioned tar artifacts)

### Create and Manage Hosted Skills

1. Open `/dashboard`
2. Use **Create Hosted Skill**
3. Upload and publish versions from **Publish Hosted Version**
4. Set or change the default verified version from the hosted versions list

### Verification Pipeline

When a hosted version is published, LMSkills automatically verifies:

- Artifact exists in storage
- Artifact size matches `sizeBytes`
- Artifact SHA-256 matches `contentHash`
- Optional manifest JSON structure is valid

Versions are marked `verified` or `rejected`, and only verified versions can be set as default.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub

2. Import the project in [Vercel](https://vercel.com)

3. Add environment variables in Vercel project settings:
   - `CONVEX_DEPLOYMENT`
   - `NEXT_PUBLIC_CONVEX_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_WEBHOOK_SECRET`

4. Deploy!

5. After deployment, set up the Clerk webhook:
   - Go to Clerk Dashboard → Webhooks
   - Add endpoint: `https://your-domain.vercel.app/api/webhooks/clerk`
   - Subscribe to: `user.created`, `user.updated`, `user.deleted`
   - Copy the signing secret and add to Vercel env vars as `CLERK_WEBHOOK_SECRET`

## Contributing

Contributions are welcome! Please read `CONTRIBUTING.md`.

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please open a GitHub issue or reach out to the team.
