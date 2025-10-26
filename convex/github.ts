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
      throw new Error("Invalid GitHub URL format. Please provide a URL like: https://github.com/owner/repo/tree/main/skill-name");
    }

    const { owner, repo, path } = parsed;

    // Require a subdirectory path for the skill
    if (!path) {
      throw new Error("Please provide a URL to a specific skill directory, like: https://github.com/owner/repo/tree/main/skill-name");
    }

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

    // Build the path to SKILL.md in the subdirectory
    const skillMdPath = `${path}/SKILL.md`;
    const skillMdPathLower = `${path}/skill.md`;

    console.log("Fetching SKILL.md from:", `https://api.github.com/repos/${owner}/${repo}/contents/${skillMdPath}`);

    const fileResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${skillMdPath}`,
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
      console.log("First attempt failed with status:", fileResponse.status);
      // Try lowercase
      const fileResponse2 = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${skillMdPathLower}`,
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
        throw new Error(`SKILL.md not found in ${path}/`);
      }

      const fileData = await fileResponse2.json();
      // Decode base64 content with proper UTF-8 handling
      const base64 = fileData.content.replace(/\n/g, '');
      const binaryString = atob(base64);
      // Convert binary string to UTF-8
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      skillMdContent = new TextDecoder('utf-8').decode(bytes);
    } else {
      const fileData = await fileResponse.json();
      // Decode base64 content with proper UTF-8 handling
      const base64 = fileData.content.replace(/\n/g, '');
      const binaryString = atob(base64);
      // Convert binary string to UTF-8
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      skillMdContent = new TextDecoder('utf-8').decode(bytes);
    }

    // Extract the skill name from the path (last segment)
    const skillName = path.split('/').pop() || path;

    return {
      owner,
      name: skillName,
      description: repoData.description || "",
      license: repoData.license?.spdx_id || null,
      stars: repoData.stargazers_count,
      url: args.url, // Use the full URL provided by the user
      skillMdContent,
      lastUpdated: repoData.updated_at,
    };
  },
});

/**
 * Parse GitHub URL to extract owner, repo name, and optional path
 */
function parseGitHubUrl(url: string): { owner: string; repo: string; path?: string } | null {
  const cleanUrl = url.trim().replace(/\.git$/, "");

  // Match URLs with tree/main/path or tree/master/path
  const treePattern = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/tree\/[^\/]+\/(.+)/;
  const treeMatch = cleanUrl.match(treePattern);
  if (treeMatch) {
    return {
      owner: treeMatch[1],
      repo: treeMatch[2],
      path: treeMatch[3],
    };
  }

  // Standard patterns without path
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

/**
 * Convex action to fetch all files from a skill's GitHub directory
 */
export const fetchSkillFiles = action({
  args: {
    repoUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const parsed = parseGitHubUrl(args.repoUrl);
    if (!parsed) {
      throw new Error("Invalid GitHub URL format");
    }

    const { owner, repo, path } = parsed;

    if (!path) {
      throw new Error("No path specified in the repository URL");
    }

    // Fetch directory contents
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
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
        throw new Error(`Directory not found: ${path}`);
      } else if (response.status === 403) {
        throw new Error("GitHub API rate limit exceeded");
      }
      throw new Error("Failed to fetch directory contents");
    }

    const contents = await response.json();

    // Validate that contents is an array (directory), not an object (file)
    if (!Array.isArray(contents)) {
      throw new Error("The provided URL points to a file instead of a directory. Please provide a URL to a skill directory containing multiple files.");
    }

    // Filter to only include files (not directories)
    const files = contents.filter((item: any) => item.type === "file");

    // Fetch content for each file
    const fileContents = await Promise.all(
      files.map(async (file: any) => {
        const fileResponse = await fetch(file.url, {
          headers: {
            Accept: "application/vnd.github.v3+json",
            ...(process.env.GITHUB_TOKEN && {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            }),
          },
        });

        if (!fileResponse.ok) {
          return {
            name: file.name,
            path: file.path,
            content: "Error: Failed to fetch file content",
            size: file.size,
          };
        }

        const fileData = await fileResponse.json();

        // Decode base64 content with proper UTF-8 handling
        let content: string;
        try {
          const base64 = fileData.content.replace(/\n/g, '');
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          content = new TextDecoder('utf-8').decode(bytes);
        } catch (error) {
          content = "Error: Unable to decode file content";
        }

        return {
          name: file.name,
          path: file.path,
          content,
          size: file.size,
        };
      })
    );

    return fileContents;
  },
});
