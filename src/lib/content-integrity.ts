import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

import {
  experienceSchema,
  projectSchema,
  type Experience,
  type Project,
} from '../content/schema';

function compareNames(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

function collectJsonFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => compareNames(left.name, right.name))
    .flatMap((entry) => {
      const entryPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectJsonFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith('.json') ? [entryPath] : [];
    });
}

function directoryPath(root: string | URL): string {
  return root instanceof URL ? fileURLToPath(root) : resolve(root);
}

export function loadJsonDirectory(root: string | URL): unknown[] {
  return collectJsonFiles(directoryPath(root)).map((filePath) => {
    try {
      return JSON.parse(readFileSync(filePath, 'utf8'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      throw new Error(`Failed to parse JSON file "${filePath}": ${message}`, {
        cause: error,
      });
    }
  });
}

function assertUniqueValue(
  values: readonly (string | number)[],
  label: string,
): void {
  const seen = new Set<string | number>();

  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`Duplicate ${label}: ${value}`);
    }

    seen.add(value);
  }
}

export function assertProjectIntegrity(input: unknown): Project[] {
  const projects = z.array(projectSchema).parse(input);

  assertUniqueValue(
    projects.map(({ slug }) => slug),
    'project slug',
  );
  assertUniqueValue(
    projects.flatMap(({ featuredOrder }) =>
      featuredOrder === null ? [] : [featuredOrder],
    ),
    'featured order',
  );
  assertUniqueValue(
    projects.flatMap(({ archiveOrder }) =>
      archiveOrder === null ? [] : [archiveOrder],
    ),
    'archive order',
  );

  return projects;
}

export function assertExperienceIntegrity(input: unknown): Experience[] {
  const experience = z.array(experienceSchema).parse(input);

  assertUniqueValue(
    experience.map(({ id }) => id),
    'experience id',
  );
  assertUniqueValue(
    experience.map(({ order }) => order),
    'experience order',
  );

  if (experience.filter(({ status }) => status === 'current').length > 1) {
    throw new Error('Only one current experience record is allowed.');
  }

  return experience;
}

export function assertContentDirectories(roots: {
  projects: string | URL;
  experience: string | URL;
}): void {
  assertProjectIntegrity(loadJsonDirectory(roots.projects));
  assertExperienceIntegrity(loadJsonDirectory(roots.experience));
}
