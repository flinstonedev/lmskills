import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  try {
    const { owner, name } = await params;

    // Create Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Fetch skill from Convex
    const skill = await convex.query(api.skills.getSkill, {
      owner,
      name,
    });

    if (!skill) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      );
    }

    // Check Accept header for content negotiation
    const acceptHeader = request.headers.get("accept") || "";
    const wantsMarkdown =
      acceptHeader.includes("text/markdown") ||
      acceptHeader.includes("text/plain");

    if (wantsMarkdown) {
      // Validate URL is a GitHub URL before redirecting (prevent open redirect)
      if (!skill.repoUrl.startsWith("https://github.com/")) {
        return NextResponse.json(
          { error: "Invalid redirect URL" },
          { status: 400 }
        );
      }
      // Redirect to GitHub for markdown content (security measure)
      return NextResponse.redirect(skill.repoUrl, 302);
    }

    // Return JSON with metadata only (no content for security)
    return NextResponse.json({
      id: skill._id,
      name: skill.name,
      description: skill.description,
      owner: skill.owner,
      repoUrl: skill.repoUrl,
      license: skill.license,
      stars: skill.stars,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
      lastSyncedAt: skill.lastSyncedAt,
    });
  } catch (error) {
    console.error("Error fetching skill:", error);
    return NextResponse.json(
      { error: "Failed to fetch skill" },
      { status: 500 }
    );
  }
}
