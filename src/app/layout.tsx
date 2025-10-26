import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";

export const metadata: Metadata = {
  title: "LMSkills - Skills Directory for Claude",
  description:
    "A platform for sharing and discovering Claude skills. Create, share, and explore powerful LLM capabilities.",
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
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-1 min-h-[calc(100vh-theme(spacing.32))]">{children}</main>
                  <Footer />
                </div>
                <CookieConsentBanner />
              </PostHogProvider>
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
