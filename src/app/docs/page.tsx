import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Github, FileText, Search, Star } from "lucide-react";

export default function Documentation() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Documentation</h1>
        <p className="text-lg text-muted-foreground">
          Learn how to use LMSkills to share, discover, and collaborate on Claude skills.
        </p>
      </div>

      {/* Quick Start */}
      <section className="mb-16">
        <h2 className="text-3xl font-semibold mb-6">Quick Start</h2>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <CardTitle>Sign Up</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Click the "Sign Up" button in the top right corner to create your free account.
                You can sign up using your email or GitHub account for quick authentication.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <CardTitle>Browse Skills</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Explore our directory of Claude skills. Use the search bar to find specific skills,
                or filter by tags and categories. Sort by trending, newest, or highest rated.
              </CardDescription>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/skills">Browse Skills</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <CardTitle>Submit Your Skill</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Share your own skills with the community. Simply provide your GitHub repository URL
                containing a SKILL.md file, and we'll handle the rest.
              </CardDescription>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/skills/submit">Submit a Skill</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Submitting Skills */}
      <section className="mb-16">
        <h2 className="text-3xl font-semibold mb-6">Submitting Skills</h2>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              GitHub Repository Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Your repository must contain:</h4>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>A <code className="bg-muted px-1.5 py-0.5 rounded">SKILL.md</code> file in the root directory</li>
                <li>A public repository (private repositories cannot be submitted)</li>
                <li>Valid markdown content in your SKILL.md file</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">SKILL.md Format:</h4>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
                <div># Skill Title</div>
                <div>&nbsp;</div>
                <div>Brief description of your skill.</div>
                <div>&nbsp;</div>
                <div>## Installation</div>
                <div>&nbsp;</div>
                <div>Installation instructions...</div>
                <div>&nbsp;</div>
                <div>## Usage</div>
                <div>&nbsp;</div>
                <div>How to use the skill...</div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">Tip</p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Include clear examples, prerequisites, and troubleshooting information
                    to make your skill more accessible to users.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submission Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="font-bold text-primary">1.</span>
                <div>
                  <p className="font-medium">Prepare Your Repository</p>
                  <p className="text-sm text-muted-foreground">
                    Ensure your GitHub repository is public and contains a SKILL.md file
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">2.</span>
                <div>
                  <p className="font-medium">Go to Submit Page</p>
                  <p className="text-sm text-muted-foreground">
                    Navigate to the <Link href="/skills/submit" className="text-primary hover:underline">Submit Skill</Link> page
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">3.</span>
                <div>
                  <p className="font-medium">Enter Repository URL</p>
                  <p className="text-sm text-muted-foreground">
                    Paste your GitHub repository URL (e.g., https://github.com/username/repo)
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">4.</span>
                <div>
                  <p className="font-medium">Preview and Submit</p>
                  <p className="text-sm text-muted-foreground">
                    Review the parsed SKILL.md content and click Submit
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      </section>

      {/* Using Skills */}
      <section className="mb-16">
        <h2 className="text-3xl font-semibold mb-6">Using Skills</h2>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Finding Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                The <Link href="/skills" className="text-primary hover:underline">Browse Skills</Link> page
                offers multiple ways to discover skills:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Use the search bar to find skills by name or description</li>
                <li>Filter by tags to find skills in specific categories</li>
                <li>Sort by trending, newest, or highest rated</li>
                <li>Click on any skill card to view full details</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Skill Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Each skill page includes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Complete documentation from the SKILL.md file</li>
                <li>Installation and usage instructions</li>
                <li>Links to the GitHub repository</li>
                <li>Author information and submission date</li>
                <li>Tags and categories</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Your Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Access your personal dashboard to manage your skills:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>View all skills you've submitted</li>
                <li>Track views and engagement on your skills</li>
                <li>Edit or update skill information</li>
                <li>Delete skills you no longer want to share</li>
              </ul>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Best Practices */}
      <section className="mb-16">
        <h2 className="text-3xl font-semibold mb-6">Best Practices</h2>

        <Card>
          <CardHeader>
            <CardTitle>Creating High-Quality Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Documentation</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Write clear, concise descriptions</li>
                  <li>Include practical examples</li>
                  <li>Document all prerequisites and dependencies</li>
                  <li>Provide troubleshooting guidance</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Code Quality</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Follow coding best practices</li>
                  <li>Include comments in your code</li>
                  <li>Test your skill thoroughly before submitting</li>
                  <li>Keep dependencies minimal</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Maintenance</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Keep your skills updated</li>
                  <li>Respond to issues and questions</li>
                  <li>Update documentation when making changes</li>
                  <li>Consider versioning for major updates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section className="mb-16">
        <h2 className="text-3xl font-semibold mb-6">Frequently Asked Questions</h2>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I submit private repositories?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No, all skills must be from public GitHub repositories. This ensures that anyone
                can access and use the skills you share.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I update a skill after submission?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes, you can update your skills from your dashboard. Changes to your GitHub repository
                will be reflected on LMSkills. You can also manually trigger updates if needed.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What types of skills can I submit?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                LMSkills is currently focused on Claude skills. You can submit any skill that extends
                or enhances Claude's capabilities, including custom tools, prompts, workflows, and integrations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How do I delete a skill?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You can delete your skills from your dashboard. Navigate to the skill you want to remove
                and click the delete button. This action cannot be undone.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Get Help */}
      <section className="mb-8">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Need More Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              If you have questions that aren't covered here, feel free to reach out or check our GitHub repository.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/skills">Browse Skills</Link>
              </Button>
              <Button asChild>
                <Link href="/skills/submit">Submit a Skill</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
