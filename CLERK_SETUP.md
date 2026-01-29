# Clerk setup

This project uses **Clerk** for authentication and syncs users into **Convex** via a webhook.

## 1) Create a Clerk application

1. In the Clerk dashboard, create a new application.
2. Enable the sign-in methods you want (GitHub OAuth and/or Email magic link).

## 2) Create a JWT template for Convex

Convex needs a Clerk JWT template named **`convex`**.

In Clerk dashboard:

- Go to **JWT Templates**
- Create a template named **`convex`**
- Include standard claims (defaults are fine)

## 3) Configure environment variables

Add these to `.env.local`:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

If you're using the Convex HTTP webhook for syncing users, also set:

- `CLERK_WEBHOOK_SECRET`

## 4) Webhook configuration (sync users to Convex)

This repository includes a Convex HTTP endpoint that verifies Clerk webhook signatures and upserts users.

After deployment, configure a webhook in Clerk:

- **Endpoint**: `https://your-domain.vercel.app/api/webhooks/clerk`
- **Events**: `user.created`, `user.updated`, `user.deleted`
- Copy the signing secret into `CLERK_WEBHOOK_SECRET`

## 5) Convex issuer configuration

Convex auth is configured with `CLERK_ISSUER_URL`. You can find the issuer URL in Clerk dashboard for your instance and set:

- `CLERK_ISSUER_URL`

