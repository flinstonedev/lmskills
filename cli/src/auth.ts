import * as fs from 'fs';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';
import { spawn } from 'child_process';
import chalk from 'chalk';
import fetch from 'node-fetch';

const DEFAULT_API_URL = 'https://www.lmskills.ai';
const LOCAL_API_URLS = ['http://127.0.0.1:3000', 'http://localhost:3000'];
const CLI_CONFIG_DIR = '.lmskills';
const CLI_CONFIG_FILE = 'config.json';
const LOGIN_TIMEOUT_MS = 120000;

interface CliAuthConfig {
  apiUrl?: string;
  authToken?: string;
  updatedAt?: string;
}

export function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function getCliConfigPath(): string {
  return path.join(os.homedir(), CLI_CONFIG_DIR, CLI_CONFIG_FILE);
}

export function getDefaultApiUrl(): string {
  return normalizeBaseUrl(DEFAULT_API_URL);
}

export function readCliConfig(): CliAuthConfig {
  const configPath = getCliConfigPath();
  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as CliAuthConfig;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeCliConfig(config: CliAuthConfig): void {
  const configPath = getCliConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
}

async function openBrowser(url: string): Promise<boolean> {
  const platform = process.platform;
  const command =
    platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const args =
    platform === 'darwin'
      ? [url]
      : platform === 'win32'
        ? ['/c', 'start', '', url]
        : [url];

  return await new Promise<boolean>((resolve) => {
    const child = spawn(command, args, {
      stdio: 'ignore',
      detached: true,
    });

    child.once('error', () => resolve(false));
    child.once('spawn', () => {
      child.unref();
      resolve(true);
    });
  });
}

async function waitForLoginCallback(
  apiUrl: string,
  expectedState: string
): Promise<string> {
  const server = http.createServer();

  return await new Promise<string>((resolve, reject) => {
    let timeout: NodeJS.Timeout | undefined;

    const cleanup = () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      server.close();
    };

    server.on('request', (req, res) => {
      const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');

      if (requestUrl.pathname !== '/callback') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }

      const state = requestUrl.searchParams.get('state') ?? '';
      const token = requestUrl.searchParams.get('token') ?? '';
      const error = requestUrl.searchParams.get('error') ?? '';

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>Login failed</h1><p>You can close this window.</p>');
        cleanup();
        reject(new Error(error));
        return;
      }

      if (!token || state !== expectedState) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>Invalid login callback</h1><p>You can close this window.</p>');
        cleanup();
        reject(new Error('Invalid login callback state'));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>Login successful</h1><p>You can close this window and return to the terminal.</p>');
      cleanup();
      resolve(token);
    });

    server.on('error', (error) => {
      cleanup();
      reject(error);
    });

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        cleanup();
        reject(new Error('Unable to start local login callback server'));
        return;
      }

      const callbackUrl = `http://127.0.0.1:${address.port}/callback`;
      const loginUrl = `${apiUrl}/api/cli/auth/start?redirect_uri=${encodeURIComponent(
        callbackUrl
      )}&state=${encodeURIComponent(expectedState)}`;

      void openBrowser(loginUrl).then((opened) => {
        if (!opened) {
          console.log(chalk.yellow('\nUnable to open browser automatically.'));
          console.log(chalk.yellow('Open this URL manually to continue login:'));
          console.log(chalk.cyan(loginUrl));
        }
      });

      timeout = setTimeout(() => {
        cleanup();
        reject(
          new Error(
            'Login timed out. Please run "lmskills login" again and complete browser authentication.'
          )
        );
      }, LOGIN_TIMEOUT_MS);
    });
  });
}

async function canReachAuthStart(baseUrl: string): Promise<boolean> {
  const probeUrl = `${normalizeBaseUrl(
    baseUrl
  )}/api/cli/auth/start?redirect_uri=${encodeURIComponent(
    'http://127.0.0.1:1/callback'
  )}&state=probe`;

  try {
    const response = await fetch(probeUrl, {
      method: 'GET',
      redirect: 'manual',
      timeout: 1000,
    });

    return response.status !== 404;
  } catch {
    return false;
  }
}

async function resolveApiUrlForLogin(
): Promise<string> {
  const checks = await Promise.all(
    LOCAL_API_URLS.map(async (candidate) => ({
      candidate,
      reachable: await canReachAuthStart(candidate),
    }))
  );
  const local = checks.find((entry) => entry.reachable);
  if (local) {
    return normalizeBaseUrl(local.candidate);
  }

  return DEFAULT_API_URL;
}

export async function login(): Promise<void> {
  const existing = readCliConfig();
  const apiUrl = await resolveApiUrlForLogin();

  const state = crypto.randomBytes(16).toString('hex');

  console.log(chalk.gray(`Using LMSkills API: ${apiUrl}`));
  console.log(chalk.gray('Opening browser for authentication...'));

  const token = await waitForLoginCallback(apiUrl, state);

  writeCliConfig({
    ...existing,
    apiUrl,
    authToken: token,
    updatedAt: new Date().toISOString(),
  });

  console.log(chalk.green('\n✓ Login successful'));
  console.log(chalk.gray(`  Saved credentials: ${getCliConfigPath()}`));
}
