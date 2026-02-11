import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type HostedVisibility = "public";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asVisibility(value: unknown): HostedVisibility | null {
  if (value === undefined || value === null || value === "public") {
    return "public";
  }
  return null;
}

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

export async function POST(request: NextRequest) {
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
    const name = asString(body.name);
    const slug = asString(body.slug);
    const description = asString(body.description);
    const version = asString(body.version);
    const visibility = asVisibility(body.visibility);

    if (!name || !slug || !description || !version) {
      return errorResponse(
        400,
        "Missing required fields: name, slug, description, version"
      );
    }
    if (!visibility) {
      return errorResponse(400, 'Visibility must be "public"');
    }

    const convex = new ConvexHttpClient(convexUrl);
    convex.setAuth(convexToken);

    const lookup = await convex.query(api.skills.getMyRepositoryBySlug, { slug });

    const skillId: Id<"skills"> = lookup?._id
      ? lookup._id
      : await convex.mutation(api.skills.createRepository, {
          name,
          slug,
          description,
          visibility,
        });

    const upload = await convex.mutation(api.skills.generateRepositoryUploadUrl, {
      skillId,
      version,
    });

    return NextResponse.json({
      skillId,
      skillFullName: lookup?.fullName,
      uploadUrl: upload.uploadUrl,
    });
  } catch (error) {
    return errorResponse(500, parseErrorMessage(error));
  }
}
