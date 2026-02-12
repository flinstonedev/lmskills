"use client";

import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, ExternalLink, Loader2, Upload, RefreshCw } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

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

async function sha256Hex(file: File): Promise<string> {
  const content = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", content);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const me = useQuery(api.users.getCurrentUser);
  const repositories = useQuery(api.skills.getMyRepositories);
  const { results: skills, status, loadMore } = usePaginatedQuery(
    api.skills.getSkillsByOwner,
    me?.handle ? { ownerHandle: me.handle } : "skip",
    { initialNumItems: 20 }
  );

  const deleteSkill = useMutation(api.skills.deleteSkill);
  const createRepository = useMutation(api.skills.createRepository);
  const generateRepositoryUploadUrl = useMutation(
    api.skills.generateRepositoryUploadUrl
  );
  const publishSkillVersion = useMutation(api.skills.publishSkillVersion);
  const setDefaultVersion = useMutation(api.skills.setDefaultVersion);
  const reverifySkillVersion = useMutation(
    api.skills.reverifySkillVersion
  );

  const [deletingSkillId, setDeletingSkillId] = useState<Id<"skills"> | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [hostedName, setHostedName] = useState("");
  const [hostedSlug, setHostedSlug] = useState("");
  const [hostedSlugManuallyEdited, setHostedSlugManuallyEdited] = useState(false);
  const [hostedDescription, setHostedDescription] = useState("");
  const [hostedVisibility, setHostedVisibility] = useState<"public" | "unlisted">(
    "public"
  );
  const [isCreatingHosted, setIsCreatingHosted] = useState(false);

  const [selectedHostedSkillId, setSelectedHostedSkillId] = useState<string>("");
  const [publishVersion, setPublishVersion] = useState("");
  const [publishChangelog, setPublishChangelog] = useState("");
  const [publishFile, setPublishFile] = useState<File | null>(null);
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [isPublishingVersion, setIsPublishingVersion] = useState(false);
  const [settingDefaultVersionId, setSettingDefaultVersionId] = useState<
    Id<"skillVersions"> | null
  >(null);
  const [reverifyingVersionId, setReverifyingVersionId] = useState<
    Id<"skillVersions"> | null
  >(null);

  const selectedRepository = useMemo(
    () => repositories?.find((skill) => skill._id === selectedHostedSkillId),
    [repositories, selectedHostedSkillId]
  );

  const hasRepositories = repositories && repositories.length > 0;

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleHostedNameChange(value: string) {
    setHostedName(value);
    if (!hostedSlugManuallyEdited) {
      setHostedSlug(generateSlug(value));
    }
  }

  const handleDelete = (skillId: Id<"skills">) => {
    setDeletingSkillId(skillId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingSkillId) return;

    try {
      await deleteSkill({ skillId: deletingSkillId });
      setIsDeleteDialogOpen(false);
      setDeletingSkillId(null);
      toast.success("Skill deleted");
    } catch (error) {
      toast.error("Failed to delete skill", {
        description: formatErrorMessage(error),
      });
    }
  };

  const handleCreateHostedSkill = async () => {
    if (!hostedName.trim() || !hostedSlug.trim() || !hostedDescription.trim()) {
      toast.error("Missing required fields", {
        description: "Name, slug, and description are required.",
      });
      return;
    }

    setIsCreatingHosted(true);
    try {
      const skillId = await createRepository({
        name: hostedName.trim(),
        slug: hostedSlug.trim(),
        description: hostedDescription.trim(),
        visibility: hostedVisibility,
      });
      setHostedName("");
      setHostedSlug("");
      setHostedSlugManuallyEdited(false);
      setHostedDescription("");
      setSelectedHostedSkillId(skillId);
      toast.success("Repository created", {
        description: "You can now publish a version using the panel below.",
      });
    } catch (error) {
      toast.error("Failed to create repository", {
        description: formatErrorMessage(error),
      });
    } finally {
      setIsCreatingHosted(false);
    }
  };

  const handlePublishHostedVersion = async () => {
    if (!selectedHostedSkillId) {
      toast.error("Select a hosted skill first");
      return;
    }
    if (!publishVersion.trim()) {
      toast.error("Version is required");
      return;
    }
    if (!SEMVER_PATTERN.test(publishVersion.trim())) {
      toast.error("Version must be valid semver");
      return;
    }
    if (!publishFile) {
      toast.error("Artifact file is required", {
        description: "Upload a .tar artifact generated by lmskills publish.",
      });
      return;
    }

    setIsPublishingVersion(true);
    try {
      const hash = await sha256Hex(publishFile);
      const { uploadUrl } = await generateRepositoryUploadUrl({
        skillId: selectedHostedSkillId as Id<"skills">,
        version: publishVersion.trim(),
      });

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-tar",
        },
        body: publishFile,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Artifact upload failed with status ${uploadResponse.status}`);
      }

      const uploadPayload = (await uploadResponse.json()) as {
        storageId?: string;
      };
      if (!uploadPayload.storageId) {
        throw new Error("Upload response did not include storageId");
      }

      const versionId = await publishSkillVersion({
        skillId: selectedHostedSkillId as Id<"skills">,
        version: publishVersion.trim(),
        changelog: publishChangelog.trim() || undefined,
        storageKey: uploadPayload.storageId,
        contentHash: hash,
        sizeBytes: publishFile.size,
      });

      if (setAsDefault) {
        try {
          await setDefaultVersion({
            skillId: selectedHostedSkillId as Id<"skills">,
            versionId,
          });
          toast.success("Version published and set as default");
        } catch (error) {
          toast.success("Version published", {
            description:
              "Version was uploaded but is not yet verified, so default version was not changed.",
          });
          const message = formatErrorMessage(error);
          if (message) {
            toast.info("Default version not updated", {
              description: message,
            });
          }
        }
      } else {
        toast.success("Version published");
      }

      setPublishVersion("");
      setPublishChangelog("");
      setPublishFile(null);
    } catch (error) {
      toast.error("Failed to publish version", {
        description: formatErrorMessage(error),
      });
    } finally {
      setIsPublishingVersion(false);
    }
  };

  const handleSetDefaultVersion = async (
    skillId: Id<"skills">,
    versionId: Id<"skillVersions">
  ) => {
    setSettingDefaultVersionId(versionId);
    try {
      await setDefaultVersion({ skillId, versionId });
      toast.success("Default version updated");
    } catch (error) {
      toast.error("Failed to set default version", {
        description: formatErrorMessage(error),
      });
    } finally {
      setSettingDefaultVersionId(null);
    }
  };

  const handleReverifyVersion = async (
    skillId: Id<"skills">,
    versionId: Id<"skillVersions">
  ) => {
    setReverifyingVersionId(versionId);
    try {
      const result = await reverifySkillVersion({ skillId, versionId });
      toast.success("Verification completed", {
        description:
          result?.status === "verified"
            ? "Version is verified."
            : "Version was rejected. Review verification errors.",
      });
    } catch (error) {
      toast.error("Failed to verify version", {
        description: formatErrorMessage(error),
      });
    } finally {
      setReverifyingVersionId(null);
    }
  };

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="flex flex-col h-full">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8">My Skills</h1>
        <p className="text-muted-foreground">
          Please sign in to view your skills.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">My Skills</h1>
      </div>

      <h2 className="text-lg font-semibold mb-4">Repositories</h2>
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>1. Create Repository</CardTitle>
            <CardDescription>
              Register a new skill repository, then publish versioned artifacts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hosted-name">Name</Label>
              <Input
                id="hosted-name"
                value={hostedName}
                onChange={(event) => handleHostedNameChange(event.target.value)}
                placeholder="Weather Skill"
                disabled={isCreatingHosted}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hosted-slug">Slug</Label>
              <Input
                id="hosted-slug"
                value={hostedSlug}
                onChange={(event) => {
                  setHostedSlug(event.target.value);
                  setHostedSlugManuallyEdited(true);
                }}
                placeholder="weather-skill"
                disabled={isCreatingHosted}
              />
              <p className="text-xs text-muted-foreground">
                URL-safe identifier. Auto-generated from name.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hosted-description">Description</Label>
              <Textarea
                id="hosted-description"
                value={hostedDescription}
                onChange={(event) => setHostedDescription(event.target.value)}
                placeholder="Describe what this skill does"
                disabled={isCreatingHosted}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hosted-visibility">Visibility</Label>
              <select
                id="hosted-visibility"
                value={hostedVisibility}
                onChange={(event) =>
                  setHostedVisibility(event.target.value as "public" | "unlisted")
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                disabled={isCreatingHosted}
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
              </select>
            </div>
            <Button onClick={handleCreateHostedSkill} disabled={isCreatingHosted}>
              {isCreatingHosted ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating
                </>
              ) : (
                "Create Repository"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Publish Version</CardTitle>
            <CardDescription>
              Upload a tar artifact, verify it, and optionally set it as default.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasRepositories ? (
              <p className="text-sm text-muted-foreground">
                Create a repository first to publish a version.
              </p>
            ) : (
            <div className="space-y-2">
              <Label htmlFor="publish-skill">Repository</Label>
              <select
                id="publish-skill"
                value={selectedHostedSkillId}
                onChange={(event) => setSelectedHostedSkillId(event.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                disabled={isPublishingVersion}
              >
                <option value="">Select a repository</option>
                {repositories?.map((skill) => (
                  <option key={skill._id} value={skill._id}>
                    {skill.fullName}
                  </option>
                ))}
              </select>
            </div>
            )}
            {hasRepositories && (
            <>
            <div className="space-y-2">
              <Label htmlFor="publish-version">Version</Label>
              <Input
                id="publish-version"
                value={publishVersion}
                onChange={(event) => setPublishVersion(event.target.value)}
                placeholder="1.0.0"
                disabled={isPublishingVersion}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publish-file">Artifact (.tar)</Label>
              <Input
                id="publish-file"
                type="file"
                accept=".tar,application/x-tar"
                onChange={(event) =>
                  setPublishFile(event.target.files?.[0] ?? null)
                }
                disabled={isPublishingVersion}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publish-changelog">Changelog (optional)</Label>
              <Textarea
                id="publish-changelog"
                value={publishChangelog}
                onChange={(event) => setPublishChangelog(event.target.value)}
                placeholder="What changed in this version?"
                disabled={isPublishingVersion}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={setAsDefault}
                onChange={(event) => setSetAsDefault(event.target.checked)}
                disabled={isPublishingVersion}
              />
              Set this as default version after successful verification
            </label>
            <Button
              onClick={handlePublishHostedVersion}
              disabled={isPublishingVersion || !selectedRepository}
            >
              {isPublishingVersion ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Publish Version
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Generate a tar artifact with <code>lmskills publish</code>, then upload it here.
            </p>
            </>
            )}
          </CardContent>
        </Card>
      </div>

      {hasRepositories && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Repositories</CardTitle>
            <CardDescription>
              Review version status, set defaults, and re-run verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {repositories.map((skill) => (
              <div key={skill._id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Link
                    href={`/skills/${me?.handle}/${skill.slug}`}
                    className="font-semibold hover:underline"
                  >
                    {skill.fullName}
                  </Link>
                  <Badge variant="secondary">{skill.visibility}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Updated {new Date(skill.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                {skill.versions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No versions published yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {skill.versions.map((version) => {
                      const isDefault = skill.defaultVersionId === version._id;
                      const statusVariant =
                        version.status === "verified"
                          ? "default"
                          : version.status === "rejected"
                            ? "destructive"
                            : "secondary";

                      return (
                        <div
                          key={version._id}
                          className="flex flex-col gap-2 rounded border px-3 py-2"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm">{version.version}</span>
                            <Badge variant={statusVariant}>{version.status}</Badge>
                            {isDefault && <Badge variant="outline">default</Badge>}
                            {version.publishedAt && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(version.publishedAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                          {version.verification?.errors &&
                            version.verification.errors.length > 0 && (
                              <p className="text-xs text-destructive">
                                {version.verification.errors[0]}
                              </p>
                            )}
                          <div className="flex flex-wrap items-center gap-2">
                            {version.status === "verified" && !isDefault && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleSetDefaultVersion(skill._id, version._id)
                                }
                                disabled={settingDefaultVersionId === version._id}
                              >
                                {settingDefaultVersionId === version._id ? (
                                  <>
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                    Setting default
                                  </>
                                ) : (
                                  "Set default"
                                )}
                              </Button>
                            )}
                            {version.status !== "verified" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleReverifyVersion(skill._id, version._id)
                                }
                                disabled={reverifyingVersionId === version._id}
                              >
                                {reverifyingVersionId === version._id ? (
                                  <>
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                    Verifying
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                                    Re-verify
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <h2 className="text-lg font-semibold mb-4">All Skills</h2>
      {status === "LoadingFirstPage" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="flex flex-col h-full">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : skills.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No skills yet</CardTitle>
            <CardDescription>
              You haven&apos;t published any skills yet. Get started by submitting
              your first skill.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <div key={skill._id} className="relative">
              <Card className="flex flex-col h-full hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between gap-2">
                    <Link
                      href={`/skills/${skill.owner?.handle}/${encodeURIComponent(skill.slug ?? skill.name)}`}
                      className="line-clamp-2 hover:underline"
                    >
                      {skill.name}
                    </Link>
                    {skill.repoUrl && (
                      <a
                        href={skill.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                        aria-label={`Open ${skill.name} on GitHub`}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </a>
                    )}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {skill.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <Badge variant="outline">{skill.source ?? "github"}</Badge>
                      <Badge variant="secondary">{skill.visibility}</Badge>
                    </div>
                    {skill.license && (
                      <p className="text-muted-foreground">License: {skill.license}</p>
                    )}
                    {skill.stars !== undefined && skill.stars > 0 && (
                      <p className="text-muted-foreground">Stars: {skill.stars}</p>
                    )}
                    <p className="text-muted-foreground">
                      Created: {new Date(skill.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-muted-foreground">
                      Updated: {new Date(skill.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(skill._id);
                    }}
                    className="w-full text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      )}

      {(status === "CanLoadMore" || status === "LoadingMore") && skills.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => loadMore(20)}
            variant="outline"
            disabled={status === "LoadingMore"}
          >
            {status === "LoadingMore" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              skill and remove all associated data including comments, ratings,
              and favorites.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
