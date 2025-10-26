"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardHeading } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Star, Github, Calendar, Scale, Check, X, AlertCircle, FileText, ChevronDown, ChevronRight, Folder, FolderOpen, Loader2 } from "lucide-react";
import { SafeMarkdown } from "@/components/safe-markdown";
import Link from "next/link";
import { getLicenseInfo } from "@/lib/licenses";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
// Import languages we need
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml';
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css';
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';
import go from 'react-syntax-highlighter/dist/esm/languages/hljs/go';
import rust from 'react-syntax-highlighter/dist/esm/languages/hljs/rust';

// Register languages
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('xml', xml);
SyntaxHighlighter.registerLanguage('html', xml);
SyntaxHighlighter.registerLanguage('go', go);
SyntaxHighlighter.registerLanguage('rust', rust);

interface SkillFile {
  name: string;
  path: string;
  content: string;
  size: number;
  type: "file" | "dir";
}

// Helper function to detect language from file extension
function getLanguageFromFilename(filename: string): string | null {
  const extension = filename.split('.').pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript (registered)
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'mjs': 'javascript',
    'cjs': 'javascript',

    // Python (registered)
    'py': 'python',
    'pyw': 'python',

    // Web (registered)
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'css',
    'sass': 'css',
    'less': 'css',

    // Config/Data (registered)
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'yaml',
    'xml': 'xml',

    // Shell (registered)
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'fish': 'bash',

    // Other languages (registered)
    'go': 'go',
    'rs': 'rust',

    // Config files without extensions or special names
    'dockerfile': 'bash',
    'makefile': 'bash',
    'env': 'bash',
  };

  // Check for files without extension but with specific names
  const filenameLower = filename.toLowerCase();
  if (filenameLower === 'dockerfile') return 'bash';
  if (filenameLower === 'makefile') return 'bash';
  if (filenameLower === '.env' || filenameLower.startsWith('.env.')) return 'bash';

  return extension ? (languageMap[extension] || null) : null;
}

// Helper function to check if file should use syntax highlighting
function shouldUseSyntaxHighlighting(filename: string): boolean {
  // Don't use syntax highlighting for markdown files (use SafeMarkdown instead)
  if (filename.toLowerCase().endsWith('.md') || filename.toLowerCase().endsWith('.markdown')) {
    return false;
  }

  return getLanguageFromFilename(filename) !== null;
}

export default function SkillDetailPage() {
  const params = useParams();
  const owner = params.owner as string;
  const name = params.name as string;
  const { resolvedTheme } = useTheme();

  const skill = useQuery(api.skills.getSkill, { owner, name });
  const fetchSkillMd = useAction(api.github.fetchSkillMd);
  const fetchSkillFiles = useAction(api.github.fetchSkillFiles);

  const [files, setFiles] = useState<SkillFile[]>([]);
  const [skillMdLoading, setSkillMdLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [allFilesFetched, setAllFilesFetched] = useState(false);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<SkillFile | null>(null);

  // Debug theme
  useEffect(() => {
    console.log('Current resolvedTheme:', resolvedTheme);
  }, [resolvedTheme]);

  // Step 1: Fetch SKILL.md first for immediate display
  useEffect(() => {
    if (skill && skill.repoUrl && files.length === 0) {
      setSkillMdLoading(true);
      setFilesError(null);

      fetchSkillMd({ repoUrl: skill.repoUrl })
        .then((skillMdFile) => {
          // Add SKILL.md to files and select it
          setFiles([skillMdFile]);
          setSelectedFile(skillMdFile);
          setSkillMdLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching SKILL.md:", error);
          setFilesError(error.message || "Failed to fetch SKILL.md");
          setSkillMdLoading(false);
        });
    }
  }, [skill?.repoUrl, fetchSkillMd, files.length]);

  // Step 2: Fetch remaining files in the background
  useEffect(() => {
    if (skill && skill.repoUrl && files.length > 0 && !filesLoading && !allFilesFetched) {
      setFilesLoading(true);

      fetchSkillFiles({ repoUrl: skill.repoUrl })
        .then((fetchedFiles) => {
          // Replace the temporary SKILL.md with full file tree
          setFiles(fetchedFiles);
          setFilesLoading(false);
          setAllFilesFetched(true);

          // Keep SKILL.md selected if it was already selected
          if (selectedFile && (selectedFile.name === "SKILL.md" || selectedFile.name === "skill.md")) {
            const updatedSkillMd = fetchedFiles.find(
              (f: SkillFile) => f.type === "file" && (f.name === "SKILL.md" || f.name === "skill.md")
            );
            if (updatedSkillMd) {
              setSelectedFile(updatedSkillMd);
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching skill files:", error);
          // Don't show error if we already have SKILL.md loaded
          if (files.length === 0) {
            setFilesError(error.message || "Failed to fetch skill files");
          }
          setFilesLoading(false);
        });
    }
  }, [skill?.repoUrl, files.length, fetchSkillFiles, filesLoading, allFilesFetched, selectedFile]);

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
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
            <div className="flex-1 w-full">
              <Skeleton className="h-10 sm:h-12 md:h-14 lg:h-16 w-3/4 mb-3" />
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
        <div className="flex flex-col lg:flex-row gap-6">
          <Card className="bg-[var(--surface-2)] backdrop-blur border-border/50 w-full lg:w-[280px]">
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-20" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card className="bg-[var(--surface-2)] backdrop-blur border-border/50 w-full lg:flex-1">
            <CardHeader>
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </CardContent>
          </Card>
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
          <Button variant="gradient" asChild className="flex-shrink-0 w-full sm:w-auto">
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

      {/* Files Section with Sidebar Layout */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        {/* Left Sidebar - File Tree */}
        <Card className="bg-[var(--surface-2)] backdrop-blur border-border/50 h-fit lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] overflow-y-auto w-full lg:w-[280px] lg:flex-shrink-0">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <CardHeading level={2} className="text-lg font-semibold">Files</CardHeading>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {skillMdLoading && files.length === 0 && (
              <div className="py-2 px-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            )}

            {filesError && files.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-red-500 py-4 px-4">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">{filesError}</span>
              </div>
            )}

            {!skillMdLoading && !filesError && files.length === 0 && (
              <div className="text-sm text-muted-foreground py-4 px-4">
                No files found.
              </div>
            )}

            {files.length > 0 && (
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

                {/* Show loading indicator when fetching remaining files */}
                {filesLoading && files.length === 1 && (
                  <div className="px-4 py-3 border-t border-border/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Loading more files...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Content Area - Selected File */}
        <Card className="bg-[var(--surface-2)] backdrop-blur border-border/50 w-full lg:flex-1 lg:min-w-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardHeading level={2} className="text-xl font-semibold">
                  {skillMdLoading ? 'Loading...' : selectedFile ? selectedFile.name : 'No file selected'}
                </CardHeading>
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
            {skillMdLoading && !selectedFile && (
              <div className="space-y-3 p-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            )}

            {!skillMdLoading && !selectedFile && (
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
                ) : shouldUseSyntaxHighlighting(selectedFile.name) ? (
                  <div className="rounded-lg overflow-hidden border border-border/30">
                    <SyntaxHighlighter
                      language={getLanguageFromFilename(selectedFile.name) || 'text'}
                      style={resolvedTheme === 'light' ? {
                        ...atomOneLight,
                        'hljs': {
                          ...atomOneLight['hljs'],
                          background: 'hsl(var(--muted))',
                          color: 'hsl(var(--foreground))',
                        }
                      } : atomOneDark}
                      showLineNumbers
                      customStyle={{
                        margin: 0,
                        fontSize: '0.75rem',
                        lineHeight: '1.5',
                        padding: '1rem',
                      }}
                      codeTagProps={{
                        style: {
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        }
                      }}
                    >
                      {selectedFile.content}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <pre className="p-4 overflow-x-auto text-xs bg-background/50 rounded-lg border border-border/30">
                    <code className="font-mono">{selectedFile.content}</code>
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

      {/* Future: Comments, ratings, etc. */}
    </div>
  );
}
