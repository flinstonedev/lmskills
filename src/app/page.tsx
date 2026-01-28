import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Open Source Skills Directory Example",
  description:
    "LMSkills is an open source example project demonstrating a platform for sharing and discovering Claude skills. View the source code on GitHub.",
  openGraph: {
    title: "LMSkills - Open Source Skills Directory Example",
    description:
      "An open source example project for sharing and discovering Claude skills. View the source code on GitHub.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LMSkills - Open Source Skills Directory Example",
    description:
      "An open source example project for sharing and discovering Claude skills. View the source code on GitHub.",
  },
};

export default function Home() {
  return (
    <>
      {/* Open Source Banner */}
      <div className="bg-primary/10 border-b border-primary/20">
        <div className="container mx-auto px-4 py-3 text-center">
          <p className="text-sm">
            <span className="font-semibold">Open Source Example Project</span>
            {" — "}
            <a
              href="https://github.com/flinstonedev/lmskills"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              View source on GitHub
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-6">
            Open Source{" "}
            <span className="text-primary">Skills Directory</span>
            {" "}Example
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
            An example platform for sharing and discovering{" "}
            <a
              href="https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Claude skills
            </a>
            . This project demonstrates how to build a skills directory with Next.js, Convex, and Clerk.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="gradient">
              <Link href="/skills">Browse Skills</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a
                href="https://github.com/flinstonedev/lmskills"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Source Code
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-semibold text-center mb-12">
            What&apos;s Included
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Next.js + Convex</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Built with Next.js 16 (App Router) and Convex for real-time
                  serverless backend. TypeScript throughout.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Clerk integration for GitHub OAuth and email magic links.
                  User profiles and session management included.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills Directory</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Submit skills via GitHub URLs, browse and search the directory,
                  rate and comment on skills.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-semibold text-center mb-12">
            How It Works
          </h2>
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Submit Your Skill</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Share your GitHub repository URL with a SKILL.md file containing
                  instructions and metadata. Learn more in the{" "}
                  <a
                    href="https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Claude skills documentation
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Get Discovered</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your skill appears in our searchable directory. Users can
                  filter by tags, language, and sort by trending or ratings.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Collaborate & Improve
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Receive feedback through comments and ratings. Fork, improve,
                  and share your contributions with others.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-[image:var(--gradient-primary)] opacity-10 dark:opacity-20" />
        <div className="container relative mx-auto px-4 text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Build Your Own Skills Directory
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Fork this project and customize it for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="gradient">
              <a
                href="https://github.com/flinstonedev/lmskills"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a
                href="https://github.com/flinstonedev/lmskills/fork"
                target="_blank"
                rel="noopener noreferrer"
              >
                Fork Repository
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
