import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import chalk from 'chalk';
import ora from 'ora';
import fetch, { Response } from 'node-fetch';
import { getDefaultApiUrl, normalizeBaseUrl, readCliConfig } from './auth';
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
const SAFE_SLUG_PATTERN = /^[A-Za-z0-9._-]+$/;

type SemverParts = {
  major: number;
  minor: number;
  patch: number;
  prerelease: Array<string>;
};

export interface PublishOptions {
  remote?: boolean;
  setDefault?: boolean;
  changelog?: string;
}

interface RemotePublishConfig {
  apiUrl: string;
  authToken: string;
  setDefault: boolean;
  changelog?: string;
}

interface RemotePublishResult {
  skillId: string;
  skillFullName?: string;
  versionId: string;
  storageId: string;
  defaultSet: boolean;
  defaultSetMessage?: string;
}

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
  if (!SAFE_SLUG_PATTERN.test(manifest.slug) || manifest.slug.includes('..')) {
    throw new Error('Manifest "slug" contains invalid characters');
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
  return normalized.replace(/^\.\//, '');
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
    const lstat = fs.lstatSync(absPath);
    if (lstat.isSymbolicLink()) {
      throw new Error(`Symlinks are not allowed: ${normalized}`);
    }
    if (!lstat.isFile()) {
      throw new Error(`Expected file but found directory: ${normalized}`);
    }
    files.push(normalized);
  }

  return files;
}

function parseSemver(version: string): SemverParts {
  const [withoutBuild] = version.split('+', 2);
  const [core, prereleasePart] = withoutBuild.split('-', 2);
  const [major, minor, patch] = core.split('.').map((value) => Number(value));
  const prerelease = prereleasePart ? prereleasePart.split('.') : [];
  return { major, minor, patch, prerelease };
}

function compareIdentifiers(a: string, b: string): number {
  const aNum = Number(a);
  const bNum = Number(b);
  const aIsNum = Number.isInteger(aNum) && String(aNum) === a;
  const bIsNum = Number.isInteger(bNum) && String(bNum) === b;

  if (aIsNum && bIsNum) {
    return aNum - bNum;
  }
  if (aIsNum) {
    return -1;
  }
  if (bIsNum) {
    return 1;
  }
  return a.localeCompare(b);
}

function compareSemver(a: string, b: string): number {
  const left = parseSemver(a);
  const right = parseSemver(b);

  if (left.major !== right.major) return left.major - right.major;
  if (left.minor !== right.minor) return left.minor - right.minor;
  if (left.patch !== right.patch) return left.patch - right.patch;

  const leftPre = left.prerelease;
  const rightPre = right.prerelease;

  if (leftPre.length === 0 && rightPre.length === 0) return 0;
  if (leftPre.length === 0) return 1;
  if (rightPre.length === 0) return -1;

  const maxLen = Math.max(leftPre.length, rightPre.length);
  for (let i = 0; i < maxLen; i += 1) {
    const leftId = leftPre[i];
    const rightId = rightPre[i];
    if (leftId === undefined) return -1;
    if (rightId === undefined) return 1;
    const diff = compareIdentifiers(leftId, rightId);
    if (diff !== 0) return diff;
  }

  return 0;
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
    if (Buffer.byteLength(entryName, 'utf-8') > 100) {
      throw new Error(`File path too long for tar: ${file}`);
    }
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

function resolveRemotePublishConfig(
  options: PublishOptions
): RemotePublishConfig | null {
  const flag = process.env.LMSKILLS_REMOTE_PUBLISH;
  const remoteFromEnv = flag === '1' || flag === 'true';
  const remote = options.remote ?? remoteFromEnv;

  if (!remote) {
    return null;
  }

  const savedConfig = readCliConfig();
  const apiUrl = normalizeBaseUrl(
    savedConfig.apiUrl ?? getDefaultApiUrl()
  );
  const authToken = savedConfig.authToken;

  if (!authToken) {
    throw new Error(
      'Remote publish requested but auth token is missing. Run "lmskills login".'
    );
  }

  return {
    apiUrl,
    authToken,
    setDefault: options.setDefault ?? true,
    changelog: options.changelog,
  };
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    if (payload.error) {
      return payload.error;
    }
  } catch {
    // Ignore JSON parsing errors and fallback to status text
  }
  return response.statusText || 'Unknown API error';
}

async function requestJson<T>(
  url: string,
  authToken: string,
  payload: Record<string, unknown>
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        'Authentication failed. Your session may have expired.\n' +
        'Run "lmskills login" to re-authenticate, then try again.'
      );
    }
    const message = await parseApiError(response);
    throw new Error(`Remote API request failed (${response.status}): ${message}`);
  }

  return (await response.json()) as T;
}

async function publishRemoteHostedVersion(args: {
  remote: RemotePublishConfig;
  manifest: SkillManifest;
  tarball: Buffer;
  hash: string;
  sizeBytes: number;
}): Promise<RemotePublishResult> {
  const { remote, manifest, tarball, hash, sizeBytes } = args;
  const upload = await requestJson<{
    skillId: string;
    skillFullName?: string;
    uploadUrl: string;
  }>(`${remote.apiUrl}/api/cli/hosted/upload`, remote.authToken, {
    name: manifest.name,
    slug: manifest.slug,
    description: manifest.description,
    visibility: 'public',
    version: manifest.version,
  });

  const uploadResponse = await fetch(upload.uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-tar',
    },
    body: tarball,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Artifact upload failed with status ${uploadResponse.status}`);
  }

  const payload = (await uploadResponse.json()) as { storageId?: string };
  if (!payload.storageId) {
    throw new Error('Artifact upload did not return a storageId');
  }

  const publishResult = await requestJson<{
    skillId: string;
    versionId: string;
    defaultSet: boolean;
    defaultSetMessage?: string;
  }>(`${remote.apiUrl}/api/cli/hosted/publish`, remote.authToken, {
    skillId: upload.skillId,
    version: manifest.version,
    changelog: remote.changelog,
    storageKey: payload.storageId,
    contentHash: hash,
    sizeBytes,
    manifest: JSON.stringify(manifest),
    setDefault: remote.setDefault,
  });

  return {
    skillId: publishResult.skillId,
    skillFullName: upload.skillFullName,
    versionId: publishResult.versionId,
    storageId: payload.storageId,
    defaultSet: publishResult.defaultSet,
    defaultSetMessage: publishResult.defaultSetMessage,
  };
}

export async function publishSkill(options: PublishOptions = {}): Promise<void> {
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

    const artifactsDir = path.join(baseDir, REGISTRY_DIR, ARTIFACTS_DIR);
    fs.mkdirSync(artifactsDir, { recursive: true });

    const artifactFilename = `${manifest.slug}-${manifest.version}.tar`;
    const artifactAbsPath = path.join(artifactsDir, artifactFilename);
    fs.writeFileSync(artifactAbsPath, tarball);

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
      changelog: options.changelog,
      hash,
      sizeBytes,
      artifactPath: path.join(ARTIFACTS_DIR, artifactFilename),
      publishedAt: new Date().toISOString(),
    };

    record.versions.push(publishedVersion);
    record.versions.sort((a, b) => compareSemver(a.version, b.version));

    writeRegistry(registryPath, registry);

    console.log(chalk.green('\n✓ Skill packaged successfully'));
    console.log(chalk.gray(`  Artifact: ${artifactAbsPath}`));
    console.log(chalk.gray(`  Size: ${sizeBytes.toLocaleString()} bytes`));
    console.log(chalk.gray(`  SHA256: ${hash}`));

    const remoteConfig = resolveRemotePublishConfig(options);
    if (remoteConfig) {
      spinner.start('Publishing version to LMSkills...');
      const remoteResult = await publishRemoteHostedVersion({
        remote: remoteConfig,
        manifest,
        tarball,
        hash,
        sizeBytes,
      });
      spinner.succeed('Remote publish completed');

      console.log(chalk.green('\n✓ Version published to repository'));
      if (remoteResult.skillFullName) {
        console.log(chalk.gray(`  Repository: ${remoteResult.skillFullName}`));
      }
      console.log(chalk.gray(`  Version: ${manifest.version}`));
      if (remoteConfig.setDefault) {
        if (remoteResult.defaultSet) {
          console.log(chalk.gray('  Default: updated'));
        } else if (remoteResult.defaultSetMessage) {
          console.log(chalk.yellow(`  Default: not updated (${remoteResult.defaultSetMessage})`));
        }
      }
    }
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
