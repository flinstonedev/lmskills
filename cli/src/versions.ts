import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { SkillManifest, VersionsRegistry } from './types';

const MANIFEST_FILE = 'skill.json';
const REGISTRY_DIR = '.lmskills';
const REGISTRY_FILE = 'versions.json';

function readManifest(manifestPath: string): SkillManifest {
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  return JSON.parse(raw) as SkillManifest;
}

function readRegistry(registryPath: string): VersionsRegistry {
  if (!fs.existsSync(registryPath)) {
    return { skills: [] };
  }
  const raw = fs.readFileSync(registryPath, 'utf-8');
  return JSON.parse(raw) as VersionsRegistry;
}

export async function listVersions(): Promise<void> {
  const spinner = ora();

  try {
    const baseDir = process.cwd();
    const manifestPath = path.resolve(baseDir, MANIFEST_FILE);

    if (!fs.existsSync(manifestPath)) {
      throw new Error('skill.json not found in this directory');
    }

    spinner.start('Loading skill metadata...');
    const manifest = readManifest(manifestPath);
    spinner.succeed('Loaded skill metadata');

    const registryPath = path.join(baseDir, REGISTRY_DIR, REGISTRY_FILE);
    const registry = readRegistry(registryPath);

    const record = registry.skills.find((entry) => entry.slug === manifest.slug);

    if (!record || record.versions.length === 0) {
      console.log(chalk.yellow('\nNo published versions found for this skill.'));
      console.log(chalk.gray(`  Current manifest version: ${manifest.version}`));
      return;
    }

    console.log(chalk.green(`\nPublished versions for ${record.name} (${record.slug}):`));
    for (const version of record.versions) {
      const artifactPath = path.isAbsolute(version.artifactPath)
        ? version.artifactPath
        : path.resolve(path.dirname(registryPath), version.artifactPath);
      console.log(chalk.cyan(`  ${version.version}`));
      console.log(chalk.gray(`    Published: ${version.publishedAt}`));
      console.log(chalk.gray(`    SHA256: ${version.hash}`));
      console.log(chalk.gray(`    Size: ${version.sizeBytes.toLocaleString()} bytes`));
      console.log(chalk.gray(`    Artifact: ${artifactPath}`));
    }
  } catch (error) {
    spinner.fail('Failed to list versions');

    if (error instanceof Error) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else {
      console.error(chalk.red('\nAn unknown error occurred'));
    }

    process.exit(1);
  }
}
