import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SkillMetadata } from './types';

export const SKILLS_DIR = 'skills';
export const METADATA_FILE = '.lmskills-metadata.json';

function sanitizeSkillName(raw: string): string {
  const name = (raw || '').trim().toLowerCase();

  if (!name || name === '.' || name === '..') {
    throw new Error('Invalid skill name derived from URL path');
  }

  // Disallow any path separators outright.
  if (name.includes('/') || name.includes('\\')) {
    throw new Error('Invalid skill name: contains path separators');
  }

  // Keep names simple and filesystem-safe.
  // Allows: letters, numbers, dot, underscore, hyphen (max 64 chars).
  if (!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(name)) {
    throw new Error(
      'Invalid skill name: must match /^[a-z0-9][a-z0-9._-]{0,63}$/'
    );
  }

  return name;
}

/**
 * Get the path to the local .claude directory (project-specific)
 */
export function getLocalClaudePath(): string {
  const cwd = process.cwd();
  return path.join(cwd, '.claude');
}

/**
 * Get the path to the global .claude directory (user-wide)
 */
export function getGlobalClaudePath(): string {
  return path.join(os.homedir(), '.claude');
}

/**
 * Get the skills directory path
 */
export function getSkillsPath(isGlobal: boolean): string {
  const claudePath = isGlobal ? getGlobalClaudePath() : getLocalClaudePath();
  return path.join(claudePath, SKILLS_DIR);
}

/**
 * Ensure the skills directory exists
 */
export function ensureSkillsDir(isGlobal: boolean): void {
  const skillsPath = getSkillsPath(isGlobal);
  fs.mkdirSync(skillsPath, { recursive: true });
}

/**
 * Get metadata file path
 */
export function getMetadataPath(isGlobal: boolean): string {
  const skillsPath = getSkillsPath(isGlobal);
  return path.join(skillsPath, METADATA_FILE);
}

/**
 * Read metadata for all installed skills
 */
export function readMetadata(isGlobal: boolean): SkillMetadata[] {
  const metadataPath = getMetadataPath(isGlobal);

  if (!fs.existsSync(metadataPath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(metadataPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading metadata: ${error}`);
    return [];
  }
}

/**
 * Write metadata for installed skills
 */
export function writeMetadata(metadata: SkillMetadata[], isGlobal: boolean): void {
  const metadataPath = getMetadataPath(isGlobal);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

/**
 * Add a skill to metadata
 */
export function addSkillMetadata(skill: SkillMetadata, isGlobal: boolean): void {
  const metadata = readMetadata(isGlobal);

  // Remove existing entry if it exists
  const filtered = metadata.filter(s => s.name !== skill.name);
  filtered.push(skill);

  writeMetadata(filtered, isGlobal);
}

/**
 * Remove a skill from metadata
 */
export function removeSkillMetadata(skillName: string, isGlobal: boolean): void {
  const metadata = readMetadata(isGlobal);
  const filtered = metadata.filter(s => s.name !== skillName);
  writeMetadata(filtered, isGlobal);
}

/**
 * Get a skill's directory name from its source URL
 */
export function getSkillDirName(source: string): string {
  // Extract a clean name from the GitHub URL
  const parts = source.split('/').filter(Boolean);
  const lastPart = parts[parts.length - 1];

  // Remove .git suffix if present
  const raw = lastPart.replace(/\.git$/, '');
  return sanitizeSkillName(raw);
}

/**
 * Delete a directory recursively
 */
export function deleteDirectory(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}
