"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Star, Calendar, Plus } from "lucide-react";
import Link from "next/link";

export default function SkillsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Get all skills or search results using a single unified query
  const skills = useQuery(api.skills.listSkills, {
    limit: 20,
    query: searchQuery.trim() || undefined,
  });

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">
              Browse Skills
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Discover and share Claude skills
            </p>
          </div>
          <Button variant="gradient" asChild>
            <Link href="/skills/submit">
              <Plus className="mr-2 h-4 w-4" />
              Submit Skill
            </Link>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search skills by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Skills Grid */}
      {skills === undefined ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4" />
            <p className="text-sm text-muted-foreground">Loading skills...</p>
          </div>
        </div>
      ) : skills.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-lg font-semibold mb-3">No skills found</p>
            <p className="text-base text-muted-foreground mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Be the first to submit a skill!"}
            </p>
            {!searchQuery && (
              <Button variant="gradient" asChild>
                <Link href="/skills/submit">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Skill
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => {
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
                href={`/skills/${skill.owner?.handle}/${skill.name}`}
              >
                <Card className="h-full bg-[var(--surface-2)] backdrop-blur border-border/50 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer">
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
                    {/* Owner */}
                    {skill.owner && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={skill.owner.avatarUrl} />
                          <AvatarFallback>
                            {skill.owner.handle.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">
                          {skill.owner.handle}
                        </span>
                      </div>
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

      {/* Results Count */}
      {skills && skills.length > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Showing {skills.length} skill{skills.length !== 1 ? "s" : ""}
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}
    </div>
  );
}
