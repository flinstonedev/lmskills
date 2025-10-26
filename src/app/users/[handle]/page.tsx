"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = use(params);
  const user = useQuery(api.users.getUserByHandle, { handle });
  const currentUser = useQuery(api.users.getCurrentUser);

  const isOwnProfile = currentUser && user && currentUser._id === user._id;

  if (user === undefined) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">User not found</h1>
          <p className="text-muted-foreground">
            The user @{handle} does not exist.
          </p>
        </div>
      </div>
    );
  }

  const initials = user.handle.slice(0, 2).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="flex items-start gap-6 mb-8">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.avatarUrl} alt={user.handle} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold">@{user.handle}</h1>
              {isOwnProfile && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/users/${user.handle}/edit`}>Edit Profile</Link>
                </Button>
              )}
            </div>
            <p className="text-muted-foreground mb-2">{user.email}</p>
            {user.bio && <p className="text-base">{user.bio}</p>}
            <p className="text-sm text-muted-foreground mt-2">
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Skills Section - Placeholder for future */}
        <Card>
          <CardHeader>
            <CardTitle>Published Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No skills published yet. Submit your first skill to get started!
            </p>
          </CardContent>
        </Card>

        {/* Favorites Section - Placeholder for future */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Favorite Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No favorites yet.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
