import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import chalk from 'chalk';
import ora from 'ora';
import {
  SkillManifest,
  VersionsRegistry,
  PublishedSkillVersion,
} from './types';

const MANIFEST_FILE = 'skill.json';
const REGISTRY_DIR = '.lmskills';
const REGISTRY_FILE = 'versions.json';
const ARTIFACTS_DIR = 'artifacts';

const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function readManifest(manifestPath: string): SkillManifest {
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  return JSON.parse(raw) as SkillManifest;
}

function assertValidManifest(manifest: SkillManifest): void {
  if (!manifest.name?.trim()) {
    throw new Error('Manifest missing "name"');
  }
  if (!manifest.slug?.trim()) {
    throw new Error('Manifest missing "slug"');
  }
  if (!manifest.version?.trim()) {
    throw new Error('Manifest missing "version"');
  }
  if (!SEMVER_PATTERN.test(manifest.version)) {
    throw new Error('Manifest version must be valid semver');
  }
  if (!manifest.description?.trim()) {
    throw new Error('Manifest missing "description"');
  }
  if (!manifest.author?.trim()) {
    throw new Error('Manifest missing "author"');
  }
  if (!manifest.license?.trim()) {
    throw new Error('Manifest missing "license"');
  }
  if (!manifest.entry?.trim()) {
    throw new Error('Manifest missing "entry"');
  }
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    throw new Error('Manifest "files" must be a non-empty array');
  }
  const normalizeForMatch = (value: string) =>
    value.replace(/\\/g, '/').replace(/^\.\//, '');
  const entry = normalizeForMatch(manifest.entry);
  const files = manifest.files.map(normalizeForMatch);
  if (!files.includes(entry)) {
    throw new Error('Manifest "entry" must be included in "files"');
  }
}

function normalizeRelativePath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.startsWith('/') || normalized.startsWith('..')) {
    throw new Error(`Invalid file path: ${filePath}`);
  }
  if (normalized.includes('/../') || normalized.endsWith('/..')) {
    throw new Error(`Invalid file path: ${filePath}`);
  }
  if (normalized.includes('\u0000')) {
    throw new Error(`Invalid file path: ${filePath}`);
  }
  return normalized.replace(/^\\.\\//, '');
}

function collectFiles(manifest: SkillManifest, baseDir: string): string[] {
  const unique = new Set<string>();
  unique.add(normalizeRelativePath(MANIFEST_FILE));
  for (const file of manifest.files) {
    unique.add(normalizeRelativePath(file));
  }

  const files: string[] = [];
  for (const normalized of unique) {
    const absPath = path.resolve(baseDir, normalized);
    const resolvedBase = path.resolve(baseDir) + path.sep;
    if (!absPath.startsWith(resolvedBase)) {
      throw new Error(`Invalid file path outside skill directory: ${normalized}`);
    }
    const stat = fs.statSync(absPath);
    if (!stat.isFile()) {
      throw new Error(`Expected file but found directory: ${normalized}`);
    }
    files.push(normalized);
  }

  return files;
}

function writeString(buffer: Buffer, value: string, offset: number, length: number) {
  const bytes = Buffer.from(value);
  bytes.copy(buffer, offset, 0, Math.min(bytes.length, length));
}

function writeOctal(buffer: Buffer, value: number, offset: number, length: number) {
  const octal = value.toString(8);
  const padded = octal.padStart(length - 1, '0') + '\0';
  buffer.write(padded, offset, length, 'ascii');
}

function createTarball(files: string[], baseDir: string): Buffer {
  const blocks: Buffer[] = [];
  const now = Math.floor(Date.now() / 1000);

  for (const file of files) {
    const absPath = path.resolve(baseDir, file);
    const data = fs.readFileSync(absPath);
    const header = Buffer.alloc(512, 0);

    const entryName = file.replace(/\\/g, '/');
    writeString(header, entryName, 0, 100);
    writeOctal(header, 0o644, 100, 8);
    writeOctal(header, 0, 108, 8);
    writeOctal(header, 0, 116, 8);
    writeOctal(header, data.length, 124, 12);
    writeOctal(header, now, 136, 12);

    header.fill(0x20, 148, 156);
    header[156] = 0x30; // '0'
    writeString(header, 'ustar', 257, 6);
    writeString(header, '00', 263, 2);

    let checksum = 0;
    for (const byte of header) {
      checksum += byte;
    }
    writeOctal(header, checksum, 148, 8);

    blocks.push(header);
    blocks.push(data);

    const remainder = data.length % 512;
    if (remainder !== 0) {
      blocks.push(Buffer.alloc(512 - remainder, 0));
    }
  }

  blocks.push(Buffer.alloc(1024, 0));
  return Buffer.concat(blocks);
}

function hashBuffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function readRegistry(registryPath: string): VersionsRegistry {
  if (!fs.existsSync(registryPath)) {
    return { skills: [] };
  }
  const raw = fs.readFileSync(registryPath, 'utf-8');
  return JSON.parse(raw) as VersionsRegistry;
}

function writeRegistry(registryPath: string, registry: VersionsRegistry): void {
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');
}

export async function publishSkill(): Promise<void> {
  const spinner = ora();

  try {
    const baseDir = process.cwd();
    const manifestPath = path.resolve(baseDir, MANIFEST_FILE);

    if (!fs.existsSync(manifestPath)) {
      throw new Error('skill.json not found in this directory');
    }

    spinner.start('Reading skill.json...');
    const manifest = readManifest(manifestPath);
    assertValidManifest(manifest);
    spinner.succeed('Validated skill.json');

    spinner.start('Collecting files...');
    const files = collectFiles(manifest, baseDir);
    spinner.succeed(`Found ${files.length} files`);

    spinner.start('Creating tarball...');
    const tarball = createTarball(files, baseDir);
    const hash = hashBuffer(tarball);
    const sizeBytes = tarball.length;
    spinner.succeed('Tarball created');

    const registryDir = path.join(baseDir, REGISTRY_DIR, ARTIFACTS_DIR);
    fs.mkdirSync(registryDir, { recursive: true });

    const artifactPath = path.join(
      registryDir,
      `${manifest.slug}-${manifest.version}.tar`
    );
    fs.writeFileSync(artifactPath, tarball);

    const registryPath = path.join(baseDir, REGISTRY_DIR, REGISTRY_FILE);
    const registry = readRegistry(registryPath);

    let record = registry.skills.find((entry) => entry.slug === manifest.slug);
    if (!record) {
      record = { slug: manifest.slug, name: manifest.name, versions: [] };
      registry.skills.push(record);
    }

    if (record.versions.some((version) => version.version === manifest.version)) {
      throw new Error(`Version ${manifest.version} already published locally`);
    }

    const publishedVersion: PublishedSkillVersion = {
      version: manifest.version,
      hash,
      sizeBytes,
      artifactPath,
      publishedAt: new Date().toISOString(),
    };

    record.versions.push(publishedVersion);
    record.versions.sort((a, b) => a.version.localeCompare(b.version));

    writeRegistry(registryPath, registry);

    console.log(chalk.green('\n✓ Skill packaged successfully'));
    console.log(chalk.gray(`  Artifact: ${artifactPath}`));
    console.log(chalk.gray(`  Size: ${sizeBytes.toLocaleString()} bytes`));
    console.log(chalk.gray(`  SHA256: ${hash}`));
  } catch (error) {
    spinner.fail('Publish failed');

    if (error instanceof Error) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else {
      console.error(chalk.red('\nAn unknown error occurred'));
    }

    process.exit(1);
  }
}
