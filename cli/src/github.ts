import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import { ParsedGitHubUrl, GitHubTreeResponse, GitHubTreeItem } from './types';

/**
 * Parse a GitHub URL to extract owner, repo, branch, and path
 * Supports formats like:
 * - https://github.com/owner/repo/tree/branch/path/to/skill
 * - https://github.com/owner/repo/tree/main/path/to/skill
 */
export function parseGitHubUrl(url: string): ParsedGitHubUrl {
  const regex = /github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/(.+)/;
  const match = url.match(regex);

  if (!match) {
    throw new Error(
      'Invalid GitHub URL format. Expected: https://github.com/owner/repo/tree/branch/path/to/skill'
    );
  }

  const [, owner, repo, branch, pathStr] = match;

  return {
    owner,
    repo,
    branch,
    path: pathStr,
  };
}

/**
 * Fetch the Git tree for a specific path in a repository
 */
async function fetchGitTree(
  owner: string,
  repo: string,
  treeSha: string
): Promise<GitHubTreeResponse> {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'lmskills-cli',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return await response.json() as GitHubTreeResponse;
}

/**
 * Get the SHA for a specific branch
 */
async function getBranchSha(
  owner: string,
  repo: string,
  branch: string
): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'lmskills-cli',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch branch: ${response.statusText}`);
  }

  const data = await response.json() as any;
  return data.object.sha;
}

/**
 * Get the tree SHA for a commit
 */
async function getCommitTreeSha(
  owner: string,
  repo: string,
  commitSha: string
): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/commits/${commitSha}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'lmskills-cli',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch commit: ${response.statusText}`);
  }

  const data = await response.json() as any;
  return data.tree.sha;
}

/**
 * Download a blob (file) from GitHub
 */
async function downloadBlob(
  owner: string,
  repo: string,
  sha: string
): Promise<Buffer> {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'lmskills-cli',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  const data = await response.json() as any;

  // GitHub returns base64-encoded content
  return Buffer.from(data.content, 'base64');
}

/**
 * Download an entire subdirectory from a GitHub repository
 */
export async function downloadGitHubDirectory(
  parsedUrl: ParsedGitHubUrl,
  targetDir: string
): Promise<void> {
  const { owner, repo, branch, path: subPath } = parsedUrl;

  // Get the commit SHA for the branch
  const commitSha = await getBranchSha(owner, repo, branch);

  // Get the tree SHA for this commit
  const treeSha = await getCommitTreeSha(owner, repo, commitSha);

  // Fetch the full repository tree
  const tree = await fetchGitTree(owner, repo, treeSha);

  // Filter tree items that are within the target subdirectory
  const relevantItems = tree.tree.filter(item =>
    item.path.startsWith(subPath)
  );

  if (relevantItems.length === 0) {
    throw new Error(`No files found at path: ${subPath}`);
  }

  // Download each file
  for (const item of relevantItems) {
    if (item.type === 'blob') {
      // Calculate relative path within the skill directory
      const relativePath = item.path.substring(subPath.length + 1);

      if (!relativePath) continue; // Skip if empty

      const targetPath = path.join(targetDir, relativePath);

      // Ensure directory exists
      const dir = path.dirname(targetPath);
      fs.mkdirSync(dir, { recursive: true });

      // Download and save the file
      const content = await downloadBlob(owner, repo, item.sha);
      fs.writeFileSync(targetPath, content);
    }
  }
}
