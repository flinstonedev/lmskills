"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardHeading } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Star, Github, Calendar, Scale, Check, X, AlertCircle, Terminal } from "lucide-react";
import Link from "next/link";
import { getLicenseInfo } from "@/lib/licenses";

export default function SkillDetailPage() {
  const params = useParams();
  const owner = params.owner as string;
  const name = params.name as string;

  const skill = useQuery(api.skills.getSkill, { owner, name });
  const skillWithVersions = useQuery(
    api.skills.getSkillWithVersions,
    skill?.fullName ? { fullName: skill.fullName } : "skip"
  );

  if (skill === undefined) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
            <div className="flex-1 w-full">
              <Skeleton className="h-10 sm:h-12 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <Skeleton className="h-10 w-full sm:w-40" />
          </div>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (skill === null) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-3">Skill Not Found</h1>
            <p className="text-base text-muted-foreground mb-6">
              The skill you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button variant="gradient" asChild>
              <Link href="/skills">Browse Skills</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(skill.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const licenseInfo = getLicenseInfo(skill.license);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
              {skill.name}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
              {skill.description}
            </p>
          </div>
          {skill.repoUrl && (
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 w-full sm:w-auto">
              <Button variant="gradient" asChild className="flex-1 sm:flex-initial">
                <a
                  href={skill.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* Metadata Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Link
            href={`/users/${skill.owner.handle}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={skill.owner.avatarUrl} />
              <AvatarFallback>
                {skill.owner.handle.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{skill.owner.handle}</span>
          </Link>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Submitted {formattedDate}</span>
          </div>

          {skill.stars !== undefined && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4" />
              <span>{skill.stars.toLocaleString()} stars</span>
            </div>
          )}

          {skill.license && (
            <Badge variant="secondary" className="text-xs">
              {skill.license}
            </Badge>
          )}
        </div>
      </div>

      {skill.repoUrl && (
        <>
          {/* View on GitHub Card */}
          <Card className="bg-[var(--surface-2)] backdrop-blur border-border/50 mb-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Github className="h-5 w-5 text-muted-foreground" />
                <CardHeading level={2} className="text-xl">View Skill Content</CardHeading>
              </div>
              <CardDescription className="text-sm">
                Skill content is hosted on GitHub for security and transparency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To view the full SKILL.md content and all associated files, please visit the GitHub repository directly.
                This ensures you&apos;re always viewing the latest version from the source.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="gradient" asChild>
                  <a
                    href={skill.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View SKILL.md on GitHub
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CLI Installation Card */}
          <Card className="bg-[var(--surface-2)] backdrop-blur border-border/50 mb-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-muted-foreground" />
                <CardHeading level={2} className="text-xl">Install with CLI</CardHeading>
              </div>
              <CardDescription className="text-sm">
                Use the LMSkills CLI to install this skill directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-md p-3 font-mono text-sm overflow-x-auto">
                <code>npx lmskills-cli install {skill.repoUrl}</code>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Add <code className="px-1 py-0.5 bg-muted rounded">--global</code> to install globally
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {skill.source === "hosted" && (
        <Card className="bg-[var(--surface-2)] backdrop-blur border-border/50 mb-8">
          <CardHeader>
            <CardHeading level={2} className="text-xl">
              Hosted Versions
            </CardHeading>
            <CardDescription className="text-sm">
              {skill.visibility === "public"
                ? "Showing verified public versions."
                : "Showing versions visible to the owner."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {skillWithVersions === undefined ? (
              <Skeleton className="h-16 w-full" />
            ) : !skillWithVersions || skillWithVersions.versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hosted versions are available yet.
              </p>
            ) : (
              skillWithVersions.versions.map((version) => (
                <div
                  key={version._id}
                  className="flex items-center justify-between gap-3 rounded border px-3 py-2"
                >
                  <div>
                    <p className="font-mono text-sm">{version.version}</p>
                    {version.publishedAt && (
                      <p className="text-xs text-muted-foreground">
                        Published{" "}
                        {new Date(version.publishedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      version.status === "verified"
                        ? "default"
                        : version.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {version.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* License Information */}
      {licenseInfo && (
        <Card className="bg-[var(--surface-2)] backdrop-blur border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-muted-foreground" />
              <CardHeading level={2} className="text-xl">License</CardHeading>
            </div>
            <CardDescription className="text-sm">
              {licenseInfo.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {licenseInfo.description}
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Permissions */}
              {licenseInfo.permissions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Permissions
                  </h4>
                  <ul className="space-y-2">
                    {licenseInfo.permissions.map((permission) => (
                      <li key={permission} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{permission}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Conditions */}
              {licenseInfo.conditions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                    Conditions
                  </h4>
                  <ul className="space-y-2">
                    {licenseInfo.conditions.map((condition) => (
                      <li key={condition} className="text-sm text-muted-foreground flex items-start gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Limitations */}
              {licenseInfo.limitations.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <X className="h-4 w-4 text-red-500" />
                    Limitations
                  </h4>
                  <ul className="space-y-2">
                    {licenseInfo.limitations.map((limitation) => (
                      <li key={limitation} className="text-sm text-muted-foreground flex items-start gap-2">
                        <X className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {licenseInfo.url && (
              <div className="pt-4 border-t border-border/50">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={licenseInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Full License
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
