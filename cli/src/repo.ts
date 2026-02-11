import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import fetch from 'node-fetch';
import { getDefaultApiUrl, normalizeBaseUrl, readCliConfig } from './auth';
import { SkillManifest } from './types';

const MANIFEST_FILE = 'skill.json';

interface RepoCreateOptions {
  name?: string;
  slug?: string;
  description?: string;
}

interface RepoListItem {
  id: string;
  name: string;
  slug: string;
  fullName: string;
  description: string;
  visibility: string;
  versionsCount: number;
  latestVersion: string | null;
  createdAt: number;
  updatedAt: number;
}

function getAuthConfig() {
  const savedConfig = readCliConfig();
  const apiUrl = normalizeBaseUrl(savedConfig.apiUrl ?? getDefaultApiUrl());
  const authToken = savedConfig.authToken;

  if (!authToken) {
    throw new Error(
      'Not authenticated. Run "lmskills login" first.'
    );
  }

  return { apiUrl, authToken };
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

export async function createRepo(options: RepoCreateOptions = {}): Promise<void> {
  const spinner = ora();

  try {
    const { apiUrl, authToken } = getAuthConfig();

    let name = options.name;
    let slug = options.slug;
    let description = options.description;

    // Try to read from skill.json if fields are missing
    const manifestPath = path.resolve(process.cwd(), MANIFEST_FILE);
    if (fs.existsSync(manifestPath)) {
      try {
        const raw = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = JSON.parse(raw) as SkillManifest;
        if (!name && manifest.name) name = manifest.name;
        if (!slug && manifest.slug) slug = manifest.slug;
        if (!description && manifest.description) description = manifest.description;
        spinner.info('Read defaults from skill.json');
      } catch {
        // Ignore manifest read errors
      }
    }

    if (!name || !slug || !description) {
      throw new Error(
        'Missing required fields: name, slug, description.\n' +
        'Provide them as flags or create a skill.json with "lmskills init".'
      );
    }

    spinner.start('Creating repository...');

    const response = await fetch(`${apiUrl}/api/cli/repos/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, slug, description }),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          'Authentication failed. Run "lmskills login" to re-authenticate.'
        );
      }
      const message = await parseApiError(response);
      throw new Error(`Failed to create repository: ${message}`);
    }

    const result = (await response.json()) as {
      repositoryId: string;
      fullName: string;
    };

    spinner.succeed('Repository created');

    console.log(chalk.green('\n✓ Repository created successfully'));
    console.log(chalk.gray(`  Name: ${name}`));
    console.log(chalk.gray(`  Full name: ${result.fullName}`));
    console.log(chalk.gray(`  ID: ${result.repositoryId}`));
    console.log(
      chalk.gray(
        `\nPublish your first version with: lmskills publish --remote`
      )
    );
  } catch (error) {
    spinner.fail('Failed to create repository');

    if (error instanceof Error) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else {
      console.error(chalk.red('\nAn unknown error occurred'));
    }

    process.exit(1);
  }
}

export async function listRepos(): Promise<void> {
  const spinner = ora();

  try {
    const { apiUrl, authToken } = getAuthConfig();

    spinner.start('Fetching repositories...');

    const response = await fetch(`${apiUrl}/api/cli/repos/list`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          'Authentication failed. Run "lmskills login" to re-authenticate.'
        );
      }
      const message = await parseApiError(response);
      throw new Error(`Failed to list repositories: ${message}`);
    }

    const result = (await response.json()) as {
      repositories: RepoListItem[];
    };

    spinner.succeed('Repositories fetched');

    if (result.repositories.length === 0) {
      console.log(chalk.gray('\nNo repositories found.'));
      console.log(
        chalk.gray('Create one with: lmskills repo create')
      );
      return;
    }

    console.log(chalk.bold(`\n  Repositories (${result.repositories.length}):\n`));

    for (const repo of result.repositories) {
      const versionInfo = repo.latestVersion
        ? `v${repo.latestVersion} (${repo.versionsCount} version${repo.versionsCount !== 1 ? 's' : ''})`
        : 'no versions';

      console.log(chalk.cyan(`  ${repo.fullName}`));
      console.log(chalk.gray(`    ${repo.description}`));
      console.log(chalk.gray(`    ${versionInfo}  |  ${repo.visibility}`));
      console.log();
    }
  } catch (error) {
    spinner.fail('Failed to list repositories');

    if (error instanceof Error) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else {
      console.error(chalk.red('\nAn unknown error occurred'));
    }

    process.exit(1);
  }
}
