import Link from "next/link";

export default function Documentation() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
        {/* Header */}
        <div className="mb-12 pb-8 border-b">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">Documentation</h1>
          <p className="text-lg text-muted-foreground">
            A comprehensive guide to using LMSkills. For official Claude skills documentation, visit{" "}
            <a
              href="https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Claude Docs - Agent Skills
            </a>.
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
                Share your own skills by submitting a GitHub repository containing a <code>SKILL.md</code> file.
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
            <li>A <code>SKILL.md</code> file in the root directory with proper YAML frontmatter</li>
            <li>Valid markdown content following the{" "}
              <a
                href="https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                official Claude skills format
              </a>
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">SKILL.md Format</h3>
          <p className="text-muted-foreground mb-4">
            Your SKILL.md file must include YAML frontmatter with required metadata fields:
          </p>

          <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-6">
            <pre className="whitespace-pre-wrap">
{`---
name: my-skill-name
description: Brief description of what this skill does and when to use it
---

# Skill Instructions

Detailed instructions for Claude on how to use this skill.

## Key Capabilities

- Feature 1
- Feature 2

## Usage Guidelines

Step-by-step procedural guidance...

## Examples

Practical examples and use cases...`}
            </pre>
          </div>

          <div className="bg-accent/10 border-l-4 border-accent p-4 mb-4">
            <p className="text-sm mb-2">
              <strong>Required Frontmatter Fields:</strong>
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li><code>name</code>: Lowercase letters, numbers, and hyphens only (max 64 characters)</li>
              <li><code>description</code>: What the skill does and when to use it (max 1024 characters)</li>
            </ul>
          </div>

          <div className="bg-destructive/10 border-l-4 border-destructive p-4 mb-6">
            <p className="text-sm">
              <strong>Security Note:</strong> Only use skills from trusted sources. Skills can direct Claude to execute code, so verify the source before use. See{" "}
              <a
                href="https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                official documentation
              </a>{" "}
              for more details.
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

        {/* CLI Tool */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 scroll-mt-24" id="cli-tool">CLI Tool</h2>

          <p className="text-muted-foreground mb-4">
            The LMSkills CLI tool makes it easy to install skills directly to your <code>.claude</code> directory from GitHub repositories.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">Installation</h3>
          <p className="text-muted-foreground mb-4">
            You can use the CLI without installing it globally via npx, or install it globally for the <code>lmskills</code> command:
          </p>

          <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-6">
            <pre className="whitespace-pre-wrap">
{`# Use with npx (no installation required)
npx lmskills-cli <command>

# Or install globally
npm install -g lmskills-cli`}
            </pre>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-6">Commands</h3>

          <div className="space-y-6 mb-6">
            <div>
              <h4 className="text-lg font-semibold mb-2">Install a Skill</h4>
              <p className="text-muted-foreground mb-3">
                Install a skill from a GitHub subdirectory URL to your local or global <code>.claude/skills/</code> directory:
              </p>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-3">
                <pre className="whitespace-pre-wrap">
{`# Install locally (project-specific)
npx lmskills-cli install https://github.com/owner/repo/tree/main/path/to/skill

# Install globally (user-wide)
npx lmskills-cli install https://github.com/owner/repo/tree/main/path/to/skill --global`}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2">List Installed Skills</h4>
              <p className="text-muted-foreground mb-3">
                View all installed skills with their source URLs and installation details:
              </p>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-3">
                <pre className="whitespace-pre-wrap">
{`# List local skills
npx lmskills-cli list

# List global skills
npx lmskills-cli list --global`}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2">Remove a Skill</h4>
              <p className="text-muted-foreground mb-3">
                Uninstall a skill by name:
              </p>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-3">
                <pre className="whitespace-pre-wrap">
{`# Remove local skill
npx lmskills-cli remove <skill-name>

# Remove global skill
npx lmskills-cli remove <skill-name> --global`}
                </pre>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-6">Installation Locations</h3>
          <ul className="space-y-2 text-muted-foreground mb-6">
            <li><strong>Local:</strong> <code>./claude/skills/</code> in your current project directory</li>
            <li><strong>Global:</strong> <code>~/.claude/skills/</code> in your home directory</li>
          </ul>

          <div className="bg-accent/10 border-l-4 border-accent p-4 mb-4">
            <p className="text-sm">
              <strong>Quick Tip:</strong> Each skill detail page has an "Install with CLI" button that provides the exact command to install that skill.
            </p>
          </div>
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

          <h3 className="text-xl font-semibold mb-3 mt-6">SKILL.md Architecture</h3>
          <p className="text-muted-foreground mb-4">
            Claude skills use a progressive disclosure architecture with three levels:
          </p>

          <ul className="space-y-2 text-muted-foreground mb-6">
            <li><strong>Level 1 (Metadata):</strong> YAML frontmatter always loads (~100 tokens), containing name and description</li>
            <li><strong>Level 2 (Instructions):</strong> Main SKILL.md content loads when triggered (&lt;5k tokens)</li>
            <li><strong>Level 3 (Resources):</strong> Additional files (scripts, templates) load on-demand</li>
          </ul>

          <p className="text-muted-foreground mb-6">
            Learn more about the{" "}
            <a
              href="https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              progressive disclosure architecture
            </a>{" "}
            in the official documentation.
          </p>
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
                LMSkills supports Claude skills including modular packages of instructions, metadata, and optional resources (scripts, templates) that extend Claude&apos;s capabilities for specialized tasks. See the{" "}
                <a
                  href="https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  official documentation
                </a>{" "}
                for examples.
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
