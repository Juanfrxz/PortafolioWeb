import { describe, expect, it } from 'vitest';

import {
  evaluateBundleBudgets,
  extractDynamicModuleSpecifiers,
  extractStaticModuleSpecifiers,
  INITIAL_NON_3D_BUDGET_BYTES,
  DEFERRED_HERO_BUDGET_BYTES,
} from '../../scripts/check-bundle-budgets';

describe('bundle budget evaluation', () => {
  it('fails independently when initial or deferred hero JavaScript exceeds budget', () => {
    expect(
      evaluateBundleBudgets({
        initialNon3dGzipBytes: INITIAL_NON_3D_BUDGET_BYTES + 1,
        deferredHeroGzipBytes: DEFERRED_HERO_BUDGET_BYTES + 1,
      }).map((issue) => issue.code),
    ).toEqual(['initial-non-3d', 'deferred-hero']);
  });

  it('accepts both exact byte limits', () => {
    expect(
      evaluateBundleBudgets({
        initialNon3dGzipBytes: INITIAL_NON_3D_BUDGET_BYTES,
        deferredHeroGzipBytes: DEFERRED_HERO_BUDGET_BYTES,
      }),
    ).toEqual([]);
  });

  it('keeps dynamic imports out of the initial static module graph', () => {
    const source = `
      import './initial.js';
      import { value } from './shared.js';
      const deferred = import('./deferred.js');
    `;

    expect(extractStaticModuleSpecifiers(source)).toEqual([
      './initial.js',
      './shared.js',
    ]);
  });

  it('follows minified static imports without whitespace', () => {
    const source = `import{a as b}from"./shared.js";import"./side-effect.js";import("./deferred.js")`;

    expect(extractStaticModuleSpecifiers(source)).toEqual([
      './shared.js',
      './side-effect.js',
    ]);
  });

  it('tracks literal dynamic imports for the complete deferred closure', () => {
    const source = `
      import('./HeroExperience.js');
      const ignored = import(variablePath);
      const duplicate = import("./HeroExperience.js");
      const minified = import(\`./HeroExperience.js\`);
    `;

    expect(extractDynamicModuleSpecifiers(source)).toEqual([
      './HeroExperience.js',
    ]);
  });
});
