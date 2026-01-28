"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/docs",
  "/skills",
  "/users",
  "/terms",
  "/privacy",
];

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();

  // /skills/submit is protected, even though /skills/* is public
  if (pathname === "/skills/submit") {
    return (
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    );
  }

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // For public routes, use ConvexProvider without authentication
  // For protected routes, use ConvexProviderWithClerk
  if (isPublicRoute) {
    // If the user is signed in, still use the authenticated provider so identity-based
    // queries (like getCurrentUser) work in shared UI such as the header.
    if (isLoaded && isSignedIn) {
      return (
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          {children}
        </ConvexProviderWithClerk>
      );
    }
    return (
      <ConvexProvider client={convex}>
        {children}
      </ConvexProvider>
    );
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
