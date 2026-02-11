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

    const owner = request.nextUrl.searchParams.get("owner");
    const name = request.nextUrl.searchParams.get("name");

    if (!owner || !name) {
      return errorResponse(400, "Missing required parameters: owner, name");
    }

    const convex = new ConvexHttpClient(convexUrl);

    const skill = await convex.query(api.skills.getSkill, { owner, name });

    if (!skill) {
      return errorResponse(404, "Skill not found");
    }

    const fullName = skill.fullName ?? `${owner}/${name}`;
    const withVersions = await convex.query(api.skills.getSkillWithVersions, {
      fullName,
    });

    return NextResponse.json({
      skill: {
        name: skill.name,
        slug: skill.slug,
        fullName: skill.fullName,
        description: skill.description,
        source: skill.source,
        license: skill.license,
        stars: skill.stars,
        owner: skill.owner,
        createdAt: skill.createdAt,
        updatedAt: skill.updatedAt,
      },
      versions: (withVersions?.versions ?? []).map((v) => ({
        version: v.version,
        status: v.status,
        changelog: v.changelog,
        publishedAt: v.publishedAt,
        sizeBytes: v.sizeBytes,
      })),
    });
  } catch (error) {
    return errorResponse(500, parseErrorMessage(error));
  }
}
