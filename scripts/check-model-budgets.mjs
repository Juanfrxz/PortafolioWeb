import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';

export const SOURCE_BASELINE = Object.freeze({
  scenes: 1,
  meshes: 1,
  materials: 1,
  triangles: 632_738,
});

export const MODEL_BUDGETS = Object.freeze({
  full: Object.freeze({
    bytes: 4 * 1024 * 1024,
    triangles: 250_000,
    maxTextureDimension: 1024,
  }),
  light: Object.freeze({
    bytes: 1.5 * 1024 * 1024,
    triangles: 75_000,
    maxTextureDimension: 512,
  }),
});

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });

function primitiveTriangleCount(primitive) {
  const elementCount =
    primitive.getIndices()?.getCount() ??
    primitive.getAttribute('POSITION')?.getCount() ??
    0;

  switch (primitive.getMode()) {
    case 4:
      return Math.floor(elementCount / 3);
    case 5:
    case 6:
      return Math.max(0, elementCount - 2);
    default:
      return 0;
  }
}

export async function readModelReport(modelPath) {
  await MeshoptDecoder.ready;

  const [file, document] = await Promise.all([
    stat(modelPath),
    io.read(modelPath),
  ]);
  const root = document.getRoot();
  const textures = root.listTextures();

  return {
    path: resolve(modelPath),
    bytes: file.size,
    scenes: root.listScenes().length,
    meshes: root.listMeshes().length,
    materials: root.listMaterials().length,
    textureCount: textures.length,
    textureMimeTypes: textures.map((texture) => texture.getMimeType()).sort(),
    extensionsUsed: root
      .listExtensionsUsed()
      .map((extension) => extension.extensionName)
      .sort(),
    triangles: root
      .listMeshes()
      .flatMap((mesh) => mesh.listPrimitives())
      .reduce(
        (total, primitive) => total + primitiveTriangleCount(primitive),
        0,
      ),
    maxTextureDimension: textures.reduce((largest, texture) => {
      const size = texture.getSize();
      return size ? Math.max(largest, size[0], size[1]) : largest;
    }, 0),
  };
}

function assertExact(report, expected, label) {
  for (const [key, value] of Object.entries(expected)) {
    if (report[key] !== value) {
      throw new Error(
        `${label} expected ${key}=${value}, received ${report[key]}.`,
      );
    }
  }
}

export function assertSourceBaseline(report) {
  assertExact(report, SOURCE_BASELINE, 'Avatar source');
}

export function assertTierReport(report, tier) {
  const budget = MODEL_BUDGETS[tier];

  if (!budget) {
    throw new TypeError(`Unknown avatar tier: ${tier}`);
  }

  assertExact(
    report,
    { scenes: 1, meshes: 1, materials: 1, textureCount: 1 },
    `Avatar ${tier}`,
  );

  if (
    report.textureMimeTypes.length !== 1 ||
    report.textureMimeTypes[0] !== 'image/webp'
  ) {
    throw new Error(
      `Avatar ${tier} expected one WebP texture, received ${report.textureMimeTypes.join(', ') || 'none'}.`,
    );
  }

  for (const extension of ['EXT_meshopt_compression', 'EXT_texture_webp']) {
    if (!report.extensionsUsed.includes(extension)) {
      throw new Error(`Avatar ${tier} is missing ${extension}.`);
    }
  }

  for (const [key, limit] of Object.entries(budget)) {
    if (report[key] > limit) {
      throw new Error(
        `Avatar ${tier} exceeds ${key} budget: ${report[key]} > ${limit}.`,
      );
    }
  }
}

async function main() {
  const source = await readModelReport(
    resolve('assets/models/avatar_programador.glb'),
  );
  const full = await readModelReport(resolve('public/models/avatar-full.glb'));
  const light = await readModelReport(
    resolve('public/models/avatar-light.glb'),
  );

  assertSourceBaseline(source);
  assertTierReport(full, 'full');
  assertTierReport(light, 'light');

  process.stdout.write(`${JSON.stringify({ source, full, light }, null, 2)}\n`);
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectExecution) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  });
}
