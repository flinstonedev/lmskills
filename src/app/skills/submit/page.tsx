"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLink, Star, Check } from "lucide-react";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RepoInfo {
  owner: string;
  name: string;
  description: string;
  license: string | null;
  stars?: number;
  url: string;
  lastUpdated?: string;
}

export default function SubmitSkillPage() {
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
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
      toast.error("URL Required", {
        description: "Please enter a GitHub repository URL to continue.",
      });
      return;
    }

    setError(null);
    setRepoInfo(null);
    setIsFetching(true);

    try {
      const info = await fetchRepoInfo({ url: repoUrl });
      setRepoInfo(info);
      toast.success("Repository Validated", {
        description: "SKILL.md found. Review the details and submit below.",
      });
    } catch (err: unknown) {
      let errorMessage = "Failed to fetch repository information";

      if (err instanceof Error) {
        const fullMessage = err.message;
        const match = fullMessage.match(/Uncaught Error: (.+?)(?:\n|$)/);
        if (match && match[1]) {
          errorMessage = match[1];
        } else {
          errorMessage = fullMessage.split('\n')[0];
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      errorMessage = errorMessage
        .replace(/^Error:\s*/, '')
        .replace(/^\[CONVEX.*?\]\s*/, '')
        .trim();

      if (errorMessage.includes("SKILL.md")) {
        toast.error("SKILL.md Not Found", {
          description: "The repository must contain a SKILL.md file. Please check the URL and try again.",
        });
      } else if (errorMessage.includes("Repository not found") || errorMessage.includes("404")) {
        toast.error("Repository Not Found", {
          description: "Could not find the repository at this URL. Please check the URL and try again.",
        });
      } else if (errorMessage.includes("Invalid")) {
        toast.error("Invalid URL", {
          description: errorMessage,
        });
      } else {
        toast.error("Fetch Failed", {
          description: errorMessage || "An unexpected error occurred. Please try again.",
        });
      }

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
      await submitSkill({
        repoUrl: repoInfo.url,
        name: repoInfo.name,
        description: repoInfo.description,
        license: repoInfo.license || undefined,
        stars: repoInfo.stars ?? 0,
        lastSyncedAt: Date.now(),
      });

      if (!currentUser?.handle) {
        throw new Error("User handle not found");
      }

      toast.success("Skill submitted successfully!", {
        description: "Redirecting to your skill page...",
      });

      const redirectUrl = `/skills/${currentUser.handle}/${repoInfo.name}`;
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push(redirectUrl);
    } catch (err: unknown) {
      let errorMessage = "Failed to submit skill";

      if (err instanceof Error) {
        const fullMessage = err.message;
        const match = fullMessage.match(/Uncaught Error: (.+?)(?:\n|$)/);
        if (match && match[1]) {
          errorMessage = match[1];
        } else {
          errorMessage = fullMessage.split('\n')[0];
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      errorMessage = errorMessage
        .replace(/^Error:\s*/, '')
        .replace(/^\[CONVEX.*?\]\s*/, '')
        .trim();

      if (errorMessage.includes("already been submitted")) {
        toast.error("Skill Already Exists", {
          description: "This skill has already been submitted to LMSkills. Try submitting a different skill directory.",
        });
      } else if (errorMessage.includes("Not authenticated")) {
        toast.error("Authentication Required", {
          description: "Please sign in to submit a skill.",
        });
      } else if (errorMessage.includes("User not found")) {
        toast.error("User Error", {
          description: "Your user profile could not be found. Please try signing out and back in.",
        });
      } else {
        toast.error("Submission Failed", {
          description: errorMessage || "An unexpected error occurred. Please try again.",
        });
      }

      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  if (!authLoaded) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
            Submit a Skill
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Share your Claude skill. Provide a GitHub URL to a specific skill directory containing a SKILL.md file.
          </p>
        </div>

        <Card className="bg-[var(--surface-2)] backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Authentication Required</CardTitle>
            <CardDescription className="text-sm">
              You need to be signed in to submit a skill
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create an account or sign in to share your Claude skills with the community.
            </p>
            <div className="flex gap-3">
              <SignUpButton mode="modal">
                <button className={cn(buttonVariants({ variant: "default" }))}>
                  Sign Up
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className={cn(buttonVariants({ variant: "outline" }))}>
                  Sign In
                </button>
              </SignInButton>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentUser === undefined) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (currentUser === null) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="bg-[var(--surface-2)] backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Profile Sync in Progress</CardTitle>
            <CardDescription className="text-sm">
              Your account is being set up
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your profile is being synced. Please refresh the page in a moment.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
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
                    Validating
                  </>
                ) : (
                  "Validate"
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
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-xl font-semibold">
                      {repoInfo.name}
                    </CardTitle>
                  </div>
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
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-4">
                <div>
                  <span className="font-medium text-foreground">Owner:</span> {repoInfo.owner}
                </div>
                {repoInfo.stars !== undefined && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span className="font-medium text-foreground">{repoInfo.stars.toLocaleString()}</span> stars
                  </div>
                )}
                {repoInfo.license && (
                  <div>
                    <span className="font-medium text-foreground">License:</span> {repoInfo.license}
                  </div>
                )}
              </div>
              <Alert className="bg-green-500/10 border-green-500/20">
                <Check className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                  SKILL.md validated successfully. The skill content will be displayed directly from GitHub for security.
                </AlertDescription>
              </Alert>
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
