import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

function errorResponse(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

function parseErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Unknown error";
  }
  return error.message
    .replace(/^Uncaught Error:\s*/, "")
    .replace(/^Error:\s*/, "")
    .replace(/^\[CONVEX.*?\]\s*/, "")
    .trim();
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return errorResponse(401, "Not authenticated");
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return errorResponse(500, "Server is missing NEXT_PUBLIC_CONVEX_URL");
    }

    const convexToken = await getToken({ template: "convex" });
    if (!convexToken) {
      return errorResponse(
        401,
        'Unable to mint a Convex token from Clerk session. Ensure Clerk JWT template "convex" exists.'
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";

    if (!slug) {
      return errorResponse(400, "Missing required field: slug");
    }

    const convex = new ConvexHttpClient(convexUrl);
    convex.setAuth(convexToken);

    // Look up the repo by slug to get the skill ID
    const repo = await convex.query(api.skills.getMyRepositoryBySlug, { slug });
    if (!repo) {
      return errorResponse(
        404,
        "Repository not found. Make sure you own the repository and the slug is correct."
      );
    }

    await convex.mutation(api.skills.deleteSkill, {
      skillId: repo._id as Id<"skills">,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(500, parseErrorMessage(error));
  }
}
