import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, resolve, sep } from 'node:path';

import fg from 'fast-glob';

import { auditBuildDocuments, type BuildDocument } from './lib/build-audit';

function routePathFromHtml(distDirectory: string, filePath: string): string {
  const local = relative(distDirectory, filePath).split(sep).join('/');
  if (local === 'index.html') {
    return '/';
  }
  if (local.endsWith('/index.html')) {
    return `/${local.slice(0, -'index.html'.length)}`;
  }
  return `/${local.replace(/\.html$/, '/')}`;
}

export function validateBuildDirectory(distDirectory = resolve('dist')) {
  const files = fg.sync('**/*.html', { cwd: distDirectory, absolute: true });
  const documents: BuildDocument[] = files.map((filePath) => ({
    filePath,
    routePath: routePathFromHtml(distDirectory, filePath),
    html: readFileSync(filePath, 'utf8'),
  }));

  return auditBuildDocuments(documents, {
    getAsset(path) {
      const filePath = join(distDirectory, path.replace(/^\/+/, ''));
      return {
        exists: existsSync(filePath),
        size: existsSync(filePath) ? statSync(filePath).size : 0,
      };
    },
  });
}

export function main() {
  const issues = validateBuildDirectory();
  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`[${issue.code}] ${issue.filePath}: ${issue.message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('Build audit passed.');
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : '';
if (currentFile === invokedFile) {
  main();
}
