# Clerk Setup Instructions

## Step 1: Create JWT Template

1. Go to your Clerk Dashboard: https://dashboard.clerk.com
2. Navigate to **JWT Templates** (in the left sidebar under "Configure")
3. Click **+ New template**
4. Click **Convex** from the list of templates
5. Name it exactly: `convex`
6. Click **Create**
7. The template should be created automatically with the correct settings

## Step 2: Set up Webhook Endpoint

1. In Clerk Dashboard, go to **Webhooks** (in the left sidebar)
2. Click **+ Add Endpoint**
3. For now, you can skip this until we deploy to Vercel
4. After deploying to Vercel, come back and add:
   - Endpoint URL: `https://YOUR-DOMAIN.vercel.app/api/webhooks/clerk`
   - Subscribe to events:
     - ✅ `user.created`
     - ✅ `user.updated`
     - ✅ `user.deleted`
5. Copy the **Signing Secret** (starts with `whsec_...`)
6. Add to `.env.local`: `CLERK_WEBHOOK_SECRET=whsec_...`

## Step 3: Configure OAuth Providers

### GitHub OAuth (Primary)
1. In Clerk Dashboard, go to **User & Authentication** → **Social Connections**
2. Enable **GitHub**
3. Follow Clerk's instructions to set up GitHub OAuth app

### Email Magic Link (Secondary)
1. In Clerk Dashboard, go to **User & Authentication** → **Email, Phone, Username**
2. Enable **Email address**
3. Under **Authentication strategies**, enable **Email verification link**

## Done!

Once you complete Step 1 (JWT Template), you're ready to run the app locally!

Steps 2 and 3 can be configured as needed.
