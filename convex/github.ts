import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * Convex action to fetch GitHub repository information
 * Actions can call external APIs (unlike queries/mutations)
 */
export const fetchRepoInfo = action({
  args: {
    url: v.string()
  },
  handler: async (ctx, args) => {
    // Parse GitHub URL
    const parsed = parseGitHubUrl(args.url);
    if (!parsed) {
      throw new Error("Invalid GitHub URL format");
    }

    const { owner, repo } = parsed;

    // Fetch from GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Repository not found: ${owner}/${repo}`);
      } else if (response.status === 403) {
        throw new Error("GitHub API rate limit exceeded");
      }
      throw new Error("Failed to fetch repository");
    }

    const repoData = await response.json();

    // Fetch SKILL.md content
    let skillMdContent: string;
    try {
      const fileResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/SKILL.md`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            ...(process.env.GITHUB_TOKEN && {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            }),
          },
        }
      );

      if (!fileResponse.ok) {
        // Try lowercase
        const fileResponse2 = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/skill.md`,
          {
            headers: {
              Accept: "application/vnd.github.v3+json",
              ...(process.env.GITHUB_TOKEN && {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              }),
            },
          }
        );

        if (!fileResponse2.ok) {
          throw new Error("SKILL.md not found in repository");
        }

        const fileData = await fileResponse2.json();
        skillMdContent = Buffer.from(fileData.content, "base64").toString("utf-8");
      } else {
        const fileData = await fileResponse.json();
        skillMdContent = Buffer.from(fileData.content, "base64").toString("utf-8");
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch SKILL.md");
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
  },
});

/**
 * Parse GitHub URL to extract owner and repo name
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const cleanUrl = url.trim().replace(/\.git$/, "");

  const patterns = [
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)/,
    /^github\.com\/([^\/]+)\/([^\/]+)/,
    /^([^\/]+)\/([^\/]+)$/,
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
