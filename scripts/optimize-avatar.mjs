import { createHash, randomUUID } from 'node:crypto';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

import {
  assertSourceBaseline,
  assertTierReport,
  readModelReport,
} from './check-model-budgets.mjs';

const sourcePath = resolve('assets/models/avatar_programador.glb');
const outputDirectory = resolve('public/models');
const cliEntry = resolve('node_modules/@gltf-transform/cli/bin/cli.js');

const tiers = [
  {
    name: 'full',
    ratio: 0.38,
    error: 0.001,
    textureSize: 1024,
    output: join(outputDirectory, 'avatar-full.glb'),
  },
  {
    name: 'light',
    ratio: 0.11,
    error: 0.0021,
    textureSize: 512,
    output: join(outputDirectory, 'avatar-light.glb'),
  },
];

function runCli(args) {
  const result = spawnSync(process.execPath, [cliEntry, ...args], {
    cwd: resolve('.'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `glTF Transform failed: gltf-transform ${args.join(' ')}`,
        result.stdout,
        result.stderr,
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  if (output) process.stdout.write(`${output}\n`);
}

async function optimizeTier(tier, temporaryRoot, inputPath) {
  const tierDirectory = join(temporaryRoot, tier.name);
  await mkdir(tierDirectory, { recursive: true });

  const steps = Array.from({ length: 7 }, (_, index) =>
    join(tierDirectory, `${String(index + 1).padStart(2, '0')}.glb`),
  );

  runCli(['weld', inputPath, steps[0]]);
  runCli([
    'simplify',
    steps[0],
    steps[1],
    '--ratio',
    String(tier.ratio),
    '--error',
    String(tier.error),
  ]);
  runCli(['prune', steps[1], steps[2]]);
  runCli(['dedup', steps[2], steps[3]]);
  runCli([
    'resize',
    steps[3],
    steps[4],
    '--width',
    String(tier.textureSize),
    '--height',
    String(tier.textureSize),
  ]);
  runCli(['webp', steps[4], steps[5], '--quality', '82', '--effort', '80']);
  runCli(['meshopt', steps[5], steps[6], '--level', 'high']);

  const report = await readModelReport(steps[6]);
  assertTierReport(report, tier.name);

  return {
    report: { ...report, path: tier.output },
    geometryPath: steps[3],
    outputPath: steps[6],
  };
}

export async function publishTierOutputs(outputs) {
  const token = `${process.pid}-${randomUUID()}`;
  const entries = outputs.map(({ source, destination }) => ({
    source,
    destination,
    staging: `${destination}.next-${token}`,
    backup: `${destination}.previous-${token}`,
    hadOriginal: false,
    published: false,
  }));
  let committed = false;

  try {
    for (const entry of entries) {
      await copyFile(entry.source, entry.staging);
    }

    for (const entry of entries) {
      try {
        await rename(entry.destination, entry.backup);
        entry.hadOriginal = true;
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !('code' in error) ||
          error.code !== 'ENOENT'
        ) {
          throw error;
        }
      }
    }

    for (const entry of entries) {
      await rename(entry.staging, entry.destination);
      entry.published = true;
    }

    committed = true;
  } catch (publishError) {
    const rollbackErrors = [];

    for (const entry of [...entries].reverse()) {
      try {
        if (entry.published) {
          await rm(entry.destination, { force: true });
        }
        if (entry.hadOriginal) {
          await rename(entry.backup, entry.destination);
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }

    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [publishError, ...rollbackErrors],
        'Avatar publication failed and could not be fully rolled back.',
      );
    }

    throw publishError;
  } finally {
    await Promise.allSettled(
      entries.flatMap((entry) => [
        rm(entry.staging, { force: true }),
        ...(committed ? [rm(entry.backup, { force: true })] : []),
      ]),
    );
  }
}

async function main() {
  const sourceBytes = await readFile(sourcePath);
  const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex');
  const sourceReport = await readModelReport(sourcePath);
  assertSourceBaseline(sourceReport);

  await mkdir(outputDirectory, { recursive: true });
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'kinetic-avatar-'));

  try {
    const fullTier = tiers.find((tier) => tier.name === 'full');
    const lightTier = tiers.find((tier) => tier.name === 'light');

    if (!fullTier || !lightTier) {
      throw new Error('Both avatar quality tiers must be configured.');
    }

    const full = await optimizeTier(fullTier, temporaryRoot, sourcePath);
    const light = await optimizeTier(lightTier, temporaryRoot, sourcePath);

    await publishTierOutputs([
      { source: full.outputPath, destination: fullTier.output },
      { source: light.outputPath, destination: lightTier.output },
    ]);

    process.stdout.write(
      `${JSON.stringify(
        {
          sourceSha256,
          source: sourceReport,
          full: full.report,
          light: light.report,
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectExecution) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : error}\n`);
    process.exitCode = 1;
  });
}
