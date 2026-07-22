import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import { experienceSchema, projectSchema } from './content/schema';
import { assertContentDirectories } from './lib/content-integrity';

const projectsBase = new URL('./content/projects/', import.meta.url);
const experienceBase = new URL('./content/experience/', import.meta.url);

assertContentDirectories({
  projects: projectsBase,
  experience: experienceBase,
});

const projects = defineCollection({
  loader: glob({
    pattern: '**/*.json',
    base: projectsBase,
  }),
  schema: projectSchema,
});

const experience = defineCollection({
  loader: glob({
    pattern: '**/*.json',
    base: experienceBase,
  }),
  schema: experienceSchema,
});

export const collections = { projects, experience };
