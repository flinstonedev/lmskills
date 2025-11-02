import chalk from 'chalk';
import {
  readMetadata,
  removeSkillMetadata,
  deleteDirectory,
} from './utils';

export function removeSkill(
  skillName: string,
  options: { global?: boolean }
): void {
  const isGlobal = options.global || false;
  const metadata = readMetadata(isGlobal);

  const skill = metadata.find(s => s.name === skillName);

  if (!skill) {
    console.error(
      chalk.red(
        `\nSkill "${skillName}" not found in ${isGlobal ? 'global' : 'local'} installations.`
      )
    );
    console.log(
      chalk.gray(
        `\nRun "lmskills list${isGlobal ? ' --global' : ''}" to see installed skills.`
      )
    );
    process.exit(1);
  }

  try {
    // Delete the skill directory
    deleteDirectory(skill.path);

    // Remove from metadata
    removeSkillMetadata(skillName, isGlobal);

    console.log(
      chalk.green(
        `\n✓ Successfully removed "${skillName}" from ${isGlobal ? 'global' : 'local'} installations`
      )
    );
  } catch (error) {
    console.error(
      chalk.red(`\nError removing skill: ${error instanceof Error ? error.message : 'Unknown error'}`)
    );
    process.exit(1);
  }
}
