# Next Steps to Complete Milestone 0.1

## 1. Set up Clerk JWT Template (REQUIRED)

This is the most important step to get the app working!

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **JWT Templates** (in the left sidebar under "Configure")
3. Click **+ New template**
4. Select **Convex** from the template list
5. Name it exactly: `convex`
6. Click **Create**

The template should automatically configure with the correct claims. This allows Convex to authenticate users from Clerk.

## 2. Start Convex Development Server

In a terminal, run:
```bash
npx convex dev
```

This will:
- Generate the `convex/_generated` folder with TypeScript types
- Start watching your Convex functions for changes
- Sync your schema to the Convex cloud

**Keep this running** in a separate terminal while you develop.

## 3. Start Next.js Development Server

In another terminal, run:
```bash
npm run dev
```

The app should now be running at [http://localhost:3000](http://localhost:3000)

## 4. Test the Application

### Test Authentication:
1. Click "Sign Up" in the header
2. Sign up with GitHub or Email
3. You should be redirected to the homepage with a user menu

### Test User Profile:
1. After signing in, click your avatar in the header → "Manage Account"
2. Your profile should load at `/users/[your-handle]`
3. Click "Edit Profile" to update your handle or bio
4. Changes should save successfully

### Test Webhook (Optional - for production):

The webhook endpoint is built but won't work until you deploy. To test webhooks locally:

1. Deploy to Vercel (see Deployment section below)
2. Get your Convex webhook URL from the Convex dashboard
3. Add it to Clerk Dashboard → Webhooks:
   - URL: `https://your-convex-deployment.convex.site/clerk-webhook`
   - Events: `user.created`, `user.updated`, `user.deleted`
4. Copy the webhook secret and add to Vercel environment variables

## 5. Deploy to Vercel

Once everything works locally:

1. Push your code to GitHub (make sure `.env.local` is in `.gitignore`!)
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Milestone 0.1"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. Go to [Vercel](https://vercel.com) and import your repository

3. Add environment variables in Vercel project settings:
   - `CONVEX_DEPLOYMENT` (from `.env.local`)
   - `NEXT_PUBLIC_CONVEX_URL` (from `.env.local`)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (from `.env.local`)
   - `CLERK_SECRET_KEY` (from `.env.local`)
   - `CLERK_WEBHOOK_SECRET` (get from Clerk webhook setup - see step 4)

4. Deploy!

5. After deployment, set up the Clerk webhook (important for syncing users):
   - In Clerk Dashboard → Webhooks
   - Add endpoint: Use the Convex URL from your Convex dashboard
   - Format: `https://your-convex-deployment.convex.site/clerk-webhook`
   - Subscribe to: `user.created`, `user.updated`, `user.deleted`
   - Copy the signing secret and add to both:
     - Convex environment variables (in Convex dashboard)
     - Vercel environment variables

## Troubleshooting

### "Module not found: @/convex/_generated/api"
- Make sure `npx convex dev` is running
- The `convex/_generated` folder should be auto-created
- If not, check that your `.env.local` has valid Convex credentials

### Authentication not working
- Make sure you created the JWT template named "convex" in Clerk
- Check that all Clerk environment variables are set correctly
- Try signing out and back in

### User profile shows "User not found"
- The webhook might not be set up yet (that's OK for local dev)
- Sign in/out once to trigger user creation
- Alternatively, users are created on first auth via the JWT

## What's Next? (Milestone 0.2)

Once Milestone 0.1 is working, the next steps are:

1. **Skill Submission Form** - Allow users to submit GitHub URLs
2. **GitHub API Integration** - Fetch README.md from repos
3. **Skill Detail Pages** - Display skill information
4. **Markdown Rendering** - Safely render skill documentation

See `MVP_PLAN.md` for the complete roadmap!

## Need Help?

- Check `CLERK_SETUP.md` for detailed Clerk configuration
- Review `README.md` for project structure
- Check the Convex dashboard for database errors
- Check the Clerk dashboard for authentication logs
