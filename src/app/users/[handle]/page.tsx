"use client";

import { use } from "react";
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Calendar, Github, Package } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = use(params);
  const user = useQuery(api.users.getUserByHandle, { handle });
  const currentUser = useQuery(api.users.getCurrentUser);
  const { user: clerkUser } = useUser();
  const { results: userSkills, status, loadMore } = usePaginatedQuery(
    api.skills.getSkillsByOwner,
    { ownerHandle: handle },
    { initialNumItems: 20 }
  );

  const isLoadingSkills = status === "LoadingFirstPage";
  const canLoadMore = status === "CanLoadMore";

  const isOwnProfile = !!(currentUser && user && currentUser.handle === user.handle);

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
      {/* Profile Header */}
      <div className="flex items-start gap-6 mb-8">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.avatarUrl} alt={user.handle} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-2xl font-bold">@{user.handle}</h1>
              {isOwnProfile && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/users/${user.handle}/edit`}>Edit Profile</Link>
                </Button>
              )}
            </div>
            {isOwnProfile && clerkUser?.primaryEmailAddress && (
              <p className="text-muted-foreground mb-2">{clerkUser.primaryEmailAddress.emailAddress}</p>
            )}
            {user.bio && <p className="text-base mb-2">{user.bio}</p>}
            <p className="text-sm text-muted-foreground mt-2">
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Skills Section */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold">Published Skills</h2>
          </div>

          {isLoadingSkills ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-full bg-(--surface-2) backdrop-blur border-border/50">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Skeleton className="h-7 w-3/4" />
                      <Skeleton className="h-4 w-12 ml-2" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6 mt-1" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userSkills.length === 0 ? (
            <Card className="bg-(--surface-2) backdrop-blur border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-lg font-semibold mb-3">No skills published yet</p>
                <p className="text-base text-muted-foreground">
                  {isOwnProfile
                    ? "Submit your first skill to get started!"
                    : `@${handle} hasn't published any skills yet.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userSkills.map((skill) => {
                const formattedDate = new Date(skill.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                );

                return (
                  <Link
                    key={skill._id}
                    href={`/skills/${encodeURIComponent(skill.owner?.handle ?? "")}/${encodeURIComponent(skill.slug ?? skill.name)}`}
                  >
                    <Card className="h-full bg-(--surface-2) backdrop-blur border-border/50 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-xl font-semibold line-clamp-1">
                            {skill.name}
                          </CardTitle>
                          {skill.stars !== undefined && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                              <Star className="h-3 w-3" />
                              <span>{skill.stars}</span>
                            </div>
                          )}
                        </div>
                        <CardDescription className="text-sm line-clamp-2">
                          {skill.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Source badge */}
                        {skill.source === "repository" ? (
                          <Badge variant="secondary" className="text-xs">
                            <Package className="mr-1 h-3 w-3" />
                            Repository
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <Github className="mr-1 h-3 w-3" />
                            GitHub
                          </Badge>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formattedDate}</span>
                          </div>
                          {skill.license && (
                            <Badge variant="secondary" className="text-xs h-5">
                              {skill.license}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {canLoadMore && userSkills.length > 0 && (
            <div className="mt-8 flex justify-center">
              <Button
                onClick={() => loadMore(20)}
                variant="outline"
              >
                Load More
              </Button>
            </div>
          )}
        </div>
    </div>
  );
}
