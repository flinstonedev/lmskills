import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-8">Terms of Service</h1>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        {/* Open Source Notice */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-8">
          <p className="text-sm mb-0">
            <strong>Note:</strong> LMSkills is an open source demo deployment. These Terms of Service apply to this demo instance. View the{" "}
            <a
              href="https://github.com/flinstonedev/lmskills"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              source code on GitHub
            </a>
            .
          </p>
        </div>

        <p className="text-muted-foreground mb-8" suppressHydrationWarning={true}>
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {/* Simple Terms Summary */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">The Short Version</h2>
          <p className="text-muted-foreground mb-4">
            LMSkills is a free platform for sharing LLM skills. You can use it to share, discover, and discuss skills.
            You keep ownership of what you create. We provide the platform &quot;as is&quot; without any warranties.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What You Can Do</h2>
          <ul className="list-disc pl-6 text-muted-foreground mb-4">
            <li>Share skills by linking to your GitHub repositories</li>
            <li>Browse and use skills others have shared</li>
            <li>Comment on and rate skills</li>
            <li>Create a profile to manage your skills</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Content</h2>
          <p className="text-muted-foreground mb-4">
            You own what you create. By sharing skills on LMSkills, you let us display them on the platform.
            All skills are public—don&apos;t share anything you want to keep private.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Be Respectful</h2>
          <p className="text-muted-foreground mb-4">
            Don&apos;t share harmful content, malicious code, or anything illegal.
            Don&apos;t try to break or abuse the platform. We can remove content or accounts that cause problems.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">No Warranty</h2>
          <p className="text-muted-foreground mb-4">
            THE PLATFORM IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND.
            WE ARE NOT LIABLE FOR ANY DAMAGES FROM USING THIS PLATFORM OR CONTENT SHARED ON IT.
          </p>
          <p className="text-muted-foreground mb-4">
            Always review and test any code before using it. Use at your own risk.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Changes</h2>
          <p className="text-muted-foreground mb-4">
            We may update these terms. Continued use means you accept any changes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Questions?</h2>
          <p className="text-muted-foreground mb-4">
            Visit our{" "}
            <Link href="/" className="text-primary hover:underline">
              homepage
            </Link>{" "}
            or check the{" "}
            <a
              href="https://github.com/flinstonedev/lmskills"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub repo
            </a>
            .
          </p>
        </section>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            By using LMSkills, you agree to these terms.
          </p>
        </div>
      </div>
    </div>
  );
}
