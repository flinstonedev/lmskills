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

    // Fetch skill from Convex (name param may be a slug or display name)
    const decodedName = decodeURIComponent(name);
    const skill = await convex.query(api.skills.getSkill, {
      owner,
      name: decodedName,
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
      if (!skill.repoUrl) {
        return NextResponse.json(
          {
            error:
              skill.source === "repository"
                ? "Repository skills expose versioned artifacts; markdown redirect is only available for GitHub-backed skills"
                : "Skill content is not hosted on GitHub",
          },
          { status: 406 }
        );
      }
      // Validate URL is a GitHub URL before redirecting (prevent open redirect)
      let repoUrl: URL;
      try {
        repoUrl = new URL(skill.repoUrl);
      } catch {
        return NextResponse.json(
          { error: "Invalid redirect URL" },
          { status: 400 }
        );
      }

      // Strict allowlist: only redirect to canonical GitHub host over HTTPS
      if (repoUrl.protocol !== "https:" || repoUrl.hostname !== "github.com") {
        return NextResponse.json(
          { error: "Invalid redirect URL" },
          { status: 400 }
        );
      }

      // Do not allow embedded credentials in URL (shouldn't happen, but be strict)
      if (repoUrl.username || repoUrl.password) {
        return NextResponse.json(
          { error: "Invalid redirect URL" },
          { status: 400 }
        );
      }

      // Redirect to GitHub for markdown content (security measure)
      return NextResponse.redirect(repoUrl.toString(), 302);
    }

    // Return JSON with metadata only (no content for security)
    return NextResponse.json({
      id: skill._id,
      name: skill.name,
      description: skill.description,
      owner: skill.owner,
      source: skill.source,
      slug: skill.slug,
      fullName: skill.fullName,
      visibility: skill.visibility,
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
