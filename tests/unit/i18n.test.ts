import { describe, expect, it } from 'vitest';

import { defineDictionary, en, es } from '../../src/i18n';

function leafKeyPaths(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    leafKeyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe('localized dictionaries', () => {
  it.each([
    ['English', en],
    ['Spanish', es],
  ])('accepts the complete %s dictionary', (_language, dictionary) => {
    expect(defineDictionary(dictionary)).toEqual(dictionary);
  });

  it('rejects a dictionary missing hero.support', () => {
    const { support: _support, ...heroWithoutSupport } = en.hero;
    const incompleteDictionary = { ...en, hero: heroWithoutSupport };

    expect(() => defineDictionary(incompleteDictionary)).toThrow();
  });

  it('keeps exact deep leaf-key parity between English and Spanish', () => {
    expect(leafKeyPaths(es).sort()).toEqual(leafKeyPaths(en).sort());
  });

  it('uses the approved English hero copy exactly', () => {
    expect(en.hero).toMatchObject({
      label: 'CREATIVE FULL-STACK DEVELOPER · COLOMBIA',
      heading: 'Engineering interfaces for real systems.',
      support:
        'I connect frontend craft, backend architecture, data, and immersive 3D to build digital products with intent.',
      primaryCta: 'Explore selected work',
      secondaryCta: 'Open a channel',
    });
  });

  it('uses the approved Spanish hero copy exactly', () => {
    expect(es.hero).toMatchObject({
      label: 'DESARROLLADOR FULL-STACK CREATIVO · COLOMBIA',
      heading: 'Creo interfaces para sistemas reales.',
      support:
        'Conecto diseño frontend, arquitectura backend, datos y experiencias 3D para construir productos digitales con intención.',
      primaryCta: 'Explorar proyectos',
      secondaryCta: 'Abrir un canal',
    });
  });

  it('provides professional, error, and accessibility labels in both locales', () => {
    const representativeLabels = [
      en.contact.professionalLinks,
      en.contact.provider,
      en.accessibility.skipToContent,
      en.accessibility.capabilityResults,
      es.contact.professionalLinks,
      es.contact.provider,
      es.accessibility.skipToContent,
      es.accessibility.capabilityResults,
    ];

    for (const label of representativeLabels) {
      expect(label.trim()).not.toBe('');
    }
  });

  it('preserves the approved system terminology in both locales', () => {
    expect({
      work: en.work.heading,
      graph: en.capabilities.heading,
      trail: en.trail.heading,
      channel: en.contact.heading,
      sourceOnly: en.work.sourceOnly,
      collaborative: en.work.collaborative,
      delivery: en.capabilities.delivery,
    }).toEqual({
      work: 'Selected Work',
      graph: 'Capability Graph',
      trail: 'Signal Trail',
      channel: 'Open Channel',
      sourceOnly: 'Source only',
      collaborative: 'Collaborative project',
      delivery: 'Delivery and tooling',
    });

    expect({
      work: es.work.heading,
      graph: es.capabilities.heading,
      trail: es.trail.heading,
      channel: es.contact.heading,
      sourceOnly: es.work.sourceOnly,
      collaborative: es.work.collaborative,
      delivery: es.capabilities.delivery,
    }).toEqual({
      work: 'Proyectos seleccionados',
      graph: 'Grafo de capacidades',
      trail: 'Trayectoria de señal',
      channel: 'Abrir un canal',
      sourceOnly: 'Solo código fuente',
      collaborative: 'Proyecto colaborativo',
      delivery: 'Entrega y herramientas',
    });
  });
});
