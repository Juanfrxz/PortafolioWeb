import { z } from 'zod';

import {
  experienceSchema,
  projectSchema,
  type Experience,
  type Project,
} from '../content/schema';

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
