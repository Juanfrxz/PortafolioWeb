import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const nonemptyStringSchema = z.string().trim().min(1);

export const slugIdSchema = nonemptyStringSchema.regex(slugPattern);

export const localizedStringSchema = z.strictObject({
  en: nonemptyStringSchema,
  es: nonemptyStringSchema,
});

export const localizedStringArraySchema = z.strictObject({
  en: z.array(nonemptyStringSchema).min(1),
  es: z.array(nonemptyStringSchema).min(1),
});

const availableLinkSchema = z.strictObject({
  state: z.literal('available'),
  url: z
    .url()
    .refine((value) => /^https?:\/\//i.test(value), 'Expected an HTTP(S) URL.'),
});

const unavailableLinkSchema = (
  state: 'unverified' | 'source-only' | 'unavailable',
) =>
  z.strictObject({
    state: z.literal(state),
    url: z.null(),
  });

export const availabilitySchema = z.discriminatedUnion('state', [
  availableLinkSchema,
  unavailableLinkSchema('unverified'),
  unavailableLinkSchema('source-only'),
  unavailableLinkSchema('unavailable'),
]);

function isSafeRootRelativePath(value: string): boolean {
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[?#]/.test(value)
  ) {
    return false;
  }

  try {
    const decodedPath = decodeURIComponent(value);
    const segments = decodedPath.split('/');

    return !segments.some((segment) => segment === '.' || segment === '..');
  } catch {
    return false;
  }
}

const safeRootRelativePathSchema = nonemptyStringSchema.refine(
  isSafeRootRelativePath,
  'Expected a safe root-relative path.',
);

const visualMediaFields = {
  src: safeRootRelativePathSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: localizedStringSchema,
};

export const mediaSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('image'),
    ...visualMediaFields,
  }),
  z.strictObject({
    kind: z.literal('diagram'),
    ...visualMediaFields,
  }),
  z.strictObject({
    kind: z.literal('identity-fallback'),
    src: z.null(),
    width: z.null(),
    height: z.null(),
    alt: localizedStringSchema,
  }),
]);

const architectureNodesSchema = z
  .array(slugIdSchema)
  .min(1)
  .superRefine((nodes, context) => {
    const seen = new Set<string>();

    nodes.forEach((node, index) => {
      if (seen.has(node)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate node id: ${node}`,
          path: [index],
        });
      }

      seen.add(node);
    });
  });

const slugIdArraySchema = z
  .array(slugIdSchema)
  .min(1)
  .superRefine((values, context) => {
    const seen = new Set<string>();

    values.forEach((value, index) => {
      if (seen.has(value)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate relationship id: ${value}`,
          path: [index],
        });
      }

      seen.add(value);
    });
  });

const nullableOrderSchema = z.number().int().positive().nullable();

export const projectSchema = z
  .strictObject({
    slug: slugIdSchema,
    type: z.enum([
      'web-experience',
      'business-system',
      'portfolio-system',
      'data-project',
      'web-application',
      'mobile-application',
    ]),
    status: z.enum(['shipped', 'in-progress', 'archived']),
    visibility: z.enum(['featured', 'archive', 'hidden']),
    featuredOrder: nullableOrderSchema,
    archiveOrder: nullableOrderSchema,
    ownership: z.enum(['individual', 'collaborative']),
    teamAttribution: z.array(nonemptyStringSchema),
    title: localizedStringSchema,
    summary: localizedStringSchema,
    problem: localizedStringSchema,
    contribution: localizedStringSchema,
    decisions: localizedStringArraySchema,
    outcome: localizedStringSchema,
    technologies: slugIdArraySchema,
    capabilities: slugIdArraySchema,
    architectureNodes: architectureNodesSchema,
    architectureEdges: z.array(z.tuple([slugIdSchema, slugIdSchema])),
    repository: availabilitySchema,
    demo: availabilitySchema,
    documentation: availabilitySchema,
    media: z.array(mediaSchema).min(1),
    evidenceNotes: z.array(nonemptyStringSchema).min(1),
  })
  .superRefine((project, context) => {
    const addOrderIssue = (message: string) =>
      context.addIssue({ code: 'custom', message, path: ['visibility'] });

    if (
      project.visibility === 'featured' &&
      (project.featuredOrder === null || project.archiveOrder !== null)
    ) {
      addOrderIssue(
        'Featured projects require a featured order and no archive order.',
      );
    }

    if (
      project.visibility === 'archive' &&
      (project.archiveOrder === null || project.featuredOrder !== null)
    ) {
      addOrderIssue(
        'Archive projects require an archive order and no featured order.',
      );
    }

    if (
      project.visibility === 'hidden' &&
      (project.featuredOrder !== null || project.archiveOrder !== null)
    ) {
      addOrderIssue('Hidden projects cannot declare a launch order.');
    }

    if (
      project.ownership === 'collaborative' &&
      project.teamAttribution.length === 0
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Collaborative projects require meaningful team attribution.',
        path: ['teamAttribution'],
      });
    }

    const nodes = new Set(project.architectureNodes);
    const edges = new Set<string>();

    project.architectureEdges.forEach(([source, target], index) => {
      if (source === target) {
        context.addIssue({
          code: 'custom',
          message: `Self edge is not allowed for node: ${source}`,
          path: ['architectureEdges', index],
        });
      }

      if (!nodes.has(source) || !nodes.has(target)) {
        context.addIssue({
          code: 'custom',
          message: `Orphan architecture edge: ${source} -> ${target}`,
          path: ['architectureEdges', index],
        });
      }

      const edgeKey = `${source}\u0000${target}`;

      if (edges.has(edgeKey)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate edge: ${source} -> ${target}`,
          path: ['architectureEdges', index],
        });
      }

      edges.add(edgeKey);
    });
  });

export const experienceSchema = z.strictObject({
  id: slugIdSchema,
  order: z.number().int().positive(),
  role: localizedStringSchema,
  summary: localizedStringSchema,
  timeframe: localizedStringSchema,
  organization: localizedStringSchema.optional(),
  status: z.enum(['past', 'current']),
  capabilities: slugIdArraySchema,
});

export type Project = z.infer<typeof projectSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Availability = z.infer<typeof availabilitySchema>;
export type ProjectMedia = z.infer<typeof mediaSchema>;
