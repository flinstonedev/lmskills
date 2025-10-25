"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function EditProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = use(params);
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const user = useQuery(api.users.getUserByHandle, { handle });
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);

  const [formHandle, setFormHandle] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Initialize form once user is loaded
  if (user && formHandle === "" && bio === "") {
    setFormHandle(user.handle);
    setBio(user.bio || "");
  }

  // Check if this is the current user's profile
  const isOwnProfile = currentUser && user && currentUser._id === user._id;

  if (user === undefined || currentUser === undefined) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isOwnProfile) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">
              You can only edit your own profile.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await updateProfile({
        handle: formHandle !== user.handle ? formHandle : undefined,
        bio: bio !== user.bio ? bio : undefined,
      });

      // Redirect to the (potentially new) profile page
      router.push(`/users/${formHandle}`);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="handle">Handle</Label>
                  <Input
                    id="handle"
                    value={formHandle}
                    onChange={(e) => setFormHandle(e.target.value)}
                    placeholder="your-handle"
                    required
                    pattern="[a-z0-9-]+"
                    title="Only lowercase letters, numbers, and hyphens"
                  />
                  <p className="text-sm text-muted-foreground">
                    Your public username. Only lowercase letters, numbers, and hyphens.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-sm text-muted-foreground">
                    {bio.length}/500 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled />
                  <p className="text-sm text-muted-foreground">
                    Email is managed by Clerk and cannot be changed here.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Avatar</Label>
                  <p className="text-sm text-muted-foreground">
                    Avatar is managed by Clerk.{" "}
                    <a
                      href="https://dashboard.clerk.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Update in Clerk Dashboard
                    </a>
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/users/${handle}`)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
