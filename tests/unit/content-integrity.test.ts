import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { experienceSchema, projectSchema } from '../../src/content/schema';
import {
  assertContentDirectories,
  assertExperienceIntegrity,
  assertProjectIntegrity,
  loadJsonDirectory,
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

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function createTemporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'portfolio-content-'));
  temporaryDirectories.push(directory);
  return directory;
}

function writeJsonFixture(filePath: string, value: unknown): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value), 'utf8');
}

describe('recursive JSON loading', () => {
  it('loads every nested JSON file from filesystem paths and file URLs', () => {
    const directory = createTemporaryDirectory();
    writeJsonFixture(join(directory, 'a.json'), { id: 'root' });
    writeJsonFixture(join(directory, 'nested', 'b.json'), { id: 'nested' });
    writeFileSync(join(directory, 'ignored.txt'), 'not content', 'utf8');

    const expected = [{ id: 'root' }, { id: 'nested' }];

    expect(loadJsonDirectory(directory)).toEqual(expected);
    expect(loadJsonDirectory(pathToFileURL(directory))).toEqual(expected);
  });

  it('reports the source path when nested JSON is invalid', () => {
    const directory = createTemporaryDirectory();
    const invalidPath = join(directory, 'nested', 'broken.json');
    mkdirSync(dirname(invalidPath), { recursive: true });
    writeFileSync(invalidPath, '{ invalid json', 'utf8');

    expect(() => loadJsonDirectory(directory)).toThrow(/broken\.json/i);
  });

  it('makes nested records visible to global integrity assertions', () => {
    const directory = createTemporaryDirectory();
    writeJsonFixture(join(directory, 'formula1.json'), makeProject());
    writeJsonFixture(
      join(directory, 'nested', 'duplicate.json'),
      makeProject(),
    );

    expect(() =>
      assertProjectIntegrity(loadJsonDirectory(pathToFileURL(directory))),
    ).toThrow(/duplicate project slug/i);
  });
});

describe('build-time content directory integrity', () => {
  it.each([
    ['duplicate project slug', /duplicate project slug/i],
    ['duplicate featured order', /duplicate featured order/i],
    ['duplicate archive order', /duplicate archive order/i],
    ['duplicate experience order', /duplicate experience order/i],
    ['multiple current experiences', /current experience/i],
  ])('rejects %s from nested content', (scenario, expectedError) => {
    const root = createTemporaryDirectory();
    const projectsRoot = join(root, 'projects');
    const experienceRoot = join(root, 'experience');
    let projects = [makeProject()];
    let experience = [makeExperience()];

    if (scenario === 'duplicate project slug') {
      projects = [makeProject(), makeProject({ featuredOrder: 2 })];
    }

    if (scenario === 'duplicate featured order') {
      projects = [makeProject(), makeProject({ slug: 'second-project' })];
    }

    if (scenario === 'duplicate archive order') {
      projects = [
        makeProject({
          slug: 'first-archive',
          visibility: 'archive',
          featuredOrder: null,
          archiveOrder: 1,
        }),
        makeProject({
          slug: 'second-archive',
          visibility: 'archive',
          featuredOrder: null,
          archiveOrder: 1,
        }),
      ];
    }

    if (scenario === 'duplicate experience order') {
      experience = [
        makeExperience(),
        makeExperience({ id: 'second-experience' }),
      ];
    }

    if (scenario === 'multiple current experiences') {
      experience = [
        makeExperience({ status: 'current' }),
        makeExperience({
          id: 'second-experience',
          order: 2,
          status: 'current',
        }),
      ];
    }

    projects.forEach((project, index) =>
      writeJsonFixture(
        join(projectsRoot, index === 0 ? 'first.json' : 'nested/second.json'),
        project,
      ),
    );
    experience.forEach((record, index) =>
      writeJsonFixture(
        join(experienceRoot, index === 0 ? 'first.json' : 'nested/second.json'),
        record,
      ),
    );

    expect(() =>
      assertContentDirectories({
        projects: pathToFileURL(projectsRoot),
        experience: experienceRoot,
      }),
    ).toThrow(expectedError as RegExp);
  });
});

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

  it.each(['/%5c..%5csecret.png', '/%2f%2fevil.png'])(
    'rejects encoded separators in media source %s',
    (src) => {
      const invalid = makeProject({
        media: [
          {
            kind: 'image',
            src,
            width: 1200,
            height: 800,
            alt: {
              en: 'Unsafe project media',
              es: 'Contenido multimedia inseguro del proyecto',
            },
          },
        ],
      });

      expect(() => projectSchema.parse(invalid)).toThrow(/root-relative/i);
    },
  );

  it.each(['type', 'status'])('rejects a project missing %s', (field) => {
    const invalid: Record<string, unknown> = makeProject();
    delete invalid[field];

    expect(() => projectSchema.parse(invalid)).toThrow();
  });

  it.each(['repository', 'demo', 'documentation', 'media'])(
    'rejects a project missing required field %s',
    (field) => {
      const invalid: Record<string, unknown> = makeProject();
      delete invalid[field];

      expect(() => projectSchema.parse(invalid)).toThrow();
    },
  );

  it('rejects project media missing alt text', () => {
    const invalid = makeProject({
      media: [
        {
          kind: 'image',
          src: '/projects/formula1.png',
          width: 1200,
          height: 800,
        },
      ],
    });

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

  it('places business systems in the bilingual full-stack progression', () => {
    const experience = assertExperienceIntegrity(
      loadJsonDirectory('src/content/experience'),
    );
    const fullStack = experience.find(({ id }) => id === 'full-stack-systems');

    expect(fullStack?.capabilities).toContain('business-systems');
    expect(fullStack?.summary.en).toMatch(/business systems/i);
    expect(fullStack?.summary.es).toMatch(/sistemas empresariales/i);
  });

  it('keeps past creative-interface copy free of ongoing framing', () => {
    const experience = assertExperienceIntegrity(
      loadJsonDirectory('src/content/experience'),
    );
    const creative = experience.find(
      ({ id }) => id === 'creative-interface-engineering',
    );

    expect(creative?.status).toBe('past');
    expect(
      `${creative?.summary.en} ${creative?.summary.es} ${creative?.timeframe.en} ${creative?.timeframe.es}`,
    ).not.toMatch(/evolving|ongoing|en evolución/i);
  });
});
