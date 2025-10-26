"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Star, Github, Calendar, Scale, Check, X, AlertCircle, FileText, ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react";
import { SafeMarkdown } from "@/components/safe-markdown";
import Link from "next/link";
import { getLicenseInfo } from "@/lib/licenses";
import { useState, useEffect } from "react";

interface SkillFile {
  name: string;
  path: string;
  content: string;
  size: number;
  type: "file" | "dir";
}

export default function SkillDetailPage() {
  const params = useParams();
  const owner = params.owner as string;
  const name = params.name as string;

  const skill = useQuery(api.skills.getSkill, { owner, name });
  const fetchSkillFiles = useAction(api.github.fetchSkillFiles);

  const [files, setFiles] = useState<SkillFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<SkillFile | null>(null);

  // Fetch skill files when skill data is available
  useEffect(() => {
    if (skill && skill.repoUrl) {
      setFilesLoading(true);
      setFilesError(null);
      fetchSkillFiles({ repoUrl: skill.repoUrl })
        .then((fetchedFiles) => {
          setFiles(fetchedFiles);
          setFilesLoading(false);

          // Find and select SKILL.md by default
          const skillMdFile = fetchedFiles.find(
            (f) => f.type === "file" && (f.name === "SKILL.md" || f.name === "skill.md")
          );
          if (skillMdFile) {
            setSelectedFile(skillMdFile);
          } else if (fetchedFiles.length > 0) {
            // If SKILL.md not found, select first file
            const firstFile = fetchedFiles.find((f) => f.type === "file");
            if (firstFile) {
              setSelectedFile(firstFile);
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching skill files:", error);
          setFilesError(error.message || "Failed to fetch skill files");
          setFilesLoading(false);
        });
    }
  }, [skill?.repoUrl, fetchSkillFiles]);

  const toggleDir = (dirPath: string) => {
    setExpandedDirs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dirPath)) {
        newSet.delete(dirPath);
      } else {
        newSet.add(dirPath);
      }
      return newSet;
    });
  };

  const selectFile = (file: SkillFile) => {
    if (file.type === "file") {
      setSelectedFile(file);
    }
  };

  // Helper function to calculate indentation level based on path depth
  const getIndentLevel = (file: SkillFile, basePath: string): number => {
    // Remove the base path to get relative path
    const relativePath = file.path.replace(basePath + '/', '');
    const depth = relativePath.split('/').length - 1;
    return depth;
  };

  // Helper function to check if a file should be visible based on parent folder expansion
  const isFileVisible = (file: SkillFile, files: SkillFile[]): boolean => {
    const pathParts = file.path.split('/');

    // Root level is always visible
    if (pathParts.length <= 2) {
      return true;
    }

    // Check if all parent directories are expanded
    for (let i = 1; i < pathParts.length - 1; i++) {
      const parentPath = pathParts.slice(0, i + 1).join('/');
      const parentDir = files.find(f => f.path === parentPath && f.type === 'dir');

      if (parentDir && !expandedDirs.has(parentDir.path)) {
        return false;
      }
    }

    return true;
  };

  if (skill === undefined) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4" />
            <p className="text-sm text-muted-foreground">Loading skill...</p>
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
            <h1 className="text-3xl font-bold mb-3">Skill Not Found</h1>
            <p className="text-base text-muted-foreground mb-6">
              The skill you're looking for doesn't exist.
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
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight">
              {skill.name}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              {skill.description}
            </p>
          </div>
        </div>

        {/* Metadata Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Link
            href={`/profile/${skill.owner.handle}`}
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

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="gradient" asChild>
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
      </div>

      {/* Files Section with Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-6 mb-8">
        {/* Left Sidebar - File Tree */}
        <Card className="bg-[var(--surface-2)] backdrop-blur border-border/50 h-fit lg:sticky lg:top-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">Files</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filesLoading && (
              <div className="flex items-center justify-center py-8 px-4">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              </div>
            )}

            {filesError && (
              <div className="flex items-center gap-2 text-sm text-red-500 py-4 px-4">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">{filesError}</span>
              </div>
            )}

            {!filesLoading && !filesError && files.length === 0 && (
              <div className="text-sm text-muted-foreground py-4 px-4">
                No files found.
              </div>
            )}

            {!filesLoading && !filesError && files.length > 0 && (
              <div className="py-2">
                {files.map((file) => {
                  const basePath = files.length > 0 ? files[0].path.split('/').slice(0, -1).join('/') : '';
                  const indentLevel = getIndentLevel(file, basePath);
                  const isVisible = isFileVisible(file, files);

                  if (!isVisible) {
                    return null;
                  }

                  const isDirectory = file.type === 'dir';
                  const isExpanded = expandedDirs.has(file.path);
                  const isSelected = selectedFile?.path === file.path;

                  return (
                    <button
                      key={file.path}
                      onClick={() => {
                        if (isDirectory) {
                          toggleDir(file.path);
                        } else {
                          selectFile(file);
                        }
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 hover:bg-accent/50 transition-colors text-left ${
                        isSelected ? 'bg-accent/70' : ''
                      }`}
                      style={{ paddingLeft: `${16 + indentLevel * 16}px` }}
                    >
                      {isDirectory ? (
                        <>
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                          )}
                          {isExpanded ? (
                            <FolderOpen className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                          ) : (
                            <Folder className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                          )}
                        </>
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="font-mono text-xs font-medium truncate">{file.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Content Area - Selected File */}
        <Card className="bg-[var(--surface-2)] backdrop-blur border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-semibold">
                  {selectedFile ? selectedFile.name : 'No file selected'}
                </CardTitle>
                {selectedFile && (
                  <CardDescription className="text-sm font-mono mt-1">
                    {selectedFile.path}
                  </CardDescription>
                )}
              </div>
              {selectedFile && selectedFile.type === "file" && (
                <Badge variant="secondary" className="text-xs">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedFile && (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Select a file from the sidebar to view its contents
              </div>
            )}

            {selectedFile && selectedFile.type === "file" && (
              <>
                {selectedFile.name.toLowerCase().endsWith('.md') ? (
                  <SafeMarkdown
                    content={selectedFile.content}
                    className="prose prose-sm dark:prose-invert max-w-none"
                  />
                ) : (
                  <pre className="p-4 overflow-x-auto text-xs bg-background/50 rounded-lg border border-border/30">
                    <code>{selectedFile.content}</code>
                  </pre>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* License Information */}
      {licenseInfo && (
        <Card className="bg-[var(--surface-2)] backdrop-blur border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-2xl font-semibold">License</CardTitle>
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

      {/* Future: Comments, ratings, etc. */}
    </div>
  );
}
