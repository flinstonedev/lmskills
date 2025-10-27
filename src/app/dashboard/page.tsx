"use client";

import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
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
import { Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const me = useQuery(api.users.getCurrentUser);
  const { results: skills, status, loadMore } = usePaginatedQuery(
    api.skills.getSkillsByOwner,
    me?.handle ? { ownerHandle: me.handle } : "skip",
    { initialNumItems: 20 }
  );
  const deleteSkill = useMutation(api.skills.deleteSkill);

  const [deletingSkillId, setDeletingSkillId] = useState<Id<"skills"> | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
    } catch (error) {
      console.error("Failed to delete skill:", error);
      alert("Failed to delete skill. Please try again.");
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
              your first skill!
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
                      href={`/skills/${skill.owner?.handle}/${skill.name}`}
                      className="line-clamp-2 hover:underline"
                    >
                      {skill.name}
                    </Link>
                    <a
                      href={skill.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </a>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {skill.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm">
                    {skill.license && (
                      <p className="text-muted-foreground">
                        License: {skill.license}
                      </p>
                    )}
                    {skill.stars !== undefined && skill.stars > 0 && (
                      <p className="text-muted-foreground">
                        Stars: {skill.stars}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      Created:{" "}
                      {new Date(skill.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-muted-foreground">
                      Updated:{" "}
                      {new Date(skill.updatedAt).toLocaleDateString()}
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

      {/* Load More Button */}
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

      {/* Delete Confirmation Dialog */}
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
