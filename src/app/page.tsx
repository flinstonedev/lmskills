import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Discover, Share, and Collaborate on{" "}
              <span className="text-primary">LLM Skills</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
              A public, LLM-agnostic platform for sharing Claude skills and similar LLM-powered
              tools. Built by the community, for the community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="gradient">
                <Link href="/skills">Browse Skills</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/skills/submit">Submit a Skill</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-semibold text-center mb-12">
              Why LMSkills?
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Public & Shareable</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    All skills start public to maximize discoverability and community engagement.
                    Share your work with the world.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>LLM-Agnostic</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Built for Claude skills but designed to work with any LLM. The future is
                    multi-model.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Community-Driven</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Rate, comment, and collaborate on skills. Join the Skills Lab to help define
                    evaluation standards.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-semibold text-center mb-12">
              How It Works
            </h2>
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Submit Your Skill</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Share your GitHub repository URL with your skill's SKILL.md file. We'll
                    automatically parse and display it.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Get Discovered</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your skill appears in our searchable directory. Users can filter by tags,
                    language, and sort by trending or ratings.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Collaborate & Improve</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Receive feedback through comments and ratings. Fork, improve, and share your
                    contributions back to the community.
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Share Your Skills?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join our community of builders and start sharing today.
            </p>
            <Button asChild size="lg" variant="gradient">
              <Link href="/skills/submit">Submit Your First Skill</Link>
            </Button>
          </div>
        </section>
    </>
  );
}
