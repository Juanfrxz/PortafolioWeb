import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { load } from 'cheerio';
import fg from 'fast-glob';

const TIMEOUT_MS = 10_000;
const RETRIES = 2;

function acceptedStatus(status: number): boolean {
  return (
    (status >= 200 && status < 400) || [401, 403, 405, 429].includes(status)
  );
}

async function request(url: string, method: 'HEAD' | 'GET'): Promise<Response> {
  return fetch(url, {
    method,
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    ...(method === 'GET' ? { headers: { Range: 'bytes=0-0' } } : {}),
  });
}

export async function checkExternalLink(
  url: string,
): Promise<string | undefined> {
  let lastFailure = 'unknown failure';

  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    try {
      const head = await request(url, 'HEAD');
      if (acceptedStatus(head.status)) {
        return undefined;
      }

      const get = await request(url, 'GET');
      if (acceptedStatus(get.status)) {
        return undefined;
      }
      lastFailure = `HTTP ${get.status}`;
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error);
    }
  }

  return `${url}: ${lastFailure}`;
}

export function collectExternalLinks(
  distDirectory = resolve('dist'),
): string[] {
  const links = new Set<string>();
  const htmlFiles = fg.sync('**/*.html', {
    cwd: distDirectory,
    absolute: true,
  });

  for (const filePath of htmlFiles) {
    const $ = load(readFileSync(filePath, 'utf8'));
    $('a[href]').each((_index, element) => {
      const href = $(element).attr('href');
      if (href && /^https?:\/\//i.test(href)) {
        links.add(href);
      }
    });
  }
  return [...links].sort();
}

export async function main() {
  const links = collectExternalLinks();
  const failures = (await Promise.all(links.map(checkExternalLink))).filter(
    (failure): failure is string => Boolean(failure),
  );

  if (failures.length > 0) {
    failures.forEach((failure) => console.error(failure));
    process.exitCode = 1;
    return;
  }
  console.log(`External link audit passed (${links.length} unique URLs).`);
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : '';
if (currentFile === invokedFile) {
  await main();
}
