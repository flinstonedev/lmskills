import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/skills(.*)",  // All skills routes (we'll protect /skills/submit explicitly below)
  "/users(.*)",
  "/docs(.*)",
  "/terms",
  "/privacy",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(
  async (auth, req) => {
    // Handle .md extension for skills
    const url = req.nextUrl;
    const pathname = url.pathname;

    // Check if URL matches /skills/:owner/:name.md pattern
    const mdMatch = pathname.match(/^\/skills\/([^/]+)\/([^/]+)\.md$/);
    if (mdMatch) {
      const [, owner, name] = mdMatch;
      // Rewrite to API route with markdown content type
      const apiUrl = new URL(`/api/skills/${owner}/${name}`, req.url);
      const headers = new Headers(req.headers);
      headers.set("accept", "text/markdown");

      return NextResponse.rewrite(apiUrl, {
        request: {
          headers,
        },
      });
    }

    // Explicitly protect /skills/submit even though /skills(.*)is public
    if (pathname === "/skills/submit") {
      await auth.protect();
    } else if (!isPublicRoute(req)) {
      await auth.protect();
    }
  },
  {
    authorizedParties: [
      "https://www.lmskills.ai",
      "https://lmskills.ai",
      "https://accounts.lmskills.ai",
    ],
  }
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    // Note: .md files are NOT excluded, so they will be processed by middleware
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
