import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self' https:",
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.com https://*.clerk.dev https://*.clerk.accounts.dev https://clerk.lmskills.ai https://accounts.lmskills.ai https://challenges.cloudflare.com https://*.i.posthog.com https://eu-assets.i.posthog.com https://us-assets.i.posthog.com`,
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://accounts.lmskills.ai https://clerk.lmskills.ai https://*.clerk.accounts.dev https://*.clerk.com https://*.convex.cloud https://*.posthog.com https://*.i.posthog.com wss:",
              "frame-src 'self' https://accounts.lmskills.ai https://clerk.lmskills.ai https://*.clerk.accounts.dev https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
