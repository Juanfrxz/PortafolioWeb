import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { experienceSchema, projectSchema } from '../../src/content/schema';
import {
  assertExperienceIntegrity,
  assertProjectIntegrity,
} from '../../src/lib/content-integrity';
import {
  getArchiveProjects,
  getFeaturedProjects,
  getLaunchProjects,
  getSortedExperience,
} from '../../src/lib/projects';

function makeProject(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'formula1',
    type: 'web-experience',
    status: 'shipped',
    visibility: 'featured',
    featuredOrder: 1,
    archiveOrder: null,
    ownership: 'collaborative',
    teamAttribution: ['Juan Rodriguez', 'Project collaborators'],
    title: { en: 'Formula1', es: 'Formula1' },
    summary: {
      en: 'A modular motorsport management experience.',
      es: 'Una experiencia modular de gestión de automovilismo.',
    },
    problem: {
      en: 'Connect racing data with interactive simulation flows.',
      es: 'Conectar datos de competición con flujos de simulación interactivos.',
    },
    contribution: {
      en: 'Collaborative frontend and 3D implementation.',
      es: 'Implementación colaborativa de frontend y 3D.',
    },
    decisions: {
      en: ['Separate interface, data, and simulation modules.'],
      es: ['Separar los módulos de interfaz, datos y simulación.'],
    },
    outcome: {
      en: 'A working repository with connected management flows.',
      es: 'Un repositorio funcional con flujos de gestión conectados.',
    },
    technologies: ['javascript', 'three-js', 'vite'],
    capabilities: ['frontend', 'immersive-web'],
    architectureNodes: ['interface', 'data', 'simulation'],
    architectureEdges: [
      ['interface', 'data'],
      ['data', 'simulation'],
    ],
    repository: {
      state: 'available',
      url: 'https://github.com/Juanfrxz/Formula1',
    },
    demo: { state: 'unverified', url: null },
    documentation: { state: 'unavailable', url: null },
    media: [
      {
        kind: 'identity-fallback',
        src: null,
        width: null,
        height: null,
        alt: {
          en: 'Formula1 project identity',
          es: 'Identidad del proyecto Formula1',
        },
      },
    ],
    evidenceNotes: ['Repository structure and visible flows reviewed.'],
    ...overrides,
  };
}

function makeExperience(overrides: Record<string, unknown> = {}) {
  return {
    id: 'network-operations',
    order: 1,
    role: { en: 'Network operations', es: 'Operaciones de red' },
    summary: {
      en: 'Installed and maintained network infrastructure.',
      es: 'Instalación y mantenimiento de infraestructura de red.',
    },
    timeframe: { en: '2024', es: '2024' },
    organization: { en: 'ItComunicaciones', es: 'ItComunicaciones' },
    status: 'past',
    capabilities: ['network-infrastructure'],
    ...overrides,
  };
}

function loadJsonDirectory(path: string): unknown[] {
  return readdirSync(resolve(path))
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .map((fileName) =>
      JSON.parse(readFileSync(resolve(path, fileName), 'utf8')),
    );
}

describe('project content integrity', () => {
  it('accepts a valid attributed collaborative project', () => {
    expect(() => assertProjectIntegrity([makeProject()])).not.toThrow();
  });

  it('rejects duplicate project slugs', () => {
    expect(() =>
      assertProjectIntegrity([makeProject(), makeProject()]),
    ).toThrow(/duplicate project slug/i);
  });

  it('rejects a missing localized translation', () => {
    const invalid = makeProject({
      summary: { en: 'English summary only.' },
    });

    expect(() => projectSchema.parse(invalid)).toThrow();
  });

  it.each([
    ['orphan edge', [['interface', 'missing']], /orphan/i],
    ['self edge', [['interface', 'interface']], /self edge/i],
    [
      'duplicate edge',
      [
        ['interface', 'data'],
        ['interface', 'data'],
      ],
      /duplicate edge/i,
    ],
  ])('rejects an architecture %s', (_label, architectureEdges, message) => {
    const invalid = makeProject({ architectureEdges });

    expect(() => projectSchema.parse(invalid)).toThrow(message as RegExp);
  });

  it('rejects duplicate architecture nodes', () => {
    const invalid = makeProject({
      architectureNodes: ['interface', 'interface'],
      architectureEdges: [],
    });

    expect(() => projectSchema.parse(invalid)).toThrow(/duplicate node/i);
  });

  it('rejects a collaborative project without meaningful attribution', () => {
    const invalid = makeProject({ teamAttribution: ['   '] });

    expect(() => projectSchema.parse(invalid)).toThrow(/attribution/i);
  });

  it('rejects an unavailable link state that exposes a URL', () => {
    const invalid = makeProject({
      demo: { state: 'unavailable', url: 'https://example.com/demo' },
    });

    expect(() => projectSchema.parse(invalid)).toThrow();
  });

  it('rejects media fields that do not match their discriminator', () => {
    const invalid = makeProject({
      media: [
        {
          kind: 'identity-fallback',
          src: '/projects/formula1.png',
          width: 1200,
          height: 800,
          alt: { en: 'Formula1 identity', es: 'Identidad Formula1' },
        },
      ],
    });

    expect(() => projectSchema.parse(invalid)).toThrow();
  });

  it('rejects visual media without meaningful localized alt text', () => {
    const invalid = makeProject({
      media: [
        {
          kind: 'image',
          src: '/projects/formula1.png',
          width: 1200,
          height: 800,
          alt: { en: 'Formula1 interface', es: '   ' },
        },
      ],
    });

    expect(() => projectSchema.parse(invalid)).toThrow();
  });

  it.each(['type', 'status'])('rejects a project missing %s', (field) => {
    const invalid: Record<string, unknown> = makeProject();
    delete invalid[field];

    expect(() => projectSchema.parse(invalid)).toThrow();
  });

  it.each([
    { visibility: 'featured', featuredOrder: null, archiveOrder: null },
    { visibility: 'featured', featuredOrder: 1, archiveOrder: 1 },
    { visibility: 'archive', featuredOrder: null, archiveOrder: null },
    { visibility: 'archive', featuredOrder: 1, archiveOrder: 1 },
    { visibility: 'hidden', featuredOrder: 1, archiveOrder: null },
  ])('rejects invalid visibility and order state %#', (orders) => {
    expect(() => projectSchema.parse(makeProject(orders))).toThrow(/order/i);
  });

  it('rejects duplicate featured orders', () => {
    const duplicateOrder = makeProject({ slug: 'another-project' });

    expect(() =>
      assertProjectIntegrity([makeProject(), duplicateOrder]),
    ).toThrow(/duplicate featured order/i);
  });
});

describe('seeded project records', () => {
  it('parses exactly six actual project JSON records', () => {
    const projects = assertProjectIntegrity(
      loadJsonDirectory('src/content/projects'),
    );

    expect(projects).toHaveLength(6);
  });

  it('returns the exact ordered featured and archive launch policy', () => {
    const projects = assertProjectIntegrity(
      loadJsonDirectory('src/content/projects'),
    );

    expect(getFeaturedProjects(projects).map(({ slug }) => slug)).toEqual([
      'formula1',
      'sgci-app',
      'kinetic-systems-lab',
    ]);
    expect(getArchiveProjects(projects).map(({ slug }) => slug)).toEqual([
      'proyecto-mysql',
      'facturaweb-lit',
    ]);
    expect(getLaunchProjects(projects).map(({ slug }) => slug)).not.toContain(
      'event-mobile-app',
    );
    expect(getLaunchProjects(projects)).toHaveLength(5);
  });

  it('preserves verified source states without inventing demo availability', () => {
    const projects = assertProjectIntegrity(
      loadJsonDirectory('src/content/projects'),
    );
    const bySlug = new Map(projects.map((project) => [project.slug, project]));

    expect(bySlug.get('formula1')).toMatchObject({
      ownership: 'collaborative',
      status: 'shipped',
      featuredOrder: 1,
      repository: {
        state: 'available',
        url: 'https://github.com/Juanfrxz/Formula1',
      },
      demo: { state: 'unverified', url: null },
    });
    expect(bySlug.get('sgci-app')).toMatchObject({
      ownership: 'collaborative',
      status: 'shipped',
      featuredOrder: 2,
      demo: { state: 'source-only', url: null },
    });
    expect(bySlug.get('kinetic-systems-lab')).toMatchObject({
      ownership: 'individual',
      status: 'in-progress',
      featuredOrder: 3,
      repository: {
        state: 'available',
        url: 'https://github.com/Juanfrxz/PortafolioWeb',
      },
    });
    expect(bySlug.get('proyecto-mysql')).toMatchObject({
      visibility: 'archive',
      archiveOrder: 1,
    });
    expect(bySlug.get('facturaweb-lit')).toMatchObject({
      visibility: 'archive',
      archiveOrder: 2,
      demo: { state: 'unverified', url: null },
    });
    expect(bySlug.get('event-mobile-app')).toMatchObject({
      visibility: 'hidden',
      featuredOrder: null,
      archiveOrder: null,
    });
  });

  it('accepts collection-entry shapes without losing deterministic order', () => {
    const projects = assertProjectIntegrity(
      loadJsonDirectory('src/content/projects'),
    );
    const entries = projects.map((data) => ({ id: data.slug, data }));

    expect(getFeaturedProjects(entries).map(({ id }) => id)).toEqual([
      'formula1',
      'sgci-app',
      'kinetic-systems-lab',
    ]);
  });
});

describe('experience content integrity', () => {
  it('accepts a complete experience record', () => {
    expect(() => experienceSchema.parse(makeExperience())).not.toThrow();
  });

  it('rejects duplicate experience IDs', () => {
    expect(() =>
      assertExperienceIntegrity([
        makeExperience(),
        makeExperience({ order: 2 }),
      ]),
    ).toThrow(/duplicate experience id/i);
  });

  it('rejects duplicate experience orders', () => {
    expect(() =>
      assertExperienceIntegrity([
        makeExperience(),
        makeExperience({ id: 'another-experience' }),
      ]),
    ).toThrow(/duplicate experience order/i);
  });

  it('rejects more than one current experience', () => {
    expect(() =>
      assertExperienceIntegrity([
        makeExperience({ status: 'current' }),
        makeExperience({
          id: 'another-experience',
          order: 2,
          status: 'current',
        }),
      ]),
    ).toThrow(/current experience/i);
  });
});

describe('seeded experience records', () => {
  it('parses and sorts exactly four actual experience JSON records', () => {
    const experience = assertExperienceIntegrity(
      loadJsonDirectory('src/content/experience'),
    );

    expect(getSortedExperience(experience).map(({ id }) => id)).toEqual([
      'ict-infrastructure',
      'network-operations',
      'full-stack-systems',
      'creative-interface-engineering',
    ]);
    expect(experience).toHaveLength(4);
    expect(
      experience.filter(({ status }) => status === 'current'),
    ).toHaveLength(1);
  });
});
