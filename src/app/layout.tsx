import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: {
    default: "LMSkills - Skills Directory for Claude",
    template: "%s | LMSkills",
  },
  description:
    "A platform for sharing and discovering Claude skills. Create, share, and explore powerful LLM capabilities.",
  keywords: [
    "Claude skills",
    "LLM skills",
    "AI skills",
    "Claude AI",
    "agent skills",
    "AI capabilities",
    "Claude Code",
    "AI tools",
  ],
  authors: [{ name: "LMSkills" }],
  creator: "LMSkills",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://www.lmskills.ai"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "LMSkills",
    title: "LMSkills - Skills Directory for Claude",
    description:
      "A platform for sharing and discovering Claude skills. Create, share, and explore powerful LLM capabilities.",
    images: [
      {
        url: "/icon.svg",
        width: 1200,
        height: 630,
        alt: "LMSkills - Skills Directory for Claude",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LMSkills - Skills Directory for Claude",
    description:
      "A platform for sharing and discovering Claude skills. Create, share, and explore powerful LLM capabilities.",
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
  return (
    <ClerkProvider
      allowedRedirectOrigins={[
        "https://www.lmskills.ai",
        "https://lmskills.ai",
        "https://accounts.lmskills.ai"
      ]}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body
          className="antialiased"
          style={{
            fontFamily:
              "'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          }}
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
                  <CookieConsentBanner />
                </ErrorBoundary>
              </PostHogProvider>
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
