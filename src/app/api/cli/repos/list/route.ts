import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

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

export async function GET() {
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

    const convex = new ConvexHttpClient(convexUrl);
    convex.setAuth(convexToken);

    const repositories = await convex.query(api.skills.getMyRepositories);

    return NextResponse.json({
      repositories: repositories.map((repo) => ({
        id: repo._id,
        name: repo.name,
        slug: repo.slug,
        fullName: repo.fullName,
        description: repo.description,
        visibility: repo.visibility,
        versionsCount: repo.versions.length,
        latestVersion: repo.versions[0]?.version ?? null,
        createdAt: repo.createdAt,
        updatedAt: repo.updatedAt,
      })),
    });
  } catch (error) {
    return errorResponse(500, parseErrorMessage(error));
  }
}
