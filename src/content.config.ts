import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import { experienceSchema, projectSchema } from './content/schema';

const projects = defineCollection({
  loader: glob({
    pattern: '**/*.json',
    base: './src/content/projects',
  }),
  schema: projectSchema,
});

const experience = defineCollection({
  loader: glob({
    pattern: '**/*.json',
    base: './src/content/experience',
  }),
  schema: experienceSchema,
});

export const collections = { projects, experience };
