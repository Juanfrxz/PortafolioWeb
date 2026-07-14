import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CapabilityGraph } from '../../src/components/capabilities/CapabilityGraph';
import { en, es } from '../../src/i18n';
import type { CapabilityRelation } from '../../src/lib/capabilities';

const projection: CapabilityRelation[] = [
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
  {
    domainId: 'delivery',
    technologyId: 'astro',
    projectSlug: 'system-lab',
  },
];

const projects = [
  {
    slug: 'system-lab',
    title: { en: 'System Lab', es: 'Laboratorio de Sistemas' },
    href: { en: '/work/system-lab/', es: '/es/proyectos/system-lab/' },
  },
  {
    slug: 'operations-console',
    title: { en: 'Operations Console', es: 'Consola de Operaciones' },
    href: {
      en: '/work/operations-console/',
      es: '/es/proyectos/operations-console/',
    },
  },
] as const;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('CapabilityGraph', () => {
  it('keeps the SVG decorative and exposes selection/results as normal HTML', () => {
    const { container } = render(
      <CapabilityGraph
        locale="en"
        projection={projection}
        projects={projects}
        labels={en.capabilities}
      />,
    );

    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(container.querySelector('svg')).toHaveAttribute(
      'focusable',
      'false',
    );

    const frontend = screen.getByRole('button', {
      name: /frontend systems/i,
    });
    expect(frontend).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(frontend).getByText('Selected', { exact: true }),
    ).toBeVisible();
    expect(
      frontend.querySelector('[data-selection-shape="diamond"]'),
    ).toBeInTheDocument();

    const results = screen.getByRole('region', {
      name: /frontend systems evidence/i,
    });
    expect(results.tagName).toBe('SECTION');
    expect(within(results).getByText('React')).toBeVisible();
    expect(
      within(results).getByRole('link', { name: 'System Lab' }),
    ).toHaveAttribute('href', '/work/system-lab/');
  });

  it('uses arrows and Home/End for roving focus, then Enter/Space to select', async () => {
    const user = userEvent.setup();
    render(
      <CapabilityGraph
        locale="en"
        projection={projection}
        projects={projects}
        labels={en.capabilities}
      />,
    );

    const frontend = screen.getByRole('button', {
      name: /frontend systems/i,
    });
    const backend = screen.getByRole('button', {
      name: /backend architecture/i,
    });
    const delivery = screen.getByRole('button', {
      name: /delivery and tooling/i,
    });

    frontend.focus();
    await user.keyboard('{ArrowRight}');
    expect(backend).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(backend).toHaveAttribute('aria-pressed', 'true');
    expect(frontend).toHaveAttribute('aria-pressed', 'false');

    await user.keyboard('{End}');
    expect(delivery).toHaveFocus();
    await user.keyboard(' ');
    expect(delivery).toHaveAttribute('aria-pressed', 'true');

    await user.keyboard('{Home}');
    expect(frontend).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(delivery).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(frontend).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(delivery).toHaveFocus();
  });

  it('localizes controls, textual state, results, titles, and links', async () => {
    const user = userEvent.setup();
    render(
      <CapabilityGraph
        locale="es"
        projection={projection}
        projects={projects}
        labels={es.capabilities}
      />,
    );

    const backend = screen.getByRole('button', {
      name: /arquitectura backend/i,
    });
    await user.click(backend);

    expect(within(backend).getByText('Seleccionado')).toBeVisible();
    const results = screen.getByRole('region', {
      name: /evidencia de arquitectura backend/i,
    });
    expect(within(results).getByText('.NET')).toBeVisible();
    expect(
      within(results).getByRole('link', { name: 'Consola de Operaciones' }),
    ).toHaveAttribute('href', '/es/proyectos/operations-console/');
  });

  it('expands the SVG viewBox so a third technology row and label fit', () => {
    const denseProjection: CapabilityRelation[] = Array.from(
      { length: 11 },
      (_, index) => ({
        domainId: 'frontend',
        technologyId: `technology-${String(index + 1).padStart(2, '0')}`,
        projectSlug: 'system-lab',
      }),
    );
    const { container } = render(
      <CapabilityGraph
        locale="en"
        projection={denseProjection}
        projects={[projects[0]]}
        labels={en.capabilities}
      />,
    );

    expect(container.querySelector('svg')).toHaveAttribute(
      'viewBox',
      '0 0 840 533',
    );
    expect(
      container.querySelector('[data-technology-node="technology-11"]'),
    ).toHaveAttribute('transform', 'translate(84 469)');
  });

  it('fails fast when the projection references a missing project', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() =>
      render(
        <CapabilityGraph
          locale="en"
          projection={[
            {
              domainId: 'frontend',
              technologyId: 'react',
              projectSlug: 'missing-project',
            },
          ]}
          projects={[]}
          labels={en.capabilities}
        />,
      ),
    ).toThrow(
      /capability projection references missing project: missing-project/i,
    );
  });
});
