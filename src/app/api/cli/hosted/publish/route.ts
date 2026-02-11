import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asOptionalString(value: unknown): string | undefined {
  const normalized = asString(value);
  return normalized.length > 0 ? normalized : undefined;
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
    const skillId = asString(body.skillId) as Id<"skills">;
    const version = asString(body.version);
    const storageKey = asString(body.storageKey);
    const contentHash = asString(body.contentHash);
    const manifest = asOptionalString(body.manifest);
    const changelog = asOptionalString(body.changelog);
    const sizeBytes =
      typeof body.sizeBytes === "number"
        ? body.sizeBytes
        : Number(body.sizeBytes);
    const setDefault = body.setDefault !== false;

    if (!skillId || !version || !storageKey || !contentHash || !Number.isFinite(sizeBytes)) {
      return errorResponse(
        400,
        "Missing required fields: skillId, version, storageKey, contentHash, sizeBytes"
      );
    }

    const convex = new ConvexHttpClient(convexUrl);
    convex.setAuth(convexToken);

    const versionId = await convex.mutation(api.skills.publishSkillVersion, {
      skillId,
      version,
      changelog,
      storageKey,
      contentHash,
      sizeBytes,
      manifest,
    });

    let defaultSet = false;
    let defaultSetMessage: string | undefined;

    if (setDefault) {
      try {
        await convex.mutation(api.skills.setDefaultVersion, {
          skillId,
          versionId,
        });
        defaultSet = true;
      } catch (error) {
        defaultSetMessage = parseErrorMessage(error);
      }
    }

    return NextResponse.json({
      skillId,
      versionId,
      defaultSet,
      defaultSetMessage,
    });
  } catch (error) {
    return errorResponse(500, parseErrorMessage(error));
  }
}
