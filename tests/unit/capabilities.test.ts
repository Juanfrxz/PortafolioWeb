import { describe, expect, it } from 'vitest';

import {
  buildCapabilityProjection,
  capabilityRelationKey,
  groupCapabilityProjection,
} from '../../src/lib/capabilities';

const projects = [
  {
    data: {
      slug: 'system-lab',
      capabilities: [
        'immersive-web',
        'frontend-systems',
        'accessible-interaction',
      ],
      technologies: ['three-js', 'react'],
    },
  },
  {
    data: {
      slug: 'operations-console',
      capabilities: [
        'data-persistence',
        'backend-architecture',
        'business-systems',
      ],
      technologies: ['sql', 'dotnet'],
    },
  },
] as const;

describe('capability projection', () => {
  it('normalizes, de-duplicates, and sorts domain/technology/project relations', () => {
    expect(buildCapabilityProjection(projects)).toEqual([
      {
        domainId: 'frontend',
        technologyId: 'react',
        projectSlug: 'system-lab',
      },
      {
        domainId: 'backend',
        technologyId: 'dotnet',
        projectSlug: 'operations-console',
      },
      {
        domainId: 'data',
        technologyId: 'sql',
        projectSlug: 'operations-console',
      },
      {
        domainId: 'immersive',
        technologyId: 'three-js',
        projectSlug: 'system-lab',
      },
    ]);
  });

  it('emits only technology domains also claimed by the project capabilities', () => {
    expect(
      buildCapabilityProjection([
        {
          slug: 'formula1',
          capabilities: [
            'frontend-systems',
            'data-integration',
            'immersive-web',
          ],
          technologies: ['javascript', 'web-components', 'three-js', 'vite'],
        },
        {
          slug: 'sgci-app',
          capabilities: [
            'backend-architecture',
            'business-systems',
            'data-persistence',
          ],
          technologies: ['c-sharp', 'dotnet', 'sql'],
        },
        {
          slug: 'kinetic-systems-lab',
          capabilities: [
            'content-architecture',
            'localization',
            'accessible-interaction',
            'immersive-web',
          ],
          technologies: ['astro', 'typescript', 'react', 'three-js'],
        },
      ]),
    ).toEqual([
      {
        domainId: 'frontend',
        technologyId: 'astro',
        projectSlug: 'kinetic-systems-lab',
      },
      {
        domainId: 'frontend',
        technologyId: 'javascript',
        projectSlug: 'formula1',
      },
      {
        domainId: 'frontend',
        technologyId: 'react',
        projectSlug: 'kinetic-systems-lab',
      },
      {
        domainId: 'frontend',
        technologyId: 'typescript',
        projectSlug: 'kinetic-systems-lab',
      },
      {
        domainId: 'frontend',
        technologyId: 'web-components',
        projectSlug: 'formula1',
      },
      {
        domainId: 'backend',
        technologyId: 'c-sharp',
        projectSlug: 'sgci-app',
      },
      {
        domainId: 'backend',
        technologyId: 'dotnet',
        projectSlug: 'sgci-app',
      },
      {
        domainId: 'data',
        technologyId: 'javascript',
        projectSlug: 'formula1',
      },
      {
        domainId: 'data',
        technologyId: 'sql',
        projectSlug: 'sgci-app',
      },
      {
        domainId: 'immersive',
        technologyId: 'three-js',
        projectSlug: 'formula1',
      },
      {
        domainId: 'immersive',
        technologyId: 'three-js',
        projectSlug: 'kinetic-systems-lab',
      },
      {
        domainId: 'delivery',
        technologyId: 'astro',
        projectSlug: 'kinetic-systems-lab',
      },
      {
        domainId: 'delivery',
        technologyId: 'typescript',
        projectSlug: 'kinetic-systems-lab',
      },
    ]);
  });

  it('round-trips grouped semantic evidence to the identical sorted set', () => {
    const projection = buildCapabilityProjection(projects);
    const listSet = projection.map(capabilityRelationKey);
    const graphSet = groupCapabilityProjection(projection).flatMap((domain) =>
      domain.technologies.flatMap((technology) =>
        technology.projectSlugs.map((projectSlug) =>
          capabilityRelationKey({
            domainId: domain.domainId,
            technologyId: technology.technologyId,
            projectSlug,
          }),
        ),
      ),
    );

    expect(graphSet).toEqual(listSet);
  });

  it('keeps delivery-oriented capabilities in the shared taxonomy', () => {
    expect(
      buildCapabilityProjection([
        {
          slug: 'content-platform',
          capabilities: ['content-architecture', 'localization'],
          technologies: ['astro'],
        },
      ]),
    ).toEqual([
      {
        domainId: 'delivery',
        technologyId: 'astro',
        projectSlug: 'content-platform',
      },
    ]);
  });

  it('rejects capabilities outside the explicit domain taxonomy', () => {
    expect(() =>
      buildCapabilityProjection([
        {
          slug: 'unknown-system',
          capabilities: ['unknown-capability'],
          technologies: ['typescript'],
        },
      ]),
    ).toThrow(/unknown-capability/i);
  });

  it('rejects technologies outside the explicit domain taxonomy', () => {
    expect(() =>
      buildCapabilityProjection([
        {
          slug: 'unknown-system',
          capabilities: ['frontend-systems'],
          technologies: ['unknown-technology'],
        },
      ]),
    ).toThrow(/unknown-technology/i);
  });
});
