import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";

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

export async function GET(request: NextRequest) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return errorResponse(500, "Server is missing NEXT_PUBLIC_CONVEX_URL");
    }

    const query = request.nextUrl.searchParams.get("query") ?? undefined;
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam ?? "20", 10) || 20, 1), 100);

    const convex = new ConvexHttpClient(convexUrl);

    const result = await convex.query(api.skills.listSkills, {
      paginationOpts: { numItems: limit, cursor: null },
      query,
    });

    return NextResponse.json({
      skills: result.page.map((skill) => ({
        name: skill.name,
        slug: skill.slug,
        fullName: skill.fullName,
        description: skill.description,
        owner: skill.owner,
        source: skill.source,
        license: skill.license,
        stars: skill.stars,
        createdAt: skill.createdAt,
      })),
    });
  } catch (error) {
    return errorResponse(500, parseErrorMessage(error));
  }
}
