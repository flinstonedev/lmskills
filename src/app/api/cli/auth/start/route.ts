import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

function errorResponse(status: number, error: string) {
  return NextResponse.json(
    { error },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

function isLoopbackRedirectUri(value: string): boolean {
  try {
    const uri = new URL(value);
    if (uri.protocol !== "http:") {
      return false;
    }

    if (uri.username || uri.password) {
      return false;
    }

    const host = uri.hostname;
    return host === "127.0.0.1" || host === "localhost" || host === "::1" || host === "[::1]";
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const redirectUri = request.nextUrl.searchParams.get("redirect_uri")?.trim();
  const state = request.nextUrl.searchParams.get("state")?.trim();

  if (!redirectUri || !isLoopbackRedirectUri(redirectUri)) {
    return errorResponse(
      400,
      'Invalid redirect_uri. Only loopback HTTP URLs are allowed (for example "http://127.0.0.1:45678/callback").'
    );
  }

  const { userId, getToken } = await auth();
  if (!userId) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", request.nextUrl.toString());
    return NextResponse.redirect(signInUrl.toString(), {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  const token = await getToken();
  if (!token) {
    return errorResponse(401, "Unable to mint Clerk session token");
  }

  const callbackUrl = new URL(redirectUri);
  if (state) {
    callbackUrl.searchParams.set("state", state);
  }
  callbackUrl.searchParams.set("token", token);

  return NextResponse.redirect(callbackUrl.toString(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
