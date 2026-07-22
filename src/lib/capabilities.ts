import type { Locale } from './locale';

export const CAPABILITY_DOMAIN_IDS = [
  'frontend',
  'backend',
  'data',
  'immersive',
  'delivery',
] as const;

export type CapabilityDomainId = (typeof CAPABILITY_DOMAIN_IDS)[number];

export interface CapabilityRelation {
  domainId: CapabilityDomainId;
  technologyId: string;
  projectSlug: string;
}

export interface CapabilitySourceProject {
  slug: string;
  capabilities: readonly string[];
  technologies: readonly string[];
}

export type CapabilitySourceEntry =
  CapabilitySourceProject | { data: CapabilitySourceProject };

export interface CapabilityProjectReference {
  slug: string;
  title: Record<Locale, string>;
  href: Record<Locale, string>;
}

export interface CapabilityTechnologyGroup {
  technologyId: string;
  projectSlugs: string[];
}

export interface CapabilityDomainGroup {
  domainId: CapabilityDomainId;
  technologies: CapabilityTechnologyGroup[];
}

const capabilityDomains: Readonly<Record<string, CapabilityDomainId>> = {
  'accessible-interaction': 'frontend',
  'frontend-systems': 'frontend',
  'mobile-development': 'frontend',
  'web-applications': 'frontend',
  'backend-architecture': 'backend',
  'business-systems': 'backend',
  'data-integration': 'data',
  'data-modeling': 'data',
  'data-persistence': 'data',
  'relational-databases': 'data',
  'immersive-web': 'immersive',
  'content-architecture': 'delivery',
  'delivery-tooling': 'delivery',
  localization: 'delivery',
};

const technologyDomains: Readonly<
  Record<string, readonly CapabilityDomainId[]>
> = {
  astro: ['frontend', 'delivery'],
  'c-sharp': ['backend'],
  dotnet: ['backend'],
  javascript: ['frontend', 'data'],
  lit: ['frontend'],
  'mobile-application': ['frontend'],
  mysql: ['data'],
  react: ['frontend'],
  sql: ['data'],
  'three-js': ['immersive'],
  typescript: ['frontend', 'delivery'],
  vite: ['delivery'],
  'web-components': ['frontend'],
};

const technologyLabels: Readonly<Record<string, string>> = {
  astro: 'Astro',
  'c-sharp': 'C#',
  dotnet: '.NET',
  javascript: 'JavaScript',
  lit: 'Lit',
  mysql: 'MySQL',
  react: 'React',
  sql: 'SQL',
  'three-js': 'Three.js',
  typescript: 'TypeScript',
  vite: 'Vite',
  'web-components': 'Web Components',
};

const domainOrder = new Map(
  CAPABILITY_DOMAIN_IDS.map((domainId, index) => [domainId, index]),
);

function sourceData(entry: CapabilitySourceEntry): CapabilitySourceProject {
  return 'data' in entry ? entry.data : entry;
}

function compareStrings(left: string, right: string): number {
  return left === right ? 0 : left < right ? -1 : 1;
}

function compareRelations(
  left: CapabilityRelation,
  right: CapabilityRelation,
): number {
  return (
    (domainOrder.get(left.domainId) ?? Number.MAX_SAFE_INTEGER) -
      (domainOrder.get(right.domainId) ?? Number.MAX_SAFE_INTEGER) ||
    compareStrings(left.technologyId, right.technologyId) ||
    compareStrings(left.projectSlug, right.projectSlug)
  );
}

function domainForCapability(capabilityId: string): CapabilityDomainId {
  const domainId = capabilityDomains[capabilityId];

  if (!domainId) {
    throw new TypeError(
      `Capability "${capabilityId}" is not assigned to a capability domain.`,
    );
  }

  return domainId;
}

function domainsForTechnology(
  technologyId: string,
): readonly CapabilityDomainId[] {
  const domainIds = technologyDomains[technologyId];

  if (!domainIds) {
    throw new TypeError(
      `Technology "${technologyId}" is not assigned to a capability domain.`,
    );
  }

  return domainIds;
}

export function capabilityRelationKey(relation: CapabilityRelation): string {
  return `${relation.domainId}::${relation.technologyId}::${relation.projectSlug}`;
}

export function normalizeCapabilityProjection(
  relations: readonly CapabilityRelation[],
): CapabilityRelation[] {
  const uniqueRelations = new Map<string, CapabilityRelation>();

  for (const relation of relations) {
    uniqueRelations.set(capabilityRelationKey(relation), { ...relation });
  }

  return [...uniqueRelations.values()].sort(compareRelations);
}

export function assertCapabilityProjectReferences(
  projection: readonly CapabilityRelation[],
  projectSlugs: Iterable<string>,
): void {
  const availableProjectSlugs = new Set(projectSlugs);
  const missingProjectSlugs = new Set<string>();

  for (const relation of projection) {
    if (!availableProjectSlugs.has(relation.projectSlug)) {
      missingProjectSlugs.add(relation.projectSlug);
    }
  }

  if (missingProjectSlugs.size > 0) {
    throw new TypeError(
      `Capability projection references missing project: ${[
        ...missingProjectSlugs,
      ].join(', ')}.`,
    );
  }
}

export function buildCapabilityProjection(
  projects: readonly CapabilitySourceEntry[],
): CapabilityRelation[] {
  const relations: CapabilityRelation[] = [];

  for (const entry of projects) {
    const project = sourceData(entry);
    const projectDomains = new Set(
      project.capabilities.map(domainForCapability),
    );

    for (const technologyId of project.technologies) {
      const allowedDomains = domainsForTechnology(technologyId);

      for (const domainId of projectDomains) {
        if (!allowedDomains.includes(domainId)) continue;

        relations.push({
          domainId,
          technologyId,
          projectSlug: project.slug,
        });
      }
    }
  }

  return normalizeCapabilityProjection(relations);
}

export function groupCapabilityProjection(
  projection: readonly CapabilityRelation[],
): CapabilityDomainGroup[] {
  const normalized = normalizeCapabilityProjection(projection);

  return CAPABILITY_DOMAIN_IDS.map((domainId) => {
    const technologyProjects = new Map<string, string[]>();

    for (const relation of normalized) {
      if (relation.domainId !== domainId) continue;

      const projectSlugs = technologyProjects.get(relation.technologyId) ?? [];
      projectSlugs.push(relation.projectSlug);
      technologyProjects.set(relation.technologyId, projectSlugs);
    }

    return {
      domainId,
      technologies: [...technologyProjects].map(
        ([technologyId, projectSlugs]) => ({
          technologyId,
          projectSlugs,
        }),
      ),
    };
  });
}

export function formatTechnologyLabel(technologyId: string): string {
  return (
    technologyLabels[technologyId] ??
    technologyId
      .split('-')
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(' ')
  );
}
