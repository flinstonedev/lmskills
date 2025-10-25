import { Octokit } from "octokit";

// Initialize Octokit (GitHub API client)
// For public repos, we don't need authentication, but we can add it later for higher rate limits
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // Optional: for higher rate limits
});

export interface GitHubRepoInfo {
  owner: string;
  name: string;
  description: string;
  license: string | null;
  stars: number;
  url: string;
  skillMdContent: string;
  lastUpdated: string;
}

/**
 * Parse GitHub URL to extract owner and repo name
 * Supports: https://github.com/owner/repo, github.com/owner/repo, owner/repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Clean up the URL
  const cleanUrl = url.trim().replace(/\.git$/, "");

  // Match various GitHub URL formats
  const patterns = [
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)/,  // https://github.com/owner/repo
    /^github\.com\/([^\/]+)\/([^\/]+)/,              // github.com/owner/repo
    /^([^\/]+)\/([^\/]+)$/,                          // owner/repo
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
      };
    }
  }

  return null;
}

/**
 * Fetch repository information and SKILL.md content from GitHub
 */
export async function fetchGitHubRepo(url: string): Promise<GitHubRepoInfo> {
  const parsed = parseGitHubUrl(url);

  if (!parsed) {
    throw new Error("Invalid GitHub URL format. Please use: github.com/owner/repo or https://github.com/owner/repo");
  }

  const { owner, repo } = parsed;

  try {
    // Fetch repository info
    const { data: repoData } = await octokit.rest.repos.get({
      owner,
      repo,
    });

    // Fetch SKILL.md content (try both uppercase and lowercase)
    let skillMdContent: string;
    try {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: "SKILL.md",
      });

      if ("content" in fileData) {
        skillMdContent = Buffer.from(fileData.content, "base64").toString("utf-8");
      } else {
        throw new Error("SKILL.md is a directory, not a file");
      }
    } catch (error: any) {
      // Try lowercase skill.md
      if (error.status === 404) {
        try {
          const { data: fileData } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: "skill.md",
          });

          if ("content" in fileData) {
            skillMdContent = Buffer.from(fileData.content, "base64").toString("utf-8");
          } else {
            throw new Error("skill.md is a directory, not a file");
          }
        } catch (error2: any) {
          throw new Error("SKILL.md or skill.md not found in repository");
        }
      } else {
        throw error;
      }
    }

    return {
      owner,
      name: repo,
      description: repoData.description || "",
      license: repoData.license?.spdx_id || null,
      stars: repoData.stargazers_count,
      url: repoData.html_url,
      skillMdContent,
      lastUpdated: repoData.updated_at,
    };
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error(`Repository not found: ${owner}/${repo}`);
    } else if (error.status === 403) {
      throw new Error("GitHub API rate limit exceeded. Please try again later.");
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error("Failed to fetch repository information from GitHub");
    }
  }
}

/**
 * Extract tags/keywords from SKILL.md content (basic heuristic)
 * This is a simple implementation - can be enhanced later
 */
export function extractTags(skillMdContent: string): string[] {
  const tags: Set<string> = new Set();

  // Look for common skill-related keywords
  const keywords = [
    "prompt-engineering",
    "tool-use",
    "code-generation",
    "data-analysis",
    "research",
    "writing",
    "automation",
    "api",
    "database",
    "web-scraping",
  ];

  const lowerContent = skillMdContent.toLowerCase();

  keywords.forEach((keyword) => {
    if (lowerContent.includes(keyword.replace("-", " "))) {
      tags.add(keyword);
    }
  });

  return Array.from(tags);
}
