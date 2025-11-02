import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
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

export async function installSkill(
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
