"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLink, Star } from "lucide-react";
import { SafeMarkdown } from "@/components/safe-markdown";

interface RepoInfo {
  owner: string;
  name: string;
  description: string;
  license: string | null;
  stars: number;
  url: string;
  skillMdContent: string;
  lastUpdated: string;
}

export default function SubmitSkillPage() {
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUser);

  const [repoUrl, setRepoUrl] = useState("");
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRepoInfo = useAction(api.github.fetchRepoInfo);
  const submitSkill = useMutation(api.skills.submitSkill);

  const handleFetch = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    setError(null);
    setRepoInfo(null);
    setIsFetching(true);

    try {
      const info = await fetchRepoInfo({ url: repoUrl });
      setRepoInfo(info);
    } catch (err: unknown) {
      // Extract error message from Convex error
      let errorMessage = "Failed to fetch repository information";

      if (err instanceof Error) {
        // The error message contains the full stack trace
        // Extract just the user-friendly part
        const fullMessage = err.message;

        // Look for "Uncaught Error: " followed by the actual message
        const match = fullMessage.match(/Uncaught Error: (.+?)(?:\n|$)/);
        if (match && match[1]) {
          errorMessage = match[1];
        } else {
          // Fallback: just use the first line
          errorMessage = fullMessage.split('\n')[0];
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      // Remove common prefixes
      errorMessage = errorMessage
        .replace(/^Error:\s*/, '')
        .replace(/^\[CONVEX.*?\]\s*/, '')
        .trim();

      setError(errorMessage);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!repoInfo) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const skillId = await submitSkill({
        repoUrl: repoInfo.url,
        name: repoInfo.name,
        description: repoInfo.description,
        license: repoInfo.license || undefined,
        skillMdContent: repoInfo.skillMdContent,
        stars: repoInfo.stars,
        lastSyncedAt: Date.now(),
      });

      console.log("Skill submitted successfully:", skillId);

      // Get the current user's handle for the redirect
      if (!currentUser?.handle) {
        throw new Error("User handle not found");
      }

      const redirectUrl = `/skills/${currentUser.handle}/${repoInfo.name}`;
      console.log("Redirecting to:", redirectUrl);

      // Add a small delay to ensure the database is updated
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to the skill detail page
      router.push(redirectUrl);
    } catch (err: unknown) {
      // Extract error message from Convex error
      let errorMessage = "Failed to submit skill";

      if (err instanceof Error) {
        // The error message contains the full stack trace
        // Extract just the user-friendly part
        const fullMessage = err.message;

        // Look for "Uncaught Error: " followed by the actual message
        const match = fullMessage.match(/Uncaught Error: (.+?)(?:\n|$)/);
        if (match && match[1]) {
          errorMessage = match[1];
        } else {
          // Fallback: just use the first line
          errorMessage = fullMessage.split('\n')[0];
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      // Remove common prefixes
      errorMessage = errorMessage
        .replace(/^Error:\s*/, '')
        .replace(/^\[CONVEX.*?\]\s*/, '')
        .trim();

      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight">
          Submit a Skill
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Share your Claude skill. Provide a GitHub URL to a specific skill directory containing a SKILL.md file.
        </p>
      </div>

      <Card className="mb-8 bg-[var(--surface-2)] backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Skill Directory URL</CardTitle>
          <CardDescription className="text-sm">
            Enter the URL to your skill directory (e.g., https://github.com/owner/repo/tree/main/skill-name)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repo-url" className="text-sm font-medium">
              Skill Directory URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="repo-url"
                type="text"
                placeholder="https://github.com/owner/repo/tree/main/skill-name"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleFetch();
                  }
                }}
                disabled={isFetching || isSubmitting}
                className="flex-1"
              />
              <Button
                onClick={handleFetch}
                disabled={isFetching || isSubmitting}
                variant="gradient"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching
                  </>
                ) : (
                  "Fetch"
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {repoInfo && (
        <>
          <Card className="mb-8 bg-[var(--surface-2)] backdrop-blur border-border/50">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-2xl font-bold mb-2">
                    {repoInfo.name}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {repoInfo.description}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild className="shrink-0">
                  <a
                    href={repoInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on GitHub
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Owner:</span> {repoInfo.owner}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span className="font-medium text-foreground">{repoInfo.stars.toLocaleString()}</span> stars
                </div>
                {repoInfo.license && (
                  <div>
                    <span className="font-medium text-foreground">License:</span> {repoInfo.license}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8 bg-[var(--surface-2)] backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">SKILL.md Preview</CardTitle>
              <CardDescription className="text-sm">
                This is how your skill documentation will appear to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SafeMarkdown
                content={repoInfo.skillMdContent}
                className="prose prose-sm dark:prose-invert max-w-none"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setRepoInfo(null);
                setRepoUrl("");
                setError(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                "Submit Skill"
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
