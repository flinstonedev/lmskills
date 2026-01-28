import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ id: string; email_address: string }>;
    primary_email_address_id?: string;
    image_url?: string;
    external_accounts?: Array<{ provider?: string }>;
    username?: string | null;
  };
};

// Clerk webhook endpoint
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Get the headers
    const svix_id = request.headers.get("svix-id");
    const svix_timestamp = request.headers.get("svix-timestamp");
    const svix_signature = request.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    // Get the body
    const payload = await request.text();

    // Verify the webhook signature
    const wh = new Webhook(webhookSecret);
    let evt: ClerkWebhookEvent;

    try {
      evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    // Handle the webhook event
    const eventType = evt.type;
    const { id, email_addresses, image_url, external_accounts, username } =
      evt.data;

    if (eventType === "user.created" || eventType === "user.updated") {
      // Extract primary email
      const primaryEmail = email_addresses.find(
        (email) => email.id === evt.data.primary_email_address_id
      );

      // Determine auth provider
      let authProvider = "email";
      if (external_accounts && external_accounts.length > 0) {
        authProvider = external_accounts[0].provider || "email";
      }

      // Generate handle from username or email
      let handle = username;
      if (!handle && primaryEmail) {
        // Generate handle from email (part before @)
        handle = primaryEmail.email_address.split("@")[0];
      }
      if (!handle) {
        // Guaranteed fallback (Clerk id is stable and unique)
        handle = `user-${id.slice(0, 8)}`;
      }
      // Sanitize handle to be URL-safe
      handle = handle
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      if (!handle) {
        handle = `user-${id.slice(0, 8)}`;
      }

      // Upsert user in Convex
      await ctx.runMutation(internal.users.upsertUser, {
        clerkId: id,
        email: primaryEmail?.email_address || "",
        handle: handle,
        avatarUrl: image_url,
        authProvider: authProvider,
      });

      return new Response("User synced", { status: 200 });
    } else if (eventType === "user.deleted") {
      // Delete user from Convex
      await ctx.runMutation(internal.users.deleteUser, {
        clerkId: id,
      });

      return new Response("User deleted", { status: 200 });
    }

    return new Response("Event type not handled", { status: 200 });
  }),
});

export default http;
