import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";

function errorResponse(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return errorResponse(401, "Authentication required to download skills");
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return errorResponse(500, "Server is missing NEXT_PUBLIC_CONVEX_URL");
    }

    const convexToken = await getToken({ template: "convex" });
    if (!convexToken) {
      return errorResponse(401, "Unable to obtain auth token");
    }

    const { owner, name } = await params;
    const version = request.nextUrl.searchParams.get("version") ?? undefined;

    const convex = new ConvexHttpClient(convexUrl);
    convex.setAuth(convexToken);

    const skill = await convex.query(api.skills.getSkill, {
      owner: decodeURIComponent(owner),
      name: decodeURIComponent(name),
    });

    if (!skill) {
      return errorResponse(404, "Skill not found");
    }

    const result = await convex.query(api.skills.getVersionDownloadUrl, {
      skillId: skill._id,
      version,
    });

    if (!result?.url) {
      return errorResponse(404, "Version not found or not verified");
    }

    // Redirect to the Convex storage URL
    return NextResponse.redirect(result.url, 302);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to download";
    return errorResponse(500, message);
  }
}
