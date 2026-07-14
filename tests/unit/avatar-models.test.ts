import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { readModelReport } from '../../scripts/check-model-budgets.mjs';
import { publishTierOutputs } from '../../scripts/optimize-avatar.mjs';

const sourcePath = resolve('assets/models/avatar_programador.glb');
const fullPath = resolve('public/models/avatar-full.glb');
const lightPath = resolve('public/models/avatar-light.glb');

describe('avatar quality tiers', () => {
  it('preserves the verified source baseline', async () => {
    const source = await readModelReport(sourcePath);

    expect(source).toMatchObject({
      scenes: 1,
      meshes: 1,
      materials: 1,
      triangles: 632_738,
    });
  });

  it('keeps the full model within its structural and delivery budgets', async () => {
    const full = await readModelReport(fullPath);

    expect(full.scenes).toBe(1);
    expect(full.meshes).toBe(1);
    expect(full.materials).toBe(1);
    expect(full.bytes).toBeLessThanOrEqual(4 * 1024 * 1024);
    expect(full.triangles).toBeLessThanOrEqual(250_000);
    expect(full.maxTextureDimension).toBeLessThanOrEqual(1024);
    expect(full.textureCount).toBe(1);
    expect(full.textureMimeTypes).toEqual(['image/webp']);
    expect(full.extensionsUsed).toEqual(
      expect.arrayContaining(['EXT_meshopt_compression', 'EXT_texture_webp']),
    );
  });

  it('keeps the light model within its structural and delivery budgets', async () => {
    const light = await readModelReport(lightPath);

    expect(light.scenes).toBe(1);
    expect(light.meshes).toBe(1);
    expect(light.materials).toBe(1);
    expect(light.bytes).toBeLessThanOrEqual(1.5 * 1024 * 1024);
    expect(light.triangles).toBeLessThanOrEqual(75_000);
    expect(light.maxTextureDimension).toBeLessThanOrEqual(512);
    expect(light.textureCount).toBe(1);
    expect(light.textureMimeTypes).toEqual(['image/webp']);
    expect(light.extensionsUsed).toEqual(
      expect.arrayContaining(['EXT_meshopt_compression', 'EXT_texture_webp']),
    );
  });

  it('does not replace either published tier when staging the pair fails', async () => {
    const root = await mkdtemp(join(tmpdir(), 'avatar-publish-test-'));
    const sourceDirectory = join(root, 'source');
    const outputDirectory = join(root, 'output');
    await Promise.all([
      mkdir(sourceDirectory, { recursive: true }),
      mkdir(outputDirectory, { recursive: true }),
    ]);

    const fullSource = join(sourceDirectory, 'avatar-full.glb');
    const missingLightSource = join(sourceDirectory, 'avatar-light.glb');
    const fullDestination = join(outputDirectory, 'avatar-full.glb');
    const lightDestination = join(outputDirectory, 'avatar-light.glb');

    try {
      await Promise.all([
        writeFile(fullSource, 'new-full'),
        writeFile(fullDestination, 'old-full'),
        writeFile(lightDestination, 'old-light'),
      ]);

      await expect(
        publishTierOutputs([
          { source: fullSource, destination: fullDestination },
          { source: missingLightSource, destination: lightDestination },
        ]),
      ).rejects.toThrow();

      await expect(readFile(fullDestination, 'utf8')).resolves.toBe('old-full');
      await expect(readFile(lightDestination, 'utf8')).resolves.toBe(
        'old-light',
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
