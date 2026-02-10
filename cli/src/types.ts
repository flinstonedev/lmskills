export interface SkillMetadata {
  name: string;
  source: string;
  installedAt: string;
  path: string;
  isGlobal: boolean;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

export interface SkillManifest {
  name: string;
  slug: string;
  version: string;
  description: string;
  author: string;
  license: string;
  entry: string;
  files: string[];
}

export interface PublishedSkillVersion {
  version: string;
  changelog?: string;
  hash: string;
  sizeBytes: number;
  artifactPath: string;
  publishedAt: string;
}

export interface PublishedSkillRecord {
  slug: string;
  name: string;
  versions: PublishedSkillVersion[];
}

export interface VersionsRegistry {
  skills: PublishedSkillRecord[];
}
