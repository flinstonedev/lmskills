"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COMMON_LICENSES = [
  { value: "", label: "No license" },
  { value: "MIT", label: "MIT" },
  { value: "Apache-2.0", label: "Apache 2.0" },
  { value: "GPL-3.0", label: "GPL 3.0" },
  { value: "BSD-3-Clause", label: "BSD 3-Clause" },
  { value: "ISC", label: "ISC" },
  { value: "MPL-2.0", label: "MPL 2.0" },
  { value: "Unlicense", label: "The Unlicense" },
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Unknown error";
  }
  return error.message
    .replace(/^Uncaught Error:\s*/, "")
    .replace(/^Error:\s*/, "")
    .replace(/^\[CONVEX.*?\]\s*/, "")
    .trim();
}

export default function CreateRepositoryPage() {
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [license, setLicense] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createRepository = useMutation(api.skills.createRepository);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value));
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    const normalizedSlug = generateSlug(slug.trim());
    if (!normalizedSlug) {
      toast.error("Slug is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    setIsSubmitting(true);

    try {
      await createRepository({
        name: name.trim(),
        slug: normalizedSlug,
        description: description.trim(),
        license: license.trim() || undefined,
        visibility: "public",
      });

      if (!currentUser?.handle) {
        throw new Error("User handle not found");
      }

      toast.success("Repository created!", {
        description: "Redirecting to your repository page...",
      });

      const redirectUrl = `/skills/${currentUser.handle}/${normalizedSlug}`;
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push(redirectUrl);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);

      if (errorMessage.includes("already exists")) {
        toast.error("Repository Already Exists", {
          description: "A repository with this slug already exists. Try a different name.",
        });
      } else if (errorMessage.includes("Not authenticated")) {
        toast.error("Authentication Required", {
          description: "Please sign in to create a repository.",
        });
      } else {
        toast.error("Creation Failed", {
          description: errorMessage || "An unexpected error occurred.",
        });
      }

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
            Create a Repository
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Create a skill repository to publish versioned skill packages.
          </p>
        </div>

        <Card className="bg-(--surface-2) backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Authentication Required</CardTitle>
            <CardDescription className="text-sm">
              You need to be signed in to create a repository
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
        <Card className="bg-(--surface-2) backdrop-blur border-border/50">
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
          Create a Repository
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Create a skill repository to publish versioned skill packages. Each repository is a single skill
          with semver-versioned releases.
        </p>
      </div>

      <Card className="mb-8 bg-(--surface-2) backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Repository Details</CardTitle>
          <CardDescription className="text-sm">
            Fill in the details for your new skill repository
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repo-name">Name</Label>
            <Input
              id="repo-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Weather Skill"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repo-slug">Slug</Label>
            <Input
              id="repo-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugManuallyEdited(true);
              }}
              placeholder="weather-skill"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              URL-safe identifier. Auto-generated from name. Your repository will be at{" "}
              <code className="px-1 py-0.5 bg-muted rounded">
                {currentUser.handle}/{slug || "slug"}
              </code>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="repo-description">Description</Label>
            <Textarea
              id="repo-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this skill does and when to use it"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repo-license">License</Label>
            <select
              id="repo-license"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              disabled={isSubmitting}
            >
              {COMMON_LICENSES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/skills")}
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
              Creating
            </>
          ) : (
            "Create Repository"
          )}
        </Button>
      </div>
    </div>
  );
}
