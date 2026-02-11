#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { installSkill } from './install';
import { listSkills } from './list';
import { removeSkill } from './remove';
import { initSkill } from './init';
import { publishSkill } from './publish';
import { listVersions } from './versions';
import { login } from './auth';
import { createRepo, listRepos } from './repo';

import packageJson from '../package.json';

const program = new Command();

program
  .name('lmskills')
  .description('CLI tool to fetch and install Claude skills from GitHub')
  .version((packageJson as { version: string }).version);

program
  .command('install <github-url>')
  .description('Install a skill from a GitHub subdirectory URL')
  .option('-g, --global', 'Install globally instead of in the current project')
  .action(async (githubUrl: string, options: { global?: boolean }) => {
    await installSkill(githubUrl, options);
  });

program
  .command('list')
  .description('List installed skills')
  .option('-g, --global', 'List global skills instead of local')
  .action((options: { global?: boolean }) => {
    listSkills(options);
  });

program
  .command('remove <skill-name>')
  .alias('rm')
  .description('Remove an installed skill')
  .option('-g, --global', 'Remove from global skills instead of local')
  .action((skillName: string, options: { global?: boolean }) => {
    removeSkill(skillName, options);
  });

program
  .command('init')
  .description('Create a skill.json template in the current directory')
  .action(async () => {
    await initSkill();
  });

program
  .command('login')
  .description('Authenticate with LMSkills in your browser')
  .action(async () => {
    await login();
  });

program
  .command('publish')
  .description('Package and validate the current skill for publishing')
  .option('--remote', 'Also publish artifact to the hosted backend')
  .option('--set-default', 'Set published version as default (remote mode)')
  .option('--no-set-default', 'Do not set the published version as default')
  .option('--changelog <text>', 'Optional changelog text for this version')
  .action(async (options: {
    remote?: boolean;
    setDefault?: boolean;
    changelog?: string;
  }) => {
    await publishSkill({
      remote: options.remote,
      setDefault: options.setDefault,
      changelog: options.changelog,
    });
  });

program
  .command('versions')
  .description('List locally published versions for the current skill')
  .action(async () => {
    await listVersions();
  });

const repoCommand = program
  .command('repo')
  .description('Manage skill repositories on LMSkills');

repoCommand
  .command('create')
  .description('Create a new skill repository on LMSkills')
  .option('--name <name>', 'Repository name')
  .option('--slug <slug>', 'URL-safe identifier')
  .option('--description <description>', 'Repository description')
  .action(async (options: { name?: string; slug?: string; description?: string }) => {
    await createRepo(options);
  });

repoCommand
  .command('list')
  .description('List your skill repositories on LMSkills')
  .action(async () => {
    await listRepos();
  });

// Handle unknown commands with helpful error messages
program.on('command:*', (operands) => {
  const unknownCommand = operands[0];

  console.error(chalk.red(`\nError: Unknown command '${unknownCommand}'`));

  // Check if it looks like a GitHub URL
  if (unknownCommand.includes('github.com')) {
    console.log(chalk.yellow('\nIt looks like you provided a GitHub URL.'));
    console.log(chalk.yellow('Did you mean to run:\n'));
    console.log(chalk.cyan(`  lmskills install ${unknownCommand}`));
    console.log(chalk.gray('\nOr with npx:'));
    console.log(chalk.cyan(`  npx lmskills-cli install ${unknownCommand}`));
  } else {
    console.log(chalk.gray('\nRun "lmskills --help" to see available commands.'));
  }

  process.exit(1);
});

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
