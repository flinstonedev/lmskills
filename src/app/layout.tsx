import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Script from "next/script";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";

export const metadata: Metadata = {
  metadataBase: new URL('https://lmskills.com'),
  title: {
    default: "LMSkills - Clade Skills Directory for Claude AI",
    template: "%s | LMSkills"
  },
  description:
    "A platform for sharing and discovering Claude skills. Create, share, and explore powerful LLM capabilities.",
  openGraph: {
    title: "LMSkills - Skills Directory for Claude",
    description:
      "A platform for sharing and discovering Claude skills. Create, share, and explore powerful LLM capabilities.",
    url: "https://lmskills.com",
    siteName: "LMSkills",
    "Discover and share clade skills for Claude AI. Browse the largest directory of Claude skills, custom agents, and LLM capabilities. Create, share, and explore powerful AI tools for Claude.",
  keywords: [
    "clade skills",
    "Claude skills",
    "Claude AI",
    "LLM skills",
    "AI capabilities",
    "Claude agents",
    "prompt engineering",
    "AI tools",
    "language model skills",
    "Claude directory",
    "AI marketplace"
  ],
  authors: [{ name: "LMSkills" }],
  creator: "LMSkills",
  publisher: "LMSkills",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://lmskills.com",
    siteName: "LMSkills",
    title: "LMSkills - Clade Skills Directory for Claude AI",
    description:
      "Discover and share clade skills for Claude AI. Browse the largest directory of Claude skills, custom agents, and LLM capabilities.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LMSkills - Skills Directory for Claude",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LMSkills - Skills Directory for Claude",
    description:
      "A platform for sharing and discovering Claude skills. Create, share, and explore powerful LLM capabilities.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
        alt: "LMSkills - Clade Skills Directory for Claude AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LMSkills - Clade Skills Directory for Claude AI",
    description:
      "Discover and share clade skills for Claude AI. Browse the largest directory of Claude skills and custom agents.",
    images: ["/og-image.png"],
    creator: "@lmskills",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://lmskills.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
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
          <Script
            id="schema-org"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "LMSkills",
                description: "Discover and share clade skills for Claude AI. Browse the largest directory of Claude skills, custom agents, and LLM capabilities.",
                url: "https://lmskills.com",
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: "https://lmskills.com/skills?search={search_term_string}"
                  },
                  "query-input": "required name=search_term_string"
                },
                publisher: {
                  "@type": "Organization",
                  name: "LMSkills",
                  url: "https://lmskills.com",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://lmskills.com/logo.png"
                  }
                }
              })
            }}
          />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConvexClientProvider>
              <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <CookieConsentBanner />
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
