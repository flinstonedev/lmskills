import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/skills(.*)", // All skills routes (we'll protect /skills/submit explicitly below)
  "/users(.*)",
  "/docs(.*)",
  "/terms",
  "/privacy",
  "/api/webhooks(.*)",
]);

// Routes that should work even during maintenance mode
const isMaintenanceExemptRoute = createRouteMatcher([
  "/api/webhooks(.*)", // Allow webhooks for critical operations
  "/maintenance", // The maintenance page itself
  "/_next(.*)", // Next.js internals
]);

// Maintenance page HTML
function getMaintenancePage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maintenance | LMSkills</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%);
      color: #e0e0e0;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 600px;
    }
    .icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.05); }
    }
    h1 {
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 1rem;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    p {
      font-size: 1rem;
      line-height: 1.6;
      color: #a0a0a0;
      margin-bottom: 0.5rem;
    }
    .status {
      display: inline-block;
      margin-top: 1.5rem;
      padding: 0.5rem 1rem;
      background: rgba(102, 126, 234, 0.1);
      border: 1px solid rgba(102, 126, 234, 0.3);
      border-radius: 9999px;
      font-size: 0.875rem;
      color: #667eea;
    }
    .status::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #667eea;
      border-radius: 50%;
      margin-right: 8px;
      animation: blink 1.5s ease-in-out infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔧</div>
    <h1>Under Maintenance</h1>
    <p>We're currently performing scheduled maintenance to improve your experience.</p>
    <p>Please check back soon.</p>
    <div class="status">Maintenance in progress</div>
  </div>
</body>
</html>`;
}

const proxyHandler = clerkMiddleware(
  async (auth, req) => {
    const pathname = req.nextUrl.pathname;

    // Check maintenance mode
    if (process.env.MAINTENANCE_MODE === "true") {
      // Allow exempt routes through
      if (!isMaintenanceExemptRoute(req)) {
        return new NextResponse(getMaintenancePage(), {
          status: 503,
          headers: {
            "Content-Type": "text/html",
            "Retry-After": "3600", // Suggest retry in 1 hour
          },
        });
      }
    }

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

    // Explicitly protect /skills/submit even though /skills(.*) is public
    if (pathname === "/skills/submit") {
      await auth.protect();
    } else if (!isPublicRoute(req)) {
      await auth.protect();
    }
  },
  {
    authorizedParties:
      process.env.NODE_ENV === "production"
        ? [
            "https://www.lmskills.ai",
            "https://lmskills.ai",
            "https://accounts.lmskills.ai",
          ]
        : [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://www.lmskills.ai",
            "https://lmskills.ai",
            "https://accounts.lmskills.ai",
          ],
  }
);

export default proxyHandler;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    // Note: .md files are NOT excluded, so they will be processed by proxy
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

