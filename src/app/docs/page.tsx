import Link from "next/link";

export default function Documentation() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
        {/* Header */}
        <div className="mb-12 pb-8 border-b">
          <h1 className="text-4xl font-bold mb-3">Documentation</h1>
          <p className="text-lg text-muted-foreground">
            A comprehensive guide to using LMSkills.
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 scroll-mt-24" id="quick-start">Quick Start</h2>

          <div className="space-y-6 not-prose">
            <div>
              <h3 className="text-lg font-semibold mb-2">1. Create an Account</h3>
              <p className="text-muted-foreground">
                Sign up using your email or GitHub account to start sharing and discovering skills.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">2. Browse Skills</h3>
              <p className="text-muted-foreground">
                Explore the <Link href="/skills" className="text-primary hover:underline">skills directory</Link> to find skills for your needs. Use search and filters to narrow down results.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">3. Submit Your Skills</h3>
              <p className="text-muted-foreground">
                Share your own skills by submitting a GitHub repository containing a <code className="bg-muted px-1.5 py-0.5 rounded text-sm">SKILL.md</code> file.
              </p>
            </div>
          </div>
        </section>

        {/* Submitting Skills */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 scroll-mt-24" id="submitting-skills">Submitting Skills</h2>

          <h3 className="text-xl font-semibold mb-3 mt-6">Requirements</h3>
          <p className="text-muted-foreground mb-4">
            To submit a skill, your GitHub repository must meet the following requirements:
          </p>

          <ul className="space-y-2 text-muted-foreground mb-6">
            <li>Public repository (private repositories are not supported)</li>
            <li>A <code className="bg-muted px-1.5 py-0.5 rounded text-sm">SKILL.md</code> file in the root directory</li>
            <li>Valid markdown content in your SKILL.md file</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">SKILL.md Format</h3>
          <p className="text-muted-foreground mb-4">
            Your SKILL.md file should follow standard markdown format:
          </p>

          <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-6">
            <pre className="whitespace-pre-wrap">
{`# Skill Title

Brief description of your skill.

## Installation

Installation instructions...

## Usage

How to use the skill...

## Examples

Practical examples...`}
            </pre>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Note:</strong> Include clear examples, prerequisites, and troubleshooting information to make your skill more accessible.
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-6">Submission Process</h3>
          <ol className="space-y-3 text-muted-foreground mb-6">
            <li>
              <strong>Prepare Your Repository:</strong> Ensure your GitHub repository is public and contains a SKILL.md file.
            </li>
            <li>
              <strong>Submit:</strong> Navigate to the <Link href="/skills/submit" className="text-primary hover:underline">Submit Skill</Link> page and enter your repository URL.
            </li>
            <li>
              <strong>Preview:</strong> Review the parsed content from your SKILL.md file.
            </li>
            <li>
              <strong>Publish:</strong> Click Submit to make your skill available in the directory.
            </li>
          </ol>
        </section>

        {/* Finding and Using Skills */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 scroll-mt-24" id="using-skills">Using Skills</h2>

          <h3 className="text-xl font-semibold mb-3 mt-6">Finding Skills</h3>
          <p className="text-muted-foreground mb-4">
            The <Link href="/skills" className="text-primary hover:underline">Browse Skills</Link> page provides several ways to discover skills:
          </p>

          <ul className="space-y-2 text-muted-foreground mb-6">
            <li>Search by name or description</li>
            <li>Filter by tags and categories</li>
            <li>Sort by trending, newest, or highest rated</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">Skill Details</h3>
          <p className="text-muted-foreground mb-4">
            Each skill page includes:
          </p>

          <ul className="space-y-2 text-muted-foreground mb-6">
            <li>Complete documentation from the SKILL.md file</li>
            <li>Installation and usage instructions</li>
            <li>Link to the source GitHub repository</li>
            <li>Author information and metadata</li>
            <li>Tags and categories</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">Managing Your Skills</h3>
          <p className="text-muted-foreground mb-4">
            Access your <Link href="/dashboard" className="text-primary hover:underline">dashboard</Link> to:
          </p>

          <ul className="space-y-2 text-muted-foreground mb-6">
            <li>View all skills you've submitted</li>
            <li>Track views and engagement metrics</li>
            <li>Update skill information</li>
            <li>Remove skills from the directory</li>
          </ul>
        </section>

        {/* Best Practices */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 scroll-mt-24" id="best-practices">Best Practices</h2>

          <h3 className="text-xl font-semibold mb-3 mt-6">Documentation</h3>
          <ul className="space-y-2 text-muted-foreground mb-6">
            <li>Write clear, concise descriptions</li>
            <li>Include practical examples with code snippets</li>
            <li>Document all prerequisites and dependencies</li>
            <li>Provide troubleshooting guidance for common issues</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">Code Quality</h3>
          <ul className="space-y-2 text-muted-foreground mb-6">
            <li>Follow coding best practices and conventions</li>
            <li>Include inline comments for complex logic</li>
            <li>Test thoroughly before submitting</li>
            <li>Keep dependencies minimal and well-documented</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">Maintenance</h3>
          <ul className="space-y-2 text-muted-foreground mb-6">
            <li>Keep your skills updated with the latest changes</li>
            <li>Respond to issues and questions from users</li>
            <li>Update documentation when making changes</li>
            <li>Use versioning for major updates</li>
          </ul>
        </section>

        {/* API Reference */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 scroll-mt-24" id="api-reference">API Reference</h2>

          <h3 className="text-xl font-semibold mb-3 mt-6">SKILL.md Metadata</h3>
          <p className="text-muted-foreground mb-4">
            LMSkills parses your SKILL.md file to extract metadata. While most content is freeform markdown, certain conventions are recognized:
          </p>

          <ul className="space-y-2 text-muted-foreground mb-6">
            <li><strong>Title:</strong> The first H1 heading is used as the skill title</li>
            <li><strong>Description:</strong> The first paragraph after the title becomes the skill description</li>
            <li><strong>Sections:</strong> H2 headings create navigable sections</li>
          </ul>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 scroll-mt-24" id="faq">FAQ</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Can I submit private repositories?</h3>
              <p className="text-muted-foreground">
                No, all skills must be from public GitHub repositories to ensure accessibility for all users.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Can I update a skill after submission?</h3>
              <p className="text-muted-foreground">
                Yes, you can update your skills from your dashboard. Changes to your GitHub repository will be reflected on LMSkills.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">What types of skills can I submit?</h3>
              <p className="text-muted-foreground">
                LMSkills supports Claude skills including custom tools, prompts, workflows, and integrations that extend Claude's capabilities.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">How do I delete a skill?</h3>
              <p className="text-muted-foreground">
                Navigate to your dashboard, select the skill you want to remove, and click the delete button. This action cannot be undone.
              </p>
            </div>
          </div>
        </section>
      </div>
  );
}
