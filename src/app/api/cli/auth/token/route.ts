import { NextResponse } from "next/server";
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

export async function GET() {
  const { userId, getToken } = await auth();
  if (!userId) {
    return errorResponse(401, "Not authenticated");
  }

  const token = await getToken();
  if (!token) {
    return errorResponse(401, "Unable to mint Clerk session token");
  }

  return NextResponse.json(
    { token },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
