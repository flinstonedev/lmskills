import type { Metadata } from "next";
import "./globals.css";
import { Fira_Code } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/sonner";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LMSkills - Open Source Skills Directory Example",
    template: "%s | LMSkills",
  },
  description:
    "An open source example project demonstrating a skills directory for Claude. Built with Next.js, Convex, and Clerk. View the source code on GitHub.",
  keywords: [
    "Claude skills",
    "LLM skills",
    "AI skills",
    "open source",
    "Next.js example",
    "Convex example",
    "skills directory",
    "example project",
  ],
  authors: [{ name: "flinstonedev", url: "https://github.com/flinstonedev" }],
  creator: "flinstonedev",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://www.lmskills.ai"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "LMSkills",
    title: "LMSkills - Open Source Skills Directory Example",
    description:
      "An open source example project demonstrating a skills directory for Claude. Built with Next.js, Convex, and Clerk.",
    images: [
      {
        url: "/icon.svg",
        width: 1200,
        height: 630,
        alt: "LMSkills - Open Source Skills Directory Example",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LMSkills - Open Source Skills Directory Example",
    description:
      "An open source example project demonstrating a skills directory for Claude. Built with Next.js, Convex, and Clerk.",
    images: ["/icon.svg"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const allowedRedirectOrigins =
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
        ];

  return (
    <ClerkProvider
      allowedRedirectOrigins={allowedRedirectOrigins}
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${firaCode.className} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConvexClientProvider>
              <PostHogProvider>
                <ErrorBoundary>
                  <div className="flex min-h-screen flex-col">
                    <Header />
                    <main className="flex-1 min-h-[calc(100vh-theme(spacing.32))]">{children}</main>
                    <Footer />
                  </div>
                </ErrorBoundary>
                <CookieConsentBanner />
                <Toaster />
              </PostHogProvider>
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
