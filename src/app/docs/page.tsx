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
              <h3 className="text-lg font-semibold mb-2">3. Create a Repository</h3>
              <p className="text-muted-foreground">
                Share your own skills by creating a repository and publishing versioned skill packages via the CLI or web dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* Creating a Repository */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 scroll-mt-24" id="creating-a-repository">Creating a Repository</h2>

          <p className="text-muted-foreground mb-4">
            Skill repositories are versioned packages that contain your skill files. Each repository represents a single skill
            with semver-versioned releases.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">Via the Web</h3>
          <ol className="space-y-3 text-muted-foreground mb-6">
            <li>
              <strong>Create:</strong> Navigate to the <Link href="/skills/submit" className="text-primary hover:underline">Create Repository</Link> page and fill in the name, slug, and description.
            </li>
            <li>
              <strong>Publish:</strong> Use the CLI to publish versioned artifacts to your repository.
            </li>
          </ol>

          <h3 className="text-xl font-semibold mb-3 mt-6">Via the CLI</h3>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-6">
            <pre className="whitespace-pre-wrap">
{`# Authenticate (opens browser)
npx lmskills-cli login

# Create a repository (reads from skill.json if available)
npx lmskills-cli repo create --name "My Skill" --slug my-skill --description "Does something useful"

# Initialize skill.json template
npx lmskills-cli init

# Publish to your repository
npx lmskills-cli publish --remote --set-default`}
            </pre>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-6">skill.json Format</h3>
          <p className="text-muted-foreground mb-4">
            Your skill directory must contain a <code>skill.json</code> manifest with the following fields:
          </p>

          <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-6">
            <pre className="whitespace-pre-wrap">
{`{
  "name": "Weather Skill",
  "slug": "weather-skill",
  "version": "1.0.0",
  "description": "Get current weather info",
  "author": "username",
  "license": "MIT",
  "entry": "SKILL.md",
  "files": ["SKILL.md", "utils.js"]
}`}
            </pre>
          </div>

          <div className="bg-accent/10 border-l-4 border-accent p-4 mb-4">
            <p className="text-sm mb-2">
              <strong>Required Manifest Fields:</strong>
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li><code>name</code>: Display name of your skill</li>
              <li><code>slug</code>: URL-safe identifier (lowercase, hyphens allowed)</li>
              <li><code>version</code>: Semver version (e.g., 1.0.0)</li>
              <li><code>description</code>: What the skill does</li>
              <li><code>author</code>: Your username</li>
              <li><code>license</code>: License identifier (e.g., MIT)</li>
              <li><code>entry</code>: Main skill file (usually SKILL.md)</li>
              <li><code>files</code>: Array of all files to include</li>
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
        </section>

        {/* Content Gating */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 scroll-mt-24" id="content-gating">Content Gating</h2>

          <p className="text-muted-foreground mb-4">
            Repository skills have a content gating model to protect skill content while keeping metadata discoverable:
          </p>

          <ul className="space-y-2 text-muted-foreground mb-6">
            <li><strong>Public (no auth):</strong> Skill name, description, owner, license, version list (numbers and dates), creation date</li>
            <li><strong>Authenticated only:</strong> Version content, download URLs, tarball access</li>
          </ul>

          <p className="text-muted-foreground">
            Legacy GitHub-linked skills remain fully public with content viewable on GitHub.
          </p>
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
            <li>Skill metadata (name, description, license, owner)</li>
            <li>Version history with changelogs</li>
            <li>Installation instructions</li>
            <li>Download buttons (for authenticated users)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">Managing Your Skills</h3>
          <p className="text-muted-foreground mb-4">
            Access your <Link href="/dashboard" className="text-primary hover:underline">dashboard</Link> to:
          </p>

          <ul className="space-y-2 text-muted-foreground mb-6">
            <li>View all your repositories</li>
            <li>Create new repositories</li>
            <li>Publish new versions</li>
            <li>Manage default versions and verification status</li>
          </ul>
        </section>

        {/* CLI Tool */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 scroll-mt-24" id="cli-tool">CLI Tool</h2>

          <p className="text-muted-foreground mb-4">
            The LMSkills CLI tool makes it easy to create repositories, publish skills, and install skills from the directory.
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
              <h4 className="text-lg font-semibold mb-2">Login</h4>
              <p className="text-muted-foreground mb-3">
                Authenticate with LMSkills. Opens your browser for sign-in:
              </p>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-3">
                <pre className="whitespace-pre-wrap">
{`npx lmskills-cli login`}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2">Repository Management</h4>
              <p className="text-muted-foreground mb-3">
                Create and list skill repositories:
              </p>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-3">
                <pre className="whitespace-pre-wrap">
{`# Create a new repository
npx lmskills-cli repo create --name "My Skill" --slug my-skill --description "Description"

# List your repositories
npx lmskills-cli repo list`}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2">Init and Publish</h4>
              <p className="text-muted-foreground mb-3">
                Initialize a skill manifest and publish versions:
              </p>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-3">
                <pre className="whitespace-pre-wrap">
{`# Create skill.json template
npx lmskills-cli init

# Package and publish locally
npx lmskills-cli publish

# Publish to LMSkills
npx lmskills-cli publish --remote --set-default

# With changelog
npx lmskills-cli publish --remote --changelog "Bug fixes and improvements"`}
                </pre>
              </div>
            </div>

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
              <h4 className="text-lg font-semibold mb-2">List and Remove Skills</h4>
              <p className="text-muted-foreground mb-3">
                Manage locally installed skills:
              </p>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-3">
                <pre className="whitespace-pre-wrap">
{`# List installed skills
npx lmskills-cli list

# Remove a skill
npx lmskills-cli remove <skill-name>`}
                </pre>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-6">Installation Locations</h3>
          <ul className="space-y-2 text-muted-foreground mb-6">
            <li><strong>Local:</strong> <code>./claude/skills/</code> in your current project directory</li>
            <li><strong>Global:</strong> <code>~/.claude/skills/</code> in your home directory</li>
          </ul>
        </section>

        {/* Publishing */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 scroll-mt-24" id="publishing">
            Publishing
          </h2>

          <p className="text-muted-foreground mb-4">
            The recommended workflow for publishing skills:
          </p>

          <ol className="space-y-3 text-muted-foreground mb-6">
            <li>
              <strong>1. Login:</strong> Run <code>lmskills login</code> to authenticate.
            </li>
            <li>
              <strong>2. Create repository:</strong> Run <code>lmskills repo create</code> or create one on the web dashboard.
            </li>
            <li>
              <strong>3. Initialize:</strong> Run <code>lmskills init</code> to create a <code>skill.json</code> manifest.
            </li>
            <li>
              <strong>4. Publish:</strong> Run <code>lmskills publish --remote --set-default</code> to package and upload.
            </li>
          </ol>

          <h3 className="text-xl font-semibold mb-3 mt-6">Verification</h3>
          <p className="text-muted-foreground mb-4">
            Every published version is verified automatically and gets one of these statuses:
          </p>
          <ul className="space-y-2 text-muted-foreground mb-6">
            <li><code>pending</code>: verification is in progress</li>
            <li><code>verified</code>: ready for public usage</li>
            <li><code>rejected</code>: failed verification checks</li>
          </ul>
          <p className="text-muted-foreground">
            Only <code>verified</code> versions can be set as default. If <code>--set-default</code>{" "}
            is used while a version is still pending, publish still succeeds and default can be set
            later from the dashboard.
          </p>
        </section>

        {/* Config */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 scroll-mt-24" id="config">
            Configuration
          </h2>

          <p className="text-muted-foreground mb-4">
            Remote publishing supports this configuration:
          </p>
          <ul className="space-y-2 text-muted-foreground mb-6">
            <li><code>LMSKILLS_REMOTE_PUBLISH=true</code>: optional default to enable remote mode without passing <code>--remote</code></li>
          </ul>
          <p className="text-muted-foreground mb-6">
            By default, login auto-detects a local dev server at <code>http://127.0.0.1:3000</code>{" "}
            or <code>http://localhost:3000</code> before falling back to production.
          </p>
        </section>

        {/* Troubleshooting */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 scroll-mt-24" id="troubleshooting">
            Troubleshooting
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Remote publish fails with missing auth token</h3>
              <p className="text-muted-foreground">
                Run <code>lmskills login</code> first, then run{" "}
                <code>publish --remote</code> again.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Repository creation fails with &quot;already exists&quot;</h3>
              <p className="text-muted-foreground">
                A repository with the same slug already exists under your account. Try a different slug.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Artifact upload fails</h3>
              <p className="text-muted-foreground">
                Confirm you generated a <code>.tar</code> artifact with <code>lmskills publish</code>{" "}
                and that the version does not already exist.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Version is rejected</h3>
              <p className="text-muted-foreground">
                Check verification errors in the dashboard, fix the package or manifest, and
                republish or re-run verification.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Default version did not change</h3>
              <p className="text-muted-foreground">
                Only <code>verified</code> versions can be set as default. Wait for verification or
                set default later from the dashboard.
              </p>
            </div>
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
            <li>Test thoroughly before publishing</li>
            <li>Keep dependencies minimal and well-documented</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">Versioning</h3>
          <ul className="space-y-2 text-muted-foreground mb-6">
            <li>Use semantic versioning (major.minor.patch)</li>
            <li>Include changelogs with each version</li>
            <li>Bump major version for breaking changes</li>
            <li>Keep your default version pointing to the latest stable release</li>
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

          <h3 className="text-xl font-semibold mb-3 mt-6">API Behavior</h3>
          <p className="text-muted-foreground mb-4">
            The endpoint <code>/api/skills/:owner/:name</code> supports content negotiation:
          </p>
          <ul className="space-y-2 text-muted-foreground mb-6">
            <li><code>Accept: application/json</code>: returns skill metadata</li>
            <li><code>Accept: text/markdown</code>: redirects for GitHub-backed skills only</li>
            <li>Repository skills with markdown Accept headers return <code>406 Not Acceptable</code></li>
          </ul>

          <p className="text-muted-foreground mb-4">
            The download endpoint <code>/api/skills/:owner/:name/download</code> requires authentication:
          </p>
          <ul className="space-y-2 text-muted-foreground mb-6">
            <li>Returns 401 for unauthenticated requests</li>
            <li>Optional <code>version</code> query parameter (defaults to latest verified)</li>
            <li>Redirects to the artifact storage URL</li>
          </ul>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 scroll-mt-24" id="faq">FAQ</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">What happened to GitHub skill submission?</h3>
              <p className="text-muted-foreground">
                Existing GitHub-linked skills continue to work. New skills should be created as repositories with versioned packages for better management and security.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Can I download skills without an account?</h3>
              <p className="text-muted-foreground">
                Skill titles and descriptions are always public. To download skill content, you need to sign in with a free account.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">What types of skills can I publish?</h3>
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
              <h3 className="text-lg font-semibold mb-2">How do I delete a repository?</h3>
              <p className="text-muted-foreground">
                Navigate to your dashboard, find the repository, and click the delete button. This action cannot be undone and will remove all versions.
              </p>
            </div>
          </div>
        </section>
      </div>
  );
}
