#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { installSkill } from './install';
import { listSkills } from './list';
import { removeSkill } from './remove';

const packageJson = require('../package.json') as { version: string };

const program = new Command();

program
  .name('lmskills')
  .description('CLI tool to fetch and install Claude skills from GitHub')
  .version(packageJson.version);

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
