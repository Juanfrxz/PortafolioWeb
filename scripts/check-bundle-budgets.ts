import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { load } from 'cheerio';

export const INITIAL_NON_3D_BUDGET_BYTES = 90 * 1024;
export const DEFERRED_HERO_BUDGET_BYTES = 350 * 1024;

export interface BundleBudgetMeasurements {
  initialNon3dGzipBytes: number;
  deferredHeroGzipBytes: number;
}

export interface BundleBudgetIssue {
  code: 'initial-non-3d' | 'deferred-hero';
  actualBytes: number;
  budgetBytes: number;
}

export interface BundleBudgetReport extends BundleBudgetMeasurements {
  initialFiles: string[];
  deferredHeroFiles: string[];
  issues: BundleBudgetIssue[];
}

export function evaluateBundleBudgets({
  initialNon3dGzipBytes,
  deferredHeroGzipBytes,
}: BundleBudgetMeasurements): BundleBudgetIssue[] {
  const issues: BundleBudgetIssue[] = [];
  if (initialNon3dGzipBytes > INITIAL_NON_3D_BUDGET_BYTES) {
    issues.push({
      code: 'initial-non-3d',
      actualBytes: initialNon3dGzipBytes,
      budgetBytes: INITIAL_NON_3D_BUDGET_BYTES,
    });
  }
  if (deferredHeroGzipBytes > DEFERRED_HERO_BUDGET_BYTES) {
    issues.push({
      code: 'deferred-hero',
      actualBytes: deferredHeroGzipBytes,
      budgetBytes: DEFERRED_HERO_BUDGET_BYTES,
    });
  }
  return issues;
}

export function extractStaticModuleSpecifiers(source: string): string[] {
  const specifiers = new Set<string>();
  const patterns = [
    /\bimport(?!\s*\()\s*(?:(?:[^'";]*?\bfrom\s*)?['"]([^'"]+)['"])/g,
    /\bexport\s+[^'";]+?\bfrom\s*['"]([^'"]+)['"]/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1]) {
        specifiers.add(match[1]);
      }
    }
  }
  return [...specifiers];
}

export function extractDynamicModuleSpecifiers(source: string): string[] {
  const specifiers = new Set<string>();
  const pattern = /\bimport\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g;

  for (const match of source.matchAll(pattern)) {
    if (match[2]) specifiers.add(match[2]);
  }

  return [...specifiers];
}

function assetFile(distDirectory: string, assetUrl: string): string {
  return join(distDirectory, assetUrl.replace(/^\/+/, ''));
}

function moduleGraph(
  roots: readonly string[],
  includeDynamicImports = false,
): Set<string> {
  const graph = new Set<string>();
  const pending = [...roots];

  while (pending.length > 0) {
    const filePath = pending.pop();
    if (!filePath || graph.has(filePath)) {
      continue;
    }
    graph.add(filePath);
    const source = readFileSync(filePath, 'utf8');
    const specifiers = extractStaticModuleSpecifiers(source);
    if (includeDynamicImports) {
      specifiers.push(...extractDynamicModuleSpecifiers(source));
    }
    for (const specifier of specifiers) {
      if (specifier.startsWith('.')) {
        pending.push(resolve(dirname(filePath), specifier));
      }
    }
  }
  return graph;
}

function gzipTotal(files: Iterable<string>): number {
  let total = 0;
  for (const filePath of files) {
    total += gzipSync(readFileSync(filePath)).byteLength;
  }
  return total;
}

export function analyzeBundleBudgets(
  distDirectory = resolve('dist'),
): BundleBudgetReport {
  const html = readFileSync(join(distDirectory, 'index.html'), 'utf8');
  const $ = load(html);
  const initialRootUrls = new Set<string>();
  const heroRootUrls = new Set<string>();

  $('script[src]').each((_index, element) => {
    const src = $(element).attr('src');
    if (src?.endsWith('.js')) {
      initialRootUrls.add(src);
    }
  });

  $('astro-island').each((_index, element) => {
    const client = $(element).attr('client');
    const component = $(element).attr('component-url');
    const renderer = $(element).attr('renderer-url');
    if (client === 'load') {
      if (component) initialRootUrls.add(component);
      if (renderer) initialRootUrls.add(renderer);
    }
    if (component?.includes('HeroExperience')) {
      heroRootUrls.add(component);
      if (renderer) heroRootUrls.add(renderer);
    }
  });

  const initialGraph = moduleGraph(
    [...initialRootUrls].map((url) => assetFile(distDirectory, url)),
  );
  const heroGraph = moduleGraph(
    [...heroRootUrls].map((url) => assetFile(distDirectory, url)),
    true,
  );
  const deferredHeroGraph = new Set(
    [...heroGraph].filter((filePath) => !initialGraph.has(filePath)),
  );
  const measurements = {
    initialNon3dGzipBytes: gzipTotal(initialGraph),
    deferredHeroGzipBytes: gzipTotal(deferredHeroGraph),
  };

  return {
    ...measurements,
    initialFiles: [...initialGraph].sort(),
    deferredHeroFiles: [...deferredHeroGraph].sort(),
    issues: evaluateBundleBudgets(measurements),
  };
}

function kibibytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

export function main() {
  const report = analyzeBundleBudgets();
  console.log(`Initial non-3D JS: ${kibibytes(report.initialNon3dGzipBytes)}`);
  console.log(`Deferred hero JS: ${kibibytes(report.deferredHeroGzipBytes)}`);
  if (report.issues.length > 0) {
    for (const issue of report.issues) {
      console.error(
        `${issue.code}: ${kibibytes(issue.actualBytes)} exceeds ${kibibytes(issue.budgetBytes)}.`,
      );
    }
    process.exitCode = 1;
  }
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : '';
if (currentFile === invokedFile) {
  main();
}
