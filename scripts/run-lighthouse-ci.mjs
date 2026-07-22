import { spawn } from 'node:child_process';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createRequire } from 'node:module';

import { chromium } from '@playwright/test';

const require = createRequire(import.meta.url);
const lhciPath = require.resolve('@lhci/cli/src/cli.js');

const contentTypes = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
};
const compressibleExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.svg',
  '.txt',
  '.xml',
]);

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
}

async function startStaticServer(rootDirectory) {
  const root = resolve(rootDirectory);
  const server = createHttpServer((request, response) => {
    void (async () => {
      try {
        const pathname = decodeURIComponent(
          new URL(request.url ?? '/', 'http://127.0.0.1').pathname,
        );
        let relativePath = pathname.replace(/^\/+/, '');
        if (!relativePath || pathname.endsWith('/')) {
          relativePath = join(relativePath, 'index.html');
        } else if (!extname(relativePath)) {
          relativePath = join(relativePath, 'index.html');
        }

        const filePath = resolve(root, relativePath);
        if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
          response.writeHead(403).end('Forbidden');
          return;
        }

        const body = await readFile(filePath);
        const extension = extname(filePath).toLowerCase();
        const useGzip =
          compressibleExtensions.has(extension) &&
          /(?:^|,)\s*gzip\s*(?:,|$)/i.test(
            request.headers['accept-encoding'] ?? '',
          );
        const responseBody = useGzip ? gzipSync(body) : body;
        const headers = {
          'Cache-Control': 'no-store',
          'Content-Type': contentTypes[extension] ?? 'application/octet-stream',
          Vary: 'Accept-Encoding',
        };
        if (useGzip) headers['Content-Encoding'] = 'gzip';
        response.writeHead(200, headers);
        response.end(responseBody);
      } catch (error) {
        const status = error && error.code === 'ENOENT' ? 404 : 500;
        response.writeHead(status, {
          'Content-Type': 'text/plain; charset=utf-8',
        });
        response.end(status === 404 ? 'Not found' : 'Internal server error');
      }
    })();
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not determine the Lighthouse static server port.');
  }

  return { baseUrl: `http://127.0.0.1:${address.port}`, server };
}

async function waitForChrome(port, child, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Chromium exited before opening debugging port ${port}.`);
    }

    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return;
    } catch {
      // Chromium is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Chromium did not open debugging port ${port} in time.`);
}

async function stopProcessTree(child) {
  if (!child || child.exitCode !== null || !child.pid) return;

  if (process.platform === 'win32') {
    const taskkill = spawn(
      'taskkill',
      ['/pid', String(child.pid), '/T', '/F'],
      { stdio: 'ignore', windowsHide: true },
    );
    await waitForExit(taskkill).catch(() => undefined);
    return;
  }

  child.kill('SIGTERM');
  await Promise.race([
    waitForExit(child),
    new Promise((resolve) => setTimeout(resolve, 2_000)),
  ]);
  if (child.exitCode === null) child.kill('SIGKILL');
}

const port = await getAvailablePort();
const profileDirectory = await mkdtemp(join(tmpdir(), 'portfolio-lhci-'));
const executablePath = chromium.executablePath();
let chrome;
let staticServer;

try {
  const staticSession = await startStaticServer(join(process.cwd(), 'dist'));
  staticServer = staticSession.server;
  chrome = spawn(
    executablePath,
    [
      '--headless=new',
      '--disable-background-networking',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--no-default-browser-check',
      '--no-first-run',
      '--remote-debugging-address=127.0.0.1',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profileDirectory}`,
      'about:blank',
    ],
    { stdio: 'ignore', windowsHide: true },
  );

  await waitForChrome(port, chrome);

  const lhci = spawn(process.execPath, [lhciPath, 'autorun'], {
    env: {
      ...process.env,
      LIGHTHOUSE_BASE_URL: staticSession.baseUrl,
      LIGHTHOUSE_CHROME_PATH: executablePath,
      LIGHTHOUSE_CHROME_PORT: String(port),
    },
    stdio: 'inherit',
    windowsHide: true,
  });
  const result = await waitForExit(lhci);

  if (result.signal) {
    throw new Error(`Lighthouse CI stopped with signal ${result.signal}.`);
  }
  process.exitCode = result.code ?? 1;
} finally {
  await stopProcessTree(chrome);
  if (staticServer) {
    staticServer.closeAllConnections?.();
    await new Promise((resolve) => staticServer.close(resolve));
  }
  await rm(profileDirectory, {
    force: true,
    maxRetries: 20,
    recursive: true,
    retryDelay: 250,
  }).catch((error) => {
    console.warn(
      `Could not remove Lighthouse Chrome profile: ${error.message}`,
    );
  });
}
