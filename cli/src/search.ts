import chalk from 'chalk';
import ora from 'ora';
import fetch from 'node-fetch';
import { getDefaultApiUrl, normalizeBaseUrl, readCliConfig } from './auth';

interface SearchSkill {
  name: string;
  slug: string;
  fullName: string;
  description: string;
  owner: { handle: string } | null;
  source: string;
  license: string | null;
  stars: number | null;
  createdAt: number;
}

export interface SearchOptions {
  limit?: string;
}

async function parseApiError(response: { ok: boolean; status: number; statusText: string; json: () => Promise<unknown> }): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    if (payload.error) {
      return payload.error;
    }
  } catch {
    // Ignore JSON parsing errors
  }
  return response.statusText || 'Unknown API error';
}

export async function searchSkills(query?: string, options: SearchOptions = {}): Promise<void> {
  const spinner = ora();

  try {
    const savedConfig = readCliConfig();
    const apiUrl = normalizeBaseUrl(savedConfig.apiUrl ?? getDefaultApiUrl());

    const params = new URLSearchParams();
    if (query) {
      params.set('query', query);
    }
    if (options.limit) {
      params.set('limit', options.limit);
    }

    const url = `${apiUrl}/api/cli/skills/search${params.toString() ? `?${params.toString()}` : ''}`;

    spinner.start('Searching skills...');

    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const message = await parseApiError(response);
      throw new Error(`Search failed: ${message}`);
    }

    const result = (await response.json()) as { skills: SearchSkill[] };

    spinner.succeed('Search complete');

    if (result.skills.length === 0) {
      console.log(chalk.gray('\nNo skills found.'));
      if (query) {
        console.log(chalk.gray(`Try a different search term or run "lmskills search" to browse all.`));
      }
      return;
    }

    console.log(chalk.bold(`\n  Skills (${result.skills.length}):\n`));

    for (const skill of result.skills) {
      const ownerHandle = skill.owner?.handle ?? 'unknown';
      const stars = skill.stars != null ? `${skill.stars}` : '-';
      const description = skill.description.length > 60
        ? skill.description.slice(0, 57) + '...'
        : skill.description;

      console.log(chalk.cyan(`  ${skill.fullName || `${ownerHandle}/${skill.slug}`}`));
      console.log(chalk.gray(`    ${description}`));
      console.log(chalk.gray(`    source: ${skill.source}  |  stars: ${stars}  |  license: ${skill.license || '-'}`));
      console.log();
    }
  } catch (error) {
    spinner.fail('Search failed');

    if (error instanceof Error) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else {
      console.error(chalk.red('\nAn unknown error occurred'));
    }

    process.exit(1);
  }
}
