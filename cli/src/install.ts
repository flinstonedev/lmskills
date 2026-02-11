import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import chalk from 'chalk';
import ora from 'ora';
import fetch from 'node-fetch';
import { parseGitHubUrl, downloadGitHubDirectory } from './github';
import {
  ensureSkillsDir,
  getSkillsPath,
  addSkillMetadata,
  getSkillDirName,
  deleteDirectory,
  readMetadata,
} from './utils';
import { SkillMetadata } from './types';
import { getDefaultApiUrl, normalizeBaseUrl, readCliConfig } from './auth';

/**
 * Detect whether the input is an owner/slug reference (repository install)
 * vs a GitHub URL (existing flow).
 *
 * owner/slug: no protocol, exactly one slash, no dots in the string.
 */
function isRepoReference(input: string): boolean {
  if (input.includes('://') || input.startsWith('http')) {
    return false;
  }
  const parts = input.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return false;
  }
  // If it contains dots it's more likely a URL fragment
  if (input.includes('.')) {
    return false;
  }
  return true;
}

async function installFromRepo(
  ownerSlug: string,
  options: { global?: boolean; version?: string }
): Promise<void> {
  const isGlobal = options.global || false;
  const spinner = ora();

  try {
    const savedConfig = readCliConfig();
    const apiUrl = normalizeBaseUrl(savedConfig.apiUrl ?? getDefaultApiUrl());
    const authToken = savedConfig.authToken;

    if (!authToken) {
      throw new Error(
        'Not authenticated. Run "lmskills login" first.'
      );
    }

    const [owner, slug] = ownerSlug.split('/');

    // Validate the skill exists
    spinner.start('Fetching skill info...');

    const infoResponse = await fetch(
      `${apiUrl}/api/cli/skills/info?owner=${encodeURIComponent(owner)}&name=${encodeURIComponent(slug)}`,
      { method: 'GET' }
    );

    if (!infoResponse.ok) {
      if (infoResponse.status === 404) {
        throw new Error(`Skill "${ownerSlug}" not found.`);
      }
      const errorPayload = await infoResponse.json().catch(() => ({})) as { error?: string };
      throw new Error(`Failed to fetch skill info: ${errorPayload.error || infoResponse.statusText}`);
    }

    const info = (await infoResponse.json()) as {
      skill: { name: string; slug: string; fullName: string; source: string };
      versions: Array<{ version: string; status: string }>;
    };

    if (info.skill.source !== 'repository') {
      throw new Error(
        `"${ownerSlug}" is a ${info.skill.source} skill. Use "lmskills install <github-url>" for GitHub skills.`
      );
    }

    spinner.succeed(`Found skill: ${info.skill.fullName}`);

    // Check version availability
    if (info.versions.length === 0) {
      throw new Error(`No published versions found for "${ownerSlug}".`);
    }

    const requestedVersion = options.version;
    if (requestedVersion) {
      const available = info.versions.find((v) => v.version === requestedVersion);
      if (!available) {
        throw new Error(
          `Version ${requestedVersion} not found. Available: ${info.versions.map((v) => v.version).join(', ')}`
        );
      }
    }

    // Check if already installed
    const skillName = slug;
    const metadata = readMetadata(isGlobal);
    const existing = metadata.find((s) => s.name === skillName);

    if (existing) {
      console.log(
        chalk.yellow(
          `\nSkill "${skillName}" is already installed at: ${existing.path}`
        )
      );
      console.log(chalk.yellow('Reinstalling will overwrite the existing skill.\n'));
    }

    // Download the tarball
    spinner.start('Downloading skill...');

    const versionParam = requestedVersion ? `?version=${encodeURIComponent(requestedVersion)}` : '';
    const downloadUrl = `${apiUrl}/api/skills/${encodeURIComponent(owner)}/${encodeURIComponent(slug)}/download${versionParam}`;

    const downloadResponse = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      redirect: 'follow',
    });

    if (!downloadResponse.ok) {
      const errorPayload = await downloadResponse.json().catch(() => ({})) as { error?: string };
      throw new Error(
        `Download failed: ${errorPayload.error || downloadResponse.statusText}`
      );
    }

    const tarballBuffer = await downloadResponse.buffer();
    spinner.succeed('Downloaded skill archive');

    // Ensure skills directory and prepare target
    ensureSkillsDir(isGlobal);
    const skillsPath = getSkillsPath(isGlobal);
    const targetDir = path.join(skillsPath, skillName);
    const resolvedSkillsPath = path.resolve(skillsPath) + path.sep;
    const resolvedTargetDir = path.resolve(targetDir) + path.sep;
    if (!resolvedTargetDir.startsWith(resolvedSkillsPath)) {
      throw new Error('Refusing to write outside the skills directory');
    }

    // Remove existing installation if present
    if (existing) {
      deleteDirectory(targetDir);
    }

    // Extract tarball
    spinner.start('Extracting skill...');
    fs.mkdirSync(targetDir, { recursive: true });

    const decompressed = zlib.gunzipSync(tarballBuffer);
    extractTar(decompressed, targetDir);

    spinner.succeed(`Extracted skill to ${targetDir}`);

    // Save metadata
    const skillMetadata: SkillMetadata = {
      name: skillName,
      source: `repository:${ownerSlug}`,
      installedAt: new Date().toISOString(),
      path: targetDir,
      isGlobal,
    };

    addSkillMetadata(skillMetadata, isGlobal);

    console.log(
      chalk.green(
        `\n✓ Successfully installed "${ownerSlug}" ${isGlobal ? 'globally' : 'locally'}`
      )
    );
    console.log(chalk.gray(`  Path: ${targetDir}`));
  } catch (error) {
    spinner.fail('Installation failed');

    if (error instanceof Error) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else {
      console.error(chalk.red('\nAn unknown error occurred'));
    }

    process.exit(1);
  }
}

/**
 * Simple tar extraction (handles standard POSIX tar format).
 * Extracts all regular files from the tar archive into targetDir.
 */
function extractTar(data: Buffer, targetDir: string): void {
  const resolvedTarget = path.resolve(targetDir) + path.sep;
  let offset = 0;

  while (offset + 512 <= data.length) {
    // Read header block (512 bytes)
    const header = data.subarray(offset, offset + 512);

    // Check for end-of-archive (two consecutive zero blocks)
    if (header.every((b) => b === 0)) {
      break;
    }

    // Extract file name (bytes 0-99)
    const rawName = header.subarray(0, 100).toString('utf-8').replace(/\0/g, '');

    // Extract prefix (bytes 345-499) for POSIX ustar format
    const prefix = header.subarray(345, 500).toString('utf-8').replace(/\0/g, '');

    const fileName = prefix ? `${prefix}/${rawName}` : rawName;

    // Extract size (bytes 124-135, octal)
    const sizeStr = header.subarray(124, 136).toString('utf-8').replace(/\0/g, '').trim();
    const fileSize = parseInt(sizeStr, 8) || 0;

    // Extract type flag (byte 156)
    const typeFlag = String.fromCharCode(header[156]);

    offset += 512; // Move past header

    if (fileName && (typeFlag === '0' || typeFlag === '\0') && fileSize > 0) {
      // Regular file — strip the leading directory component (the tarball root)
      const parts = fileName.split('/');
      const relativePath = parts.length > 1 ? parts.slice(1).join('/') : parts[0];

      if (relativePath) {
        const destPath = path.join(targetDir, relativePath);
        const resolvedDest = path.resolve(destPath);

        // Prevent path traversal - ensure file stays within targetDir
        if (!resolvedDest.startsWith(resolvedTarget)) {
          throw new Error(`Refusing to extract file outside target directory: ${fileName}`);
        }

        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.writeFileSync(destPath, data.subarray(offset, offset + fileSize));
      }
    }

    // Advance past file data (rounded up to 512-byte boundary)
    offset += Math.ceil(fileSize / 512) * 512;
  }
}

async function installFromGitHub(
  githubUrl: string,
  options: { global?: boolean }
): Promise<void> {
  const isGlobal = options.global || false;
  const spinner = ora();

  try {
    // Parse the GitHub URL
    spinner.start('Parsing GitHub URL...');
    const parsedUrl = parseGitHubUrl(githubUrl);
    spinner.succeed(
      `Parsed: ${parsedUrl.owner}/${parsedUrl.repo} (${parsedUrl.path})`
    );

    // Derive skill name from the path
    const skillName = getSkillDirName(parsedUrl.path);

    // Check if already installed
    const metadata = readMetadata(isGlobal);
    const existing = metadata.find(s => s.name === skillName);

    if (existing) {
      console.log(
        chalk.yellow(
          `\nSkill "${skillName}" is already installed at: ${existing.path}`
        )
      );
      console.log(chalk.yellow('Reinstalling will overwrite the existing skill.\n'));
    }

    // Ensure skills directory exists
    ensureSkillsDir(isGlobal);

    // Determine target directory
    const skillsPath = getSkillsPath(isGlobal);
    const targetDir = path.join(skillsPath, skillName);
    const resolvedSkillsPath = path.resolve(skillsPath) + path.sep;
    const resolvedTargetDir = path.resolve(targetDir) + path.sep;
    if (!resolvedTargetDir.startsWith(resolvedSkillsPath)) {
      throw new Error('Refusing to write outside the skills directory');
    }

    // Remove existing installation if present
    if (existing) {
      deleteDirectory(targetDir);
    }

    // Download the skill
    spinner.start(`Downloading skill from GitHub...`);
    await downloadGitHubDirectory(parsedUrl, targetDir);
    spinner.succeed(`Downloaded skill to ${targetDir}`);

    // Save metadata
    const skillMetadata: SkillMetadata = {
      name: skillName,
      source: githubUrl,
      installedAt: new Date().toISOString(),
      path: targetDir,
      isGlobal,
    };

    addSkillMetadata(skillMetadata, isGlobal);

    console.log(
      chalk.green(
        `\n✓ Successfully installed "${skillName}" ${isGlobal ? 'globally' : 'locally'}`
      )
    );
    console.log(chalk.gray(`  Path: ${targetDir}`));
  } catch (error) {
    spinner.fail('Installation failed');

    if (error instanceof Error) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else {
      console.error(chalk.red('\nAn unknown error occurred'));
    }

    process.exit(1);
  }
}

export async function installSkill(
  source: string,
  options: { global?: boolean; version?: string }
): Promise<void> {
  if (isRepoReference(source)) {
    await installFromRepo(source, options);
  } else {
    await installFromGitHub(source, options);
  }
}
