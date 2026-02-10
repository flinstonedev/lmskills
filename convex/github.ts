import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { z } from "zod";
import { logSecurityEvent } from "./security";

const MAX_URL_LENGTH = 500;
const FETCH_RATE_LIMIT = { limit: 20, windowMs: 60_000 };

const RepoSchema = z.object({
  description: z.string().nullable().optional(),
  license: z
    .object({
      spdx_id: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  stargazers_count: z.number().optional(),
  updated_at: z.string().optional(),
});

const FileSchema = z.object({
  content: z.string(),
});

/**
 * Convex action to fetch GitHub repository information (metadata only)
 * Validates SKILL.md exists but does NOT return its content for security reasons.
 */
export const fetchRepoInfo = action({
  args: {
    url: v.string()
  },
  handler: async (ctx, args) => {
    if (args.url.length > MAX_URL_LENGTH) {
      throw new Error("Repository URL is too long");
    }
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    await ctx.runMutation(internal.security.enforceRateLimit, {
      key: `user:${identity.subject}:fetchRepoInfo`,
      ...FETCH_RATE_LIMIT,
    });

    const parsed = parseGitHubUrl(args.url);
    if (!parsed) {
      throw new Error("Invalid GitHub URL format. Please provide a URL like: https://github.com/owner/repo/tree/main/skill-name");
    }

    const { owner, repo, path } = parsed;

    if (!path) {
      throw new Error("Please provide a URL to a specific skill directory, like: https://github.com/owner/repo/tree/main/skill-name");
    }

    // Fetch repo metadata
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

    const repoJson = await response.json();
    const repoResult = RepoSchema.safeParse(repoJson);
    if (!repoResult.success) {
      logSecurityEvent("github.invalid_repo_response", {
        owner,
        repo,
      });
      throw new Error("Invalid GitHub response");
    }
    const repoData = repoResult.data;

    // Validate SKILL.md exists (but don't store content)
    const skillMdPath = `${path}/SKILL.md`;
    const skillMdPathLower = `${path}/skill.md`;

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

    let frontmatter: { name?: string; description?: string } | null = null;

    if (!fileResponse.ok) {
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

      // Parse frontmatter for name/description only
      const fileJson = await fileResponse2.json();
      const fileResult = FileSchema.safeParse(fileJson);
      if (!fileResult.success) {
        logSecurityEvent("github.invalid_file_response", {
          owner,
          repo,
          path,
        });
        throw new Error("Invalid GitHub response");
      }
      const content = decodeBase64Content(fileResult.data.content);
      frontmatter = parseSkillMdFrontmatter(content);
    } else {
      const fileJson = await fileResponse.json();
      const fileResult = FileSchema.safeParse(fileJson);
      if (!fileResult.success) {
        logSecurityEvent("github.invalid_file_response", {
          owner,
          repo,
          path,
        });
        throw new Error("Invalid GitHub response");
      }
      const content = decodeBase64Content(fileResult.data.content);
      frontmatter = parseSkillMdFrontmatter(content);
    }

    const skillName = path.split('/').pop() || path;
    const description = frontmatter?.description || repoData.description || "";
    const name = frontmatter?.name || skillName;

    // Return metadata only - no content
    return {
      owner,
      name,
      description,
      license: repoData.license?.spdx_id || null,
      stars: repoData.stargazers_count,
      url: args.url,
      lastUpdated: repoData.updated_at,
    };
  },
});

/**
 * Decode base64 content from GitHub API
 */
function decodeBase64Content(base64Content: string): string {
  try {
    const base64 = base64Content.replace(/\n/g, "");
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    throw new Error("Invalid file content encoding");
  }
}

/**
 * Parse YAML frontmatter from SKILL.md content
 * Returns the description from the frontmatter, or null if not found
 */
function parseSkillMdFrontmatter(content: string): { name?: string; description?: string } | null {
  // Match YAML frontmatter between --- delimiters
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    return null;
  }

  const frontmatter = frontmatterMatch[1];
  const result: { name?: string; description?: string } = {};

  // Parse name field
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  if (nameMatch) {
    result.name = nameMatch[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
  }

  // Parse description field (can be single or multi-line)
  // First check for multi-line description with pipe or greater-than
  const multiLineMatch = frontmatter.match(/^description:\s*[|>][-+]?\s*\n((?:[ ]{2,}.*\n?)+)/m);
  if (multiLineMatch) {
    result.description = multiLineMatch[1]
      .split('\n')
      .map(line => line.replace(/^\s{2,}/, '').trim())
      .filter(line => line)
      .join(' ');
  } else {
    // Try single-line description
    const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
    if (descMatch) {
      result.description = descMatch[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
    }
  }

  return result;
}

/**
 * Parse GitHub URL to extract owner, repo name, and optional path
 */
function parseGitHubUrl(url: string): { owner: string; repo: string; path?: string } | null {
  const cleanUrl = url.trim().replace(/\.git$/, "");

  // Match URLs with tree/main/path or tree/master/path
  const treePattern = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/tree\/[^\/]+\/(.+)/;
  const treeMatch = cleanUrl.match(treePattern);
  if (treeMatch) {
    if (treeMatch[3].includes("..")) {
      return null;
    }
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
 * Action to find and delete skills with GitHub URLs returning 404
 * This is an admin operation that should be run manually
 */
export const cleanupBrokenSkills = internalAction({
  args: {},
  handler: async (ctx) => {
    const BASE_DELAY_MS = 200;
    const MAX_BACKOFF_MS = 10_000;
    let backoffMs = 0;
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Get all skills
    const skills = await ctx.runQuery(internal.skills.getAllSkills);

    const results: {
      checked: number;
      deleted: string[];
      errors: string[];
    } = {
      checked: 0,
      deleted: [],
      errors: [],
    };

    for (const skill of skills) {
      if (skill.source !== "github" || !skill.repoUrl) {
        continue;
      }
      results.checked++;
      const delay = backoffMs > 0 ? backoffMs : BASE_DELAY_MS;
      await wait(delay);

      // Parse the GitHub URL to get owner, repo, and path
      const parsed = parseGitHubUrl(skill.repoUrl);
      if (!parsed) {
        results.errors.push(`Invalid URL format: ${skill.repoUrl}`);
        continue;
      }

      const { owner, repo, path } = parsed;

      // Check if the repo exists first
      const repoCheckUrl = `https://api.github.com/repos/${owner}/${repo}`;

      try {
        const repoResponse = await fetch(repoCheckUrl, {
          headers: {
            Accept: "application/vnd.github.v3+json",
            ...(process.env.GITHUB_TOKEN && {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            }),
          },
        });

        if (repoResponse.status === 404) {
          // Repo doesn't exist, delete the skill
          console.log(`Repo not found (404): ${skill.repoUrl}`);
          await ctx.runMutation(internal.skills.deleteSkillInternal, {
            skillId: skill._id as Id<"skills">,
          });
          results.deleted.push(`${skill.name} (${skill.repoUrl}) - repo not found`);
          continue;
        }

        if (!repoResponse.ok) {
          if (repoResponse.status === 403) {
            results.errors.push(`Rate limited checking: ${skill.repoUrl}`);
            backoffMs = Math.min(backoffMs ? backoffMs * 2 : 1000, MAX_BACKOFF_MS);
          } else {
            results.errors.push(`Error ${repoResponse.status} checking: ${skill.repoUrl}`);
            backoffMs = 0;
          }
          continue;
        }
        backoffMs = 0;

        // If there's a path, check if the path/SKILL.md exists
        if (path) {
          const skillMdPath = `${path}/SKILL.md`;
          const skillMdUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${skillMdPath}`;

          const fileResponse = await fetch(skillMdUrl, {
            headers: {
              Accept: "application/vnd.github.v3+json",
              ...(process.env.GITHUB_TOKEN && {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              }),
            },
          });

          if (fileResponse.status === 404) {
            // Try lowercase
            const skillMdPathLower = `${path}/skill.md`;
            const skillMdUrlLower = `https://api.github.com/repos/${owner}/${repo}/contents/${skillMdPathLower}`;

            const fileResponse2 = await fetch(skillMdUrlLower, {
              headers: {
                Accept: "application/vnd.github.v3+json",
                ...(process.env.GITHUB_TOKEN && {
                  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                }),
              },
            });

            if (fileResponse2.status === 404) {
              // SKILL.md doesn't exist, delete the skill
              console.log(`SKILL.md not found (404): ${skill.repoUrl}`);
              await ctx.runMutation(internal.skills.deleteSkillInternal, {
                skillId: skill._id as Id<"skills">,
              });
              results.deleted.push(`${skill.name} (${skill.repoUrl}) - SKILL.md not found`);
              continue;
            }
            if (fileResponse2.status === 403) {
              results.errors.push(`Rate limited checking: ${skill.repoUrl}`);
              backoffMs = Math.min(backoffMs ? backoffMs * 2 : 1000, MAX_BACKOFF_MS);
              continue;
            }
          }
          if (fileResponse.status === 403) {
            results.errors.push(`Rate limited checking: ${skill.repoUrl}`);
            backoffMs = Math.min(backoffMs ? backoffMs * 2 : 1000, MAX_BACKOFF_MS);
            continue;
          }
        }

        console.log(`OK: ${skill.repoUrl}`);
      } catch (error) {
        results.errors.push(`Exception checking ${skill.repoUrl}: ${error}`);
      }
    }

    return results;
  },
});

/**
 * Action to find and delete skills from repos with low engagement
 * Deletes skills where repo has < minStars AND < minContributors
 * This is an admin operation that should be run manually via CLI
 */
// SECURITY: keep internal-only to prevent public misuse.
export const cleanupLowEngagementSkills = internalAction({
  args: {
    minStars: v.number(),
    minContributors: v.number(),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { minStars, minContributors, dryRun = false } = args;

    // Get all skills
    const skills = await ctx.runQuery(internal.skills.getAllSkills);

    const results: {
      checked: number;
      deleted: string[];
      kept: string[];
      errors: string[];
    } = {
      checked: 0,
      deleted: [],
      kept: [],
      errors: [],
    };

    for (const skill of skills) {
      if (skill.source !== "github" || !skill.repoUrl) {
        continue;
      }
      results.checked++;

      // Parse the GitHub URL to get owner and repo
      const parsed = parseGitHubUrl(skill.repoUrl);
      if (!parsed) {
        results.errors.push(`Invalid URL format: ${skill.repoUrl}`);
        continue;
      }

      const { owner, repo } = parsed;

      try {
        // Fetch repo info to get current stars
        const repoUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const repoResponse = await fetch(repoUrl, {
          headers: {
            Accept: "application/vnd.github.v3+json",
            ...(process.env.GITHUB_TOKEN && {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            }),
          },
        });

        if (repoResponse.status === 404) {
          // Repo doesn't exist - skip (handled by cleanupBrokenSkills)
          results.errors.push(`Repo not found: ${skill.repoUrl}`);
          continue;
        }

        if (repoResponse.status === 403) {
          results.errors.push(`Rate limited checking: ${skill.repoUrl}`);
          continue;
        }

        if (!repoResponse.ok) {
          results.errors.push(`Error ${repoResponse.status} checking: ${skill.repoUrl}`);
          continue;
        }

        const repoData = await repoResponse.json();
        const stars = repoData.stargazers_count || 0;

        // Fetch contributors count
        const contributorsUrl = `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=1&anon=1`;
        const contributorsResponse = await fetch(contributorsUrl, {
          headers: {
            Accept: "application/vnd.github.v3+json",
            ...(process.env.GITHUB_TOKEN && {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            }),
          },
        });

        let contributorsCount = 0;

        if (contributorsResponse.ok) {
          // GitHub returns Link header with last page number for pagination
          const linkHeader = contributorsResponse.headers.get("Link");
          if (linkHeader) {
            // Parse Link header to get total count
            const lastMatch = linkHeader.match(/&page=(\d+)>; rel="last"/);
            if (lastMatch) {
              contributorsCount = parseInt(lastMatch[1], 10);
            } else {
              // Only one page
              const contributors = await contributorsResponse.json();
              contributorsCount = Array.isArray(contributors) ? contributors.length : 0;
            }
          } else {
            // No pagination header - count the array
            const contributors = await contributorsResponse.json();
            contributorsCount = Array.isArray(contributors) ? contributors.length : 0;
          }
        }

        // Check if below thresholds (both conditions must be true)
        if (stars < minStars && contributorsCount < minContributors) {
          if (dryRun) {
            results.deleted.push(
              `[DRY RUN] ${skill.name} (${skill.repoUrl}) - ${stars} stars, ${contributorsCount} contributors`
            );
          } else {
            await ctx.runMutation(internal.skills.deleteSkillInternal, {
              skillId: skill._id as Id<"skills">,
            });
            results.deleted.push(
              `${skill.name} (${skill.repoUrl}) - ${stars} stars, ${contributorsCount} contributors`
            );
          }
        } else {
          results.kept.push(
            `${skill.name} - ${stars} stars, ${contributorsCount} contributors`
          );
        }

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        results.errors.push(`Exception checking ${skill.repoUrl}: ${error}`);
      }
    }

    return results;
  },
});
