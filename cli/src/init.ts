import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { SkillManifest } from './types';

const MANIFEST_FILE = 'skill.json';

export async function initSkill(): Promise<void> {
  const spinner = ora();

  try {
    const manifestPath = path.resolve(process.cwd(), MANIFEST_FILE);

    if (fs.existsSync(manifestPath)) {
      throw new Error('skill.json already exists in this directory');
    }

    const template: SkillManifest = {
      name: 'Weather Skill',
      slug: 'weather',
      version: '1.0.0',
      description: 'Get current weather info',
      author: 'username',
      license: 'MIT',
      entry: 'SKILL.md',
      files: ['SKILL.md', 'utils.js'],
    };

    spinner.start('Creating skill.json...');
    fs.writeFileSync(manifestPath, JSON.stringify(template, null, 2) + '\n');
    spinner.succeed('Created skill.json template');

    console.log(chalk.green('\n✓ skill.json ready'));
    console.log(chalk.gray(`  Path: ${manifestPath}`));
  } catch (error) {
    spinner.fail('Init failed');

    if (error instanceof Error) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else {
      console.error(chalk.red('\nAn unknown error occurred'));
    }

    process.exit(1);
  }
}
