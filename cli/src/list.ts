import chalk from 'chalk';
import { readMetadata } from './utils';

export function listSkills(options: { global?: boolean }): void {
  const isGlobal = options.global || false;
  const metadata = readMetadata(isGlobal);

  const scope = isGlobal ? 'global' : 'local';

  if (metadata.length === 0) {
    console.log(chalk.yellow(`No ${scope} skills installed.`));
    console.log(
      chalk.gray(
        `\nTo install a skill, run:\n  lmskills install <github-url> ${isGlobal ? '--global' : ''}`
      )
    );
    return;
  }

  console.log(chalk.bold(`\n${scope.toUpperCase()} SKILLS (${metadata.length}):\n`));

  metadata.forEach(skill => {
    console.log(chalk.cyan(`  ${skill.name}`));
    console.log(chalk.gray(`    Source: ${skill.source}`));
    console.log(chalk.gray(`    Installed: ${new Date(skill.installedAt).toLocaleString()}`));
    console.log(chalk.gray(`    Path: ${skill.path}`));
    console.log();
  });
}
