"use client";

import { useQuery, useMutation } from "convex/react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Pencil, Trash2, ExternalLink, Plus } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const skills = useQuery(api.skills.getMySkills);
  const updateSkill = useMutation(api.skills.updateSkill);
  const deleteSkill = useMutation(api.skills.deleteSkill);

  const [editingSkill, setEditingSkill] = useState<{
    id: Id<"skills">;
    name: string;
    description: string;
    license?: string;
  } | null>(null);
  const [deletingSkillId, setDeletingSkillId] = useState<Id<"skills"> | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleEdit = (skill: {
    _id: Id<"skills">;
    name: string;
    description: string;
    license?: string;
  }) => {
    setEditingSkill({
      id: skill._id,
      name: skill.name,
      description: skill.description,
      license: skill.license,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSkill) return;

    try {
      await updateSkill({
        skillId: editingSkill.id,
        name: editingSkill.name,
        description: editingSkill.description,
        license: editingSkill.license,
      });
      setIsEditDialogOpen(false);
      setEditingSkill(null);
    } catch (error) {
      console.error("Failed to update skill:", error);
      alert("Failed to update skill. Please try again.");
    }
  };

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
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">My Skills</h1>
        <p className="text-muted-foreground">
          Please sign in to view your skills.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Skills</h1>
        <Button asChild>
          <Link href="/skills/submit">
            <Plus className="mr-2 h-4 w-4" />
            Submit New Skill
          </Link>
        </Button>
      </div>

      {skills === undefined ? (
        <div className="animate-pulse grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded"></div>
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
          <CardFooter>
            <Button asChild>
              <Link href="/skills/submit">Submit Your First Skill</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <Card key={skill._id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2">
                  <span className="line-clamp-2">{skill.name}</span>
                  <Link
                    href={skill.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Link>
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
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(skill)}
                  className="flex-1"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(skill._id)}
                  className="flex-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
            <DialogDescription>
              Update your skill&apos;s information. Changes will be reflected
              immediately.
            </DialogDescription>
          </DialogHeader>
          {editingSkill && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editingSkill.name}
                  onChange={(e) =>
                    setEditingSkill({ ...editingSkill, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingSkill.description}
                  onChange={(e) =>
                    setEditingSkill({
                      ...editingSkill,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="license">License (optional)</Label>
                <Input
                  id="license"
                  value={editingSkill.license || ""}
                  onChange={(e) =>
                    setEditingSkill({
                      ...editingSkill,
                      license: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
