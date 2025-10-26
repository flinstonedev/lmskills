import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; name: string } }
) {
  try {
    const { owner, name } = params;

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
      // Return raw markdown
      return new NextResponse(skill.skillMdContent, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `inline; filename="${skill.name}.md"`,
          "X-Skill-Owner": owner,
          "X-Skill-Name": name,
        },
      });
    }

    // Return JSON by default
    return NextResponse.json({
      id: skill._id,
      name: skill.name,
      description: skill.description,
      owner: skill.owner,
      repoUrl: skill.repoUrl,
      license: skill.license,
      stars: skill.stars,
      skillMdContent: skill.skillMdContent,
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
