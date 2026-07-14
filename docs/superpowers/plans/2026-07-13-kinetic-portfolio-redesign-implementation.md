# Kinetic Systems Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `juanfrxz.dev` as the approved bilingual Kinetic Systems Lab portfolio using static Astro pages, selectively hydrated React/R3F experiences, verified project evidence, a real contact form, and enforceable accessibility/performance gates.

**Architecture:** Astro renders localized pages and case studies as static HTML from validated content collections. React islands are limited to the theme control, contact form, capability graph, and adaptive R3F hero; native document scrolling and semantic fallbacks remain authoritative. Work proceeds in three dependent phases—static foundation, interactive systems, and production hardening—so every phase leaves a usable site.

**Tech Stack:** Astro 7.0.9, React 19.2.7, TypeScript, React Three Fiber 9.6.1, Drei 10.7.7, Three.js 0.185.1, React Three Postprocessing 3.0.4, Postprocessing 6.39.2, GSAP 3.15.0, Zod 4.4.3, Vitest 4.1.10, Testing Library, Playwright 1.61.1, axe, Lighthouse CI, glTF Transform 4.4.1, Formspree, GitHub Pages.

---

## Preconditions and execution rules

- Work from `codex/kinetic-portfolio-redesign` in an isolated worktree or the already isolated feature branch.
- Read `docs/superpowers/specs/2026-07-13-kinetic-portfolio-redesign-design.md` before each task and treat it as the product source of truth.
- Do not stage `.superpowers/`; add it to `.gitignore` in Task 1.
- Preserve the source avatar at `assets/models/avatar_programador.glb` until optimized outputs pass visual review and size checks.
- Do not link `BackHackthon` or expose any discovered credential/configuration value.
- Do not invent contribution claims or metrics. Use `Collaborative project` whenever evidence does not prove individual ownership.
- Follow red → green → refactor. Run the failing test before production code for every behavioral task.
- Commit after each task only when its specified verification passes.

## Locked file map

```text
astro.config.mjs                 Astro static/site/integration configuration
package.json                     Exact dependencies and verification scripts
playwright.config.ts             Browser projects and preview server
vitest.config.ts                 Unit/component test environment
src/content.config.ts            Astro collection loaders and schemas
src/config/site.ts               Domain, identity, social links, route constants
src/i18n/                        Typed dictionaries and route helpers
src/content/                     Project and experience evidence records
src/layouts/                     Base and case-study document shells
src/components/layout/           HUD, page shell, footer
src/components/hero/             Static fallback plus adaptive R3F island
src/components/work/             Selected Work and case-study presentation
src/components/capabilities/     Semantic capability list and optional graph
src/components/profile/          Signal Trail
src/components/contact/          Contact section and Formspree island
src/components/seo/              Metadata and JSON-LD
src/lib/                         Pure domain, state, motion, SEO, contact helpers
src/pages/                       English and Spanish static routes
src/styles/                      Tokens, reset, base, utilities
scripts/                         Asset, content, link, environment, and budget checks
tests/unit/                      Pure behavior tests
tests/components/                React island tests
tests/e2e/                       Route, interaction, accessibility, and mode tests
public/models/                   Optimized full/light GLBs
public/social/                   1200×630 localized social previews
public/CNAME                     Custom-domain artifact
```

## Specification coverage map

| Approved design area | Implementation tasks |
|---|---|
| Purpose, positioning, truthful copy | 2, 3, 5, 6 |
| Five-module information architecture | 5, 6, 11, 12 |
| Localized routes and content | 2, 3, 5, 6, 13 |
| Deep Space / Lab Paper visual system | 4, 5 |
| Adaptive avatar and 3D choreography | 7, 8, 9 |
| Native-scroll motion | 9, 10 |
| Component boundaries and data flows | 1–12 |
| Project evidence and exclusions | 3, 6, 14, 17 |
| Error and fallback states | 8, 9, 12, 14 |
| Accessibility and responsive behavior | 4, 5, 10, 11, 12, 15 |
| SEO and sharing | 13, 14 |
| Performance budgets | 7, 8, 9, 14, 15 |
| Verification and deployment | 14, 15, 16, 17 |

## Phase A — Static, bilingual, indexable foundation

### Task 1: Replace the build toolchain with Astro and establish test infrastructure

**Files:**

- Modify: `package.json`
- Regenerate: `package-lock.json`
- Modify: `.gitignore`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `src/env.d.ts`
- Create: `src/pages/index.astro`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `tests/unit/scaffold.test.ts`
- Create: `.prettierrc.mjs`
- Create: `.prettierignore`
- Move: `CNAME` → `public/CNAME`

- [ ] **Step 1: Confirm the old build baseline and record the expected migration failure**

Run:

```powershell
npm run build
npm ls astro
```

Expected: the existing Vite build succeeds, then `npm ls astro` exits nonzero because Astro is not installed yet. This records a deterministic baseline without allowing `npm exec` to download anything implicitly.

- [ ] **Step 2: Install the exact runtime and development dependencies**

Run:

```powershell
npm install --save-exact astro@7.0.9 @astrojs/react@6.0.1 @astrojs/sitemap@3.7.3 react@19.2.7 react-dom@19.2.7 three@0.185.1 @react-three/fiber@9.6.1 @react-three/drei@10.7.7 @react-three/postprocessing@3.0.4 postprocessing@6.39.2 gsap@3.15.0 @gsap/react@2.1.2 zod@4.4.3 @fontsource-variable/instrument-sans@5.2.8 @fontsource/dm-mono@5.2.7
npm install --save-dev --save-exact @astrojs/check@0.9.9 typescript@7.0.2 @types/node@26.1.1 @types/react@19.2.17 @types/react-dom@19.2.3 @types/three@0.185.1 vitest@4.1.10 @vitest/coverage-v8@4.1.10 jsdom@29.1.1 @testing-library/react@16.3.2 @testing-library/jest-dom@6.9.1 @testing-library/user-event@14.6.1 @playwright/test@1.61.1 @axe-core/playwright@4.12.1 @lhci/cli@0.15.1 @gltf-transform/cli@4.4.1 gltfjsx@6.5.3 sharp@0.35.3 prettier@3.9.5 prettier-plugin-astro@0.14.1 tsx@4.23.1 fast-glob@3.3.3 cheerio@1.2.0
```

- [ ] **Step 3: Replace scripts and configure Astro**

Set these `package.json` fields while keeping `private: true`:

```json
{
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "check": "astro check",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "build": "npm run check && astro build",
    "preview": "astro preview",
    "test:e2e": "playwright test",
    "test:a11y": "playwright test tests/e2e/accessibility",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

Create `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://juanfrxz.dev',
  output: 'static',
  trailingSlash: 'always',
  integrations: [react(), sitemap()],
  build: { assets: 'assets' },
});
```

Create `tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strictest",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules", ".superpowers"]
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
```

Create `tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

Create `.prettierrc.mjs`:

```js
export default {
  plugins: ['prettier-plugin-astro'],
  overrides: [{ files: '*.astro', options: { parser: 'astro' } }],
  singleQuote: true,
  trailingComma: 'all',
};
```

Create `.prettierignore` so the migration does not mechanically rewrite legacy source before Task 17:

```text
node_modules/
dist/
.astro/
.superpowers/
assets/
index.html
vite.config.js
package-lock.json
docs/superpowers/
```

- [ ] **Step 4: Add the first Astro page and repository hygiene**

Create `src/pages/index.astro`:

```astro
---
const title = 'Juan Rodriguez — Creative Full-Stack Developer';
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
  </head>
  <body>
    <main><h1>Engineering interfaces for real systems.</h1></main>
  </body>
</html>
```

Add to `.gitignore`:

```gitignore
.superpowers/
.astro/
.lighthouseci/
coverage/
playwright-report/
test-results/
```

Move the existing root `CNAME` to `public/CNAME` and confirm it contains only `juanfrxz.dev`.

Create `src/env.d.ts` with `/// <reference types="astro/client" />` and add a scaffold test that reads `public/CNAME`, asserts the domain, and verifies the installed Node major version is at least 22. This gives `npm test` a meaningful first green check.

- [ ] **Step 5: Verify the scaffold**

Run:

```powershell
npm run format
npm run check
npm test
npm run build
Get-Content dist\CNAME
```

Expected: all commands exit 0; Vitest reports no failing tests; `dist/CNAME` contains `juanfrxz.dev`.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json .gitignore astro.config.mjs tsconfig.json vitest.config.ts .prettierrc.mjs .prettierignore tests/setup.ts tests/unit/scaffold.test.ts src/env.d.ts src/pages/index.astro public/CNAME CNAME
git commit -m "build: migrate portfolio foundation to Astro"
```

### Task 2: Add typed localization and deterministic locale routes

**Files:**

- Create: `src/i18n/schema.ts`
- Create: `src/i18n/en.ts`
- Create: `src/i18n/es.ts`
- Create: `src/i18n/index.ts`
- Create: `src/lib/locale.ts`
- Test: `tests/unit/i18n.test.ts`
- Test: `tests/unit/locale.test.ts`

- [ ] **Step 1: Write failing dictionary and route tests**

```ts
// tests/unit/locale.test.ts
import { describe, expect, it } from 'vitest';
import { alternateLocalePath, caseStudyPath, homePath, workIndexPath } from '../../src/lib/locale';

describe('localized routes', () => {
  it('builds stable English and Spanish paths', () => {
    expect(homePath('en')).toBe('/');
    expect(homePath('es')).toBe('/es/');
    expect(workIndexPath('en')).toBe('/work/');
    expect(workIndexPath('es')).toBe('/es/proyectos/');
    expect(caseStudyPath('formula1', 'en')).toBe('/work/formula1/');
    expect(caseStudyPath('formula1', 'es')).toBe('/es/proyectos/formula1/');
  });

  it('maps known localized routes without persistence or redirects', () => {
    expect(alternateLocalePath('/work/formula1/', 'es')).toBe('/es/proyectos/formula1/');
    expect(alternateLocalePath('/es/', 'en')).toBe('/');
  });
});
```

```ts
// tests/unit/i18n.test.ts
import { describe, expect, it } from 'vitest';
import { defineDictionary } from '../../src/i18n/schema';
import { en, es } from '../../src/i18n';

describe('localized dictionaries', () => {
  it('accepts both complete dictionaries', () => {
    expect(defineDictionary(en)).toEqual(en);
    expect(defineDictionary(es)).toEqual(es);
  });

  it('rejects a dictionary missing hero support copy', () => {
    const invalid = structuredClone(en) as Record<string, unknown>;
    delete (invalid.hero as Record<string, unknown>).support;
    expect(() => defineDictionary(invalid)).toThrow();
  });
});
```

- [ ] **Step 2: Run tests and verify RED**

```powershell
npm test -- tests/unit/locale.test.ts tests/unit/i18n.test.ts
```

Expected: FAIL because locale helpers and dictionaries do not exist.

- [ ] **Step 3: Implement the schema, approved hero copy, and routes**

Use this public contract in `src/i18n/schema.ts`:

```ts
import { z } from 'zod';

export const dictionarySchema = z.object({
  nav: z.object({ work: z.string().min(1), about: z.string().min(1), contact: z.string().min(1), menu: z.string().min(1) }),
  hero: z.object({ label: z.string().min(1), heading: z.string().min(1), support: z.string().min(1), availability: z.string().min(1), primaryCta: z.string().min(1), secondaryCta: z.string().min(1) }),
  work: z.object({ label: z.string().min(1), heading: z.string().min(1), sourceOnly: z.string().min(1), collaborative: z.string().min(1), problem: z.string().min(1), contribution: z.string().min(1), architecture: z.string().min(1), decisions: z.string().min(1), outcome: z.string().min(1), technologies: z.string().min(1), archive: z.string().min(1), viewCase: z.string().min(1) }),
  projectStatus: z.object({ shipped: z.string().min(1), inProgress: z.string().min(1), archived: z.string().min(1), repository: z.string().min(1), demo: z.string().min(1), documentation: z.string().min(1), unavailable: z.string().min(1) }),
  capabilities: z.object({ label: z.string().min(1), heading: z.string().min(1), showGraph: z.string().min(1), hideGraph: z.string().min(1), frontend: z.string().min(1), backend: z.string().min(1), data: z.string().min(1), immersive: z.string().min(1), delivery: z.string().min(1) }),
  trail: z.object({ label: z.string().min(1), heading: z.string().min(1), current: z.string().min(1) }),
  contact: z.object({ label: z.string().min(1), heading: z.string().min(1), availability: z.string().min(1), invitation: z.string().min(1), professionalLinks: z.string().min(1), name: z.string().min(1), email: z.string().min(1), message: z.string().min(1), submit: z.string().min(1), sending: z.string().min(1), success: z.string().min(1), invalid: z.string().min(1), offline: z.string().min(1), timeout: z.string().min(1), rateLimit: z.string().min(1), provider: z.string().min(1), unknown: z.string().min(1), unavailable: z.string().min(1) }),
  theme: z.object({ useLight: z.string().min(1), useDark: z.string().min(1) }),
  accessibility: z.object({ skipToContent: z.string().min(1), openMenu: z.string().min(1), closeMenu: z.string().min(1), changeLanguage: z.string().min(1), capabilityResults: z.string().min(1) }),
});

export type Dictionary = z.infer<typeof dictionarySchema>;
export const defineDictionary = (input: unknown): Dictionary => dictionarySchema.parse(input);
```

Use the exact approved English and Spanish hero copy from Section 4 of the design spec. Implement `Locale = 'en' | 'es'` and route helpers as pure functions; unknown paths return the target locale home instead of guessing a slug.

The schema above is the minimum public contract. Every later label or live/error state added by Tasks 3–13 must be added to the schema and both dictionaries in the same commit; `tests/unit/i18n.test.ts` compares deep key paths so a missing translation always fails before build.

- [ ] **Step 4: Run tests and type checks**

```powershell
npm test -- tests/unit/locale.test.ts tests/unit/i18n.test.ts
npm run check
```

Expected: 2 test files pass; Astro check exits 0.

- [ ] **Step 5: Commit**

```powershell
git add src/i18n src/lib/locale.ts tests/unit/i18n.test.ts tests/unit/locale.test.ts
git commit -m "feat: add typed bilingual content"
```

### Task 3: Create validated project and experience collections

**Files:**

- Create: `src/content.config.ts`
- Create: `src/content/schema.ts`
- Create: `src/lib/projects.ts`
- Create: `src/lib/content-integrity.ts`
- Create: `src/content/projects/formula1.json`
- Create: `src/content/projects/sgci-app.json`
- Create: `src/content/projects/kinetic-systems-lab.json`
- Create: `src/content/projects/proyecto-mysql.json`
- Create: `src/content/projects/facturaweb-lit.json`
- Create: `src/content/projects/event-mobile-app.json`
- Create: `src/content/experience/ict-infrastructure.json`
- Create: `src/content/experience/network-operations.json`
- Create: `src/content/experience/full-stack-systems.json`
- Create: `src/content/experience/creative-interface-engineering.json`
- Test: `tests/unit/content-integrity.test.ts`

- [ ] **Step 1: Write failing integrity tests**

```ts
import { describe, expect, it } from 'vitest';
import { assertProjectIntegrity } from '../../src/lib/content-integrity';

const project = {
  slug: 'formula1',
  type: 'web-experience',
  visibility: 'featured',
  featuredOrder: 1,
  archiveOrder: null,
  status: 'shipped',
  ownership: 'collaborative',
  teamAttribution: ['Juanfrxz', 'project collaborators'],
  title: { en: 'Formula1', es: 'Formula1' },
  summary: { en: 'Modular racing management experience.', es: 'Experiencia modular de gestión de automovilismo.' },
  problem: { en: 'Connect racing data and simulation flows.', es: 'Conectar datos y flujos de simulación.' },
  contribution: { en: 'Collaborative frontend and 3D implementation.', es: 'Implementación colaborativa de frontend y 3D.' },
  decisions: { en: ['Web Components', 'Module boundaries'], es: ['Web Components', 'Límites modulares'] },
  outcome: { en: 'A deployed interactive demo.', es: 'Una demo interactiva desplegada.' },
  technologies: ['javascript', 'threejs', 'vite'],
  capabilities: ['frontend', 'immersive-web'],
  architectureNodes: ['ui', 'data', 'simulation'],
  architectureEdges: [['ui', 'data'], ['data', 'simulation']],
  repository: { state: 'available', url: 'https://github.com/Juanfrxz/Formula1' },
  demo: { state: 'unverified', url: null },
  documentation: { state: 'unavailable', url: null },
  media: [{ kind: 'identity-fallback', src: null, width: null, height: null, alt: { en: 'Formula1 project identity', es: 'Identidad del proyecto Formula1' } }],
};

describe('project integrity', () => {
  it('accepts an attributed collaborative project', () => expect(() => assertProjectIntegrity([project])).not.toThrow());
  it('rejects duplicate slugs', () => expect(() => assertProjectIntegrity([project, project])).toThrow(/duplicate slug/i));
  it('rejects an orphan architecture edge', () => {
    const invalid = { ...project, architectureEdges: [['ui', 'missing']] };
    expect(() => assertProjectIntegrity([invalid])).toThrow(/orphan/i);
  });
  it('rejects unavailable demos that expose a URL', () => {
    const invalid = { ...project, demo: { state: 'source-only', url: 'https://invalid.example' } };
    expect(() => assertProjectIntegrity([invalid])).toThrow(/demo/i);
  });
});
```

- [ ] **Step 2: Run tests and verify RED**

```powershell
npm test -- tests/unit/content-integrity.test.ts
```

Expected: FAIL because schema and integrity helpers do not exist.

- [ ] **Step 3: Implement collection schemas and evidence records**

Define discriminated demo states:

```ts
const demoSchema = z.discriminatedUnion('state', [
  z.object({ state: z.literal('available'), url: z.string().url() }),
  z.object({ state: z.enum(['unverified', 'source-only', 'unavailable']), url: z.null() }),
]);
```

Use `defineCollection()` with `glob({ pattern: '**/*.json', base: './src/content/projects' })`.

Define one reusable availability schema for `repository`, `demo`, and `documentation`: `available` requires a valid URL; `unverified`, `source-only`, and `unavailable` require `url: null`. Every project also requires `type`, `status`, `visibility`, `featuredOrder | archiveOrder | null`, localized `title`, `summary`, `problem`, `contribution`, `decisions`, and `outcome`, team attribution, technologies, capabilities, graph data, and a `media` array. Each media item declares `kind`, `src | null`, intrinsic `width | null`, `height | null`, and localized `alt`; missing optional media uses an explicit identity-fallback item rather than an invalid path.

Define the experience collection concretely with stable `id`, integer `order`, localized `role`, `summary`, and `timeframe`, optional `organization`, `status: 'past' | 'current'`, and nonempty capability relationships. The integrity helper enforces unique project slugs and experience IDs/orders, `individual|collaborative` ownership, attribution for collaborative entries, nonempty localized values, valid graph edges, media dimensions/alt rules, and safe link states.

Seed states exactly as follows:

- Formula1: `collaborative`, featured order 1, demo `unverified` until the deployed API is checked.
- SGCI-app: `collaborative`, featured order 2, demo `source-only`.
- Kinetic Systems Lab: `individual`, featured order 3, status `in-progress`, no invented metrics.
- Proyecto MySQL: archive order 1 and focused data/SQL evidence.
- FacturaWeb-Lit: archive order 2, repository available, demo `unverified` and therefore rendered as source only until verified.
- Event Mobile App: visibility `hidden`; retain the curated record but do not render it at launch.

The public copy must describe repository-observable behavior only. Put evidence notes in a non-rendered `evidenceNotes` field.

Extend the failing tests to assert exactly six project records, only three featured records, two visible archive records, Event Mobile App excluded from launch queries, the four ordered experience records, and rejection of missing type/status/link/media/alt fields.

- [ ] **Step 4: Verify GREEN and build-time loading**

```powershell
npm test -- tests/unit/content-integrity.test.ts
npm run check
npm run build
```

Expected: integrity tests pass and Astro loads both collections without schema errors.

- [ ] **Step 5: Commit**

```powershell
git add src/content.config.ts src/content src/lib/projects.ts src/lib/content-integrity.ts tests/unit/content-integrity.test.ts
git commit -m "feat: add verified project content model"
```

### Task 4: Implement visual tokens, base layout, and theme behavior

**Files:**

- Create: `src/styles/tokens.css`
- Create: `src/styles/reset.css`
- Create: `src/styles/global.css`
- Create: `src/styles/utilities.css`
- Create: `src/lib/theme.ts`
- Create: `src/config/site.ts`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/layout/SiteShell.astro`
- Create: `src/components/ui/ThemeControl.tsx`
- Create: `src/components/ui/LocaleLinks.astro`
- Create: `src/components/ui/SystemLabel.astro`
- Test: `tests/unit/theme.test.ts`
- Test: `tests/components/ThemeControl.test.tsx`

- [ ] **Step 1: Write failing theme tests**

```ts
import { describe, expect, it } from 'vitest';
import { resolveInitialTheme } from '../../src/lib/theme';

describe('theme resolution', () => {
  it('prefers saved theme over the operating system', () => expect(resolveInitialTheme('light', true)).toBe('light'));
  it('uses the system preference when nothing is saved', () => expect(resolveInitialTheme(null, true)).toBe('dark'));
  it('uses a light system preference', () => expect(resolveInitialTheme(null, false)).toBe('light'));
  it('defaults to dark only when the system preference is unavailable', () => expect(resolveInitialTheme(null, null)).toBe('dark'));
});
```

Use Testing Library to assert the control exposes one accessible button, updates `data-theme`, stores the value, and changes its localized accessible name.

- [ ] **Step 2: Run tests and verify RED**

```powershell
npm test -- tests/unit/theme.test.ts tests/components/ThemeControl.test.tsx
```

Expected: FAIL because theme code does not exist.

- [ ] **Step 3: Implement tokens and theme bootstrap**

Use exact root tokens:

```css
@layer reset, tokens, base, components, utilities;

@layer tokens {
  :root {
    --font-sans: "Instrument Sans Variable", system-ui, sans-serif;
    --font-mono: "DM Mono", ui-monospace, monospace;
    --color-bg: #05070a;
    --color-panel: #0b0f15;
    --color-primary: #6077ff;
    --color-signal: #58f9a1;
    --color-text: #f4f6f8;
    --color-muted: #9098a8;
    --focus-ring: 0 0 0 3px color-mix(in srgb, var(--color-signal), transparent 35%);
  }

  :root[data-theme="light"] {
    --color-bg: #eeece5;
    --color-panel: #e4e1d9;
    --color-primary: #4059ef;
    --color-signal: #087352;
    --color-text: #101216;
    --color-muted: #666b76;
  }
}
```

The inline bootstrap in `BaseLayout.astro` runs before external styles, reads only `localStorage.theme` and `matchMedia('(prefers-color-scheme: dark)')`, catches storage errors, and sets `document.documentElement.dataset.theme`.

- [ ] **Step 4: Implement metadata inputs and locale links**

`BaseLayout` must require `locale`, `title`, `description`, `canonicalPath`, and `alternatePath`; render `<html lang>`, self-canonical, `en`, `es`, and `x-default` alternates; and import self-hosted fonts plus the four style layers.

`SiteShell.astro` owns only the decorative grid/background and a default `<slot />`; it contains no content data or interaction state.

- [ ] **Step 5: Verify and commit**

```powershell
npm test -- tests/unit/theme.test.ts tests/components/ThemeControl.test.tsx
npm run check
npm run build
git add src/styles src/lib/theme.ts src/config/site.ts src/layouts/BaseLayout.astro src/components/layout src/components/ui tests/unit/theme.test.ts tests/components/ThemeControl.test.tsx
git commit -m "feat: establish Kinetic visual system"
```

### Task 5: Build the accessible HUD and static bilingual homepage

**Files:**

- Create: `src/components/layout/HudNavigation.astro`
- Create: `src/components/layout/Footer.astro`
- Create: `src/components/hero/HeroCopy.astro`
- Create: `src/components/hero/HeroFallback.astro`
- Create: `src/components/profile/SignalTrail.astro`
- Create: `src/components/capabilities/CapabilityList.astro`
- Create: `src/components/contact/ContactSection.astro`
- Create: `src/components/work/SelectedWork.astro`
- Create: `src/components/work/ProjectChapter.astro`
- Modify: `src/pages/index.astro`
- Create: `src/pages/es/index.astro`
- Create: `playwright.config.ts`
- Test: `tests/e2e/home-routes.spec.ts`
- Test: `tests/e2e/hud.spec.ts`

- [ ] **Step 1: Configure Playwright and write failing route tests**

Use a `webServer` command of `npm run dev -- --host 127.0.0.1 --port 4321` and `baseURL: 'http://127.0.0.1:4321'`.

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://127.0.0.1:4321', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4321',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

```ts
import { expect, test } from '@playwright/test';

for (const item of [
  { path: '/', lang: 'en', heading: 'Engineering interfaces for real systems.' },
  { path: '/es/', lang: 'es', heading: 'Creo interfaces para sistemas reales.' },
]) {
  test(`${item.path} renders the complete static home`, async ({ page }) => {
    await page.goto(item.path);
    await expect(page.locator('html')).toHaveAttribute('lang', item.lang);
    await expect(page.getByRole('heading', { level: 1, name: item.heading })).toBeVisible();
    await expect(page.locator('#selected-work')).toBeVisible();
    await expect(page.locator('#capabilities')).toBeVisible();
    await expect(page.locator('#signal-trail')).toBeVisible();
    await expect(page.locator('#contact')).toBeVisible();
    await expect(page.locator('[data-hero-fallback]')).toBeVisible();
  });
}
```

- [ ] **Step 2: Run tests and verify RED**

```powershell
npx playwright install chromium
npm run test:e2e -- tests/e2e/home-routes.spec.ts tests/e2e/hud.spec.ts --project=chromium
```

Expected: FAIL because localized homepage modules and HUD do not exist.

- [ ] **Step 3: Implement the static homepage**

Render modules in this exact order:

```astro
<SiteShell>
  <HudNavigation locale={locale} />
  <main id="main-content">
    <section id="system-core"><HeroCopy locale={locale} /><HeroFallback /></section>
    <SelectedWork locale={locale} projects={featuredProjects} />
    <section id="capabilities"><CapabilityList locale={locale} projects={featuredProjects} /></section>
    <SignalTrail locale={locale} entries={experienceEntries} />
    <ContactSection locale={locale} />
  </main>
  <Footer locale={locale} />
</SiteShell>
```

The fallback is CSS/SVG artwork using the approved core, silhouette, grid, and nodes; it has `aria-hidden="true"` and no network dependency. `SelectedWork` and `ProjectChapter` initially render the three semantic vertical chapters from content data; Task 6 adds indexes, case layouts, diagrams, and richer media. The contact section is initially a semantic form shell; Task 12 adds submission behavior.

- [ ] **Step 4: Implement HUD behavior without a navigation SPA**

Use real anchors and locale links. Mobile navigation uses `<details>`/`<summary>` with a localized accessible label, 44 px targets, visible focus, and automatic close after an anchor click using a tiny inline script. Include a skip link to `#main-content`.

- [ ] **Step 5: Verify and commit**

```powershell
npm run test:e2e -- tests/e2e/home-routes.spec.ts tests/e2e/hud.spec.ts --project=chromium
npm run check
git add playwright.config.ts src/pages src/components/layout src/components/hero/HeroCopy.astro src/components/hero/HeroFallback.astro src/components/profile src/components/capabilities/CapabilityList.astro src/components/contact/ContactSection.astro src/components/work/SelectedWork.astro src/components/work/ProjectChapter.astro tests/e2e/home-routes.spec.ts tests/e2e/hud.spec.ts
git commit -m "feat: build bilingual Kinetic homepage"
```

### Task 6: Build Selected Work indexes and localized case studies

**Files:**

- Modify: `src/components/work/SelectedWork.astro`
- Modify: `src/components/work/ProjectChapter.astro`
- Create: `src/components/work/ArchitectureMap.astro`
- Create: `src/components/work/ProjectIdentityFallback.astro`
- Create: `src/layouts/CaseStudyLayout.astro`
- Create: `src/pages/work/index.astro`
- Create: `src/pages/work/[slug].astro`
- Create: `src/pages/es/proyectos/index.astro`
- Create: `src/pages/es/proyectos/[slug].astro`
- Test: `tests/e2e/work-routes.spec.ts`

- [ ] **Step 1: Write failing route and evidence tests**

Test all eight localized routes: two indexes plus three English and three Spanish cases. Assert Formula1 and SGCI display `Collaborative project`, no unavailable demo has an anchor, repository links use `rel="noopener noreferrer"`, and every case exposes problem, contribution, architecture, decisions, outcome, and technologies. The indexes also render Proyecto MySQL and FacturaWeb-Lit in a secondary archive with explicit source/availability states, while Event Mobile App is absent from launch HTML and has no generated route.

- [ ] **Step 2: Verify RED**

```powershell
npm run test:e2e -- tests/e2e/work-routes.spec.ts --project=chromium
```

Expected: FAIL with missing work routes.

- [ ] **Step 3: Implement static route generation**

Both `[slug].astro` files use `getStaticPaths()` over the validated featured collection:

```ts
export async function getStaticPaths() {
  const projects = await getFeaturedProjects();
  return projects.map((project) => ({ params: { slug: project.data.slug }, props: { project } }));
}
```

`ArchitectureMap` renders a semantic ordered list plus a decorative `aria-hidden` SVG. `ProjectChapter` exposes demo anchors only when `demo.state === 'available'`; otherwise it renders localized `Source only` text.

- [ ] **Step 4: Add responsive project identity media**

Move the Formula1 evidence image to `src/assets/projects/formula1/hero.png` and optimize it through Astro's `<Image>`. Use designed CSS/SVG identity fallbacks for SGCI and Kinetic rather than enlarging the 181×94 SGCI image. All media has explicit dimensions and localized alt text.

- [ ] **Step 5: Verify and commit**

```powershell
npm run test:e2e -- tests/e2e/work-routes.spec.ts --project=chromium
npm run build
git add src/components/work src/layouts/CaseStudyLayout.astro src/pages/work src/pages/es/proyectos src/assets/projects tests/e2e/work-routes.spec.ts
git commit -m "feat: add evidence-led project case studies"
```

## Phase B — Adaptive 3D and purposeful interaction

### Task 7: Build a reproducible avatar optimization pipeline

**Files:**

- Create: `scripts/optimize-avatar.mjs`
- Create: `scripts/check-model-budgets.mjs`
- Create: `tests/unit/avatar-models.test.ts`
- Generate: `public/models/avatar-full.glb`
- Generate: `public/models/avatar-light.glb`
- Create: `docs/assets/avatar-provenance.md`
- Modify: `package.json`

- [ ] **Step 1: Write the failing model budget test**

The test calls a pure `readModelReport(path)` exported from `scripts/check-model-budgets.mjs` and asserts:

```ts
expect(full.bytes).toBeLessThanOrEqual(4 * 1024 * 1024);
expect(full.triangles).toBeLessThanOrEqual(250_000);
expect(full.maxTextureDimension).toBeLessThanOrEqual(1024);
expect(light.bytes).toBeLessThanOrEqual(1.5 * 1024 * 1024);
expect(light.triangles).toBeLessThanOrEqual(75_000);
expect(light.maxTextureDimension).toBeLessThanOrEqual(512);
```

The same test asserts that the source and both outputs each contain one scene, one mesh, and one material, and that the source report records exactly 632,738 triangles before simplification.

- [ ] **Step 2: Verify RED against the missing outputs**

```powershell
npm test -- tests/unit/avatar-models.test.ts
```

Expected: FAIL because optimized outputs do not exist.

- [ ] **Step 3: Implement the pipeline**

Use glTF Transform's Node API or child-process CLI to run a deterministic pipeline:

```text
source GLB -> weld -> simplify -> prune -> dedup -> WebP texture -> Meshopt -> output
```

The inspected source baseline is one scene, one mesh, one material, and 632,738 triangles. Use fixed simplification settings: Full ratio `0.38`, error `0.001`, texture cap 1024; Light ratio `0.11`, error `0.001`, texture cap 512. Record the exact command/options and source SHA-256 in the provenance file. Abort unless each output still has exactly one scene, one mesh, and one material, and abort when the measured triangle or byte budgets are missed. Preserve the original source file.

Record that the source asset already belongs to this portfolio and that the user explicitly requested its continued use in `docs/assets/avatar-provenance.md`; do not copy model material from another repository or marketplace into the optimized outputs.

Add scripts:

```json
{
  "assets:avatar": "node scripts/optimize-avatar.mjs",
  "check:models": "node scripts/check-model-budgets.mjs"
}
```

- [ ] **Step 4: Verify size, structure, and appearance**

```powershell
npm run assets:avatar
npm run check:models
npm test -- tests/unit/avatar-models.test.ts
```

Open both models in a local Three.js preview and confirm silhouette, material orientation, and facial/body readability before committing. If budget compliance destroys the silhouette, keep the test red and obtain an explicit budget/design exception instead of silently weakening it.

- [ ] **Step 5: Commit**

```powershell
git add scripts/optimize-avatar.mjs scripts/check-model-budgets.mjs tests/unit/avatar-models.test.ts public/models docs/assets/avatar-provenance.md package.json package-lock.json
git commit -m "perf: add optimized avatar quality tiers"
```

### Task 8: Implement deterministic adaptive quality selection

**Files:**

- Create: `src/lib/quality-tier.ts`
- Create: `src/lib/hero-upgrade.ts`
- Create: `src/components/hero/useHeroQuality.ts`
- Test: `tests/unit/quality-tier.test.ts`
- Test: `tests/unit/hero-upgrade.test.ts`
- Test: `tests/components/use-hero-quality.test.tsx`

- [ ] **Step 1: Write failing policy tests**

In `hero-upgrade.test.ts`, describe the progressive machine before implementing it: Light always loads first, four stable samples cannot promote, the fifth stable sample requests Full, Full readiness enables effects, and errors/restrictions make `static` terminal.

```ts
import { describe, expect, it } from 'vitest';
import { selectQualityTier } from '../../src/lib/quality-tier';

describe('hero quality policy', () => {
  it.each([
    { reducedMotion: true, saveData: false, webgl: true },
    { reducedMotion: false, saveData: true, webgl: true },
    { reducedMotion: false, saveData: false, webgl: false },
  ])('selects static for explicit restrictions', (signals) => {
    expect(selectQualityTier({ ...signals, coarsePointer: false, lowPower: false, regressions: 0 })).toBe('static');
  });

  it('selects balanced for coarse or low-power devices', () => {
    expect(selectQualityTier({ reducedMotion: false, saveData: false, webgl: true, coarsePointer: true, lowPower: false, regressions: 0 })).toBe('balanced');
  });

  it('locks static after three regressions', () => {
    expect(selectQualityTier({ reducedMotion: false, saveData: false, webgl: true, coarsePointer: false, lowPower: false, regressions: 3 })).toBe('static');
  });
});
```

- [ ] **Step 2: Verify RED**

```powershell
npm test -- tests/unit/quality-tier.test.ts tests/unit/hero-upgrade.test.ts tests/components/use-hero-quality.test.tsx
```

- [ ] **Step 3: Implement tier outputs and listener cleanup**

Return the complete settings object:

```ts
export const QUALITY_SETTINGS = {
  full: { dpr: [1, 1.75] as const, particles: 120, shadows: true, bloom: true, initialModel: '/models/avatar-light.glb', enhancedModel: '/models/avatar-full.glb' },
  balanced: { dpr: [0.75, 1.25] as const, particles: 40, shadows: false, bloom: false, initialModel: '/models/avatar-light.glb', enhancedModel: null },
  static: { dpr: [1, 1] as const, particles: 0, shadows: false, bloom: false, initialModel: null, enhancedModel: null },
} as const;
```

The hook listens to reduced motion, coarse pointer, save-data, WebGL context, and R3F performance regressions; removes every listener on unmount; and allows degradation only `full → balanced → static`.

Implement and test a pure progressive model machine with states `poster → light-loading → light-ready → full-loading → full-ready`, plus terminal `static`. Only a target Full tier can leave `light-ready`, and only after five consecutive stable `PerformanceMonitor` samples with factor ≥0.7. A failed load, context loss, explicit restriction, or three regressions moves to `static`; a degraded tier never promotes again during that mount. Tests cover every legal transition and assert illegal early/full reload transitions are ignored.

- [ ] **Step 4: Verify and commit**

```powershell
npm test -- tests/unit/quality-tier.test.ts tests/unit/hero-upgrade.test.ts tests/components/use-hero-quality.test.tsx
git add src/lib/quality-tier.ts src/lib/hero-upgrade.ts src/components/hero/useHeroQuality.ts tests/unit/quality-tier.test.ts tests/unit/hero-upgrade.test.ts tests/components/use-hero-quality.test.tsx
git commit -m "feat: add adaptive 3D quality policy"
```

### Task 9: Implement the resilient R3F HeroExperience

**Files:**

- Create: `src/components/hero/HeroExperience.tsx`
- Create: `src/components/hero/HeroErrorBoundary.tsx`
- Create: `src/components/hero/HeroScene.tsx`
- Create: `src/components/hero/AvatarModel.tsx`
- Create: `src/components/hero/TopologyField.tsx`
- Create: `src/components/hero/useHeroHandoff.ts`
- Create: `src/lib/hero-motion.ts`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/es/index.astro`
- Test: `tests/components/hero-experience.test.tsx`
- Test: `tests/unit/hero-motion.test.ts`
- Test: `tests/e2e/hero-modes.spec.ts`

- [ ] **Step 1: Write failing fallback and lifecycle tests**

Testing Library must assert that static tier renders no Canvas, thrown scene/model errors preserve `[data-hero-fallback]`, and the fallback remains until a `first-frame` callback. Unit tests assert reduced motion creates no GSAP timeline.

Add promotion tests that start with the Light GLB even for a target Full tier, hold at `light-ready` for fewer than five stable samples, request the complete GLB only on the fifth, and never enable bloom before `full-ready`.

- [ ] **Step 2: Verify RED**

```powershell
npm test -- tests/components/hero-experience.test.tsx tests/unit/hero-motion.test.ts
npm run test:e2e -- tests/e2e/hero-modes.spec.ts --project=chromium
```

- [ ] **Step 3: Implement the island and scene contract**

`HeroExperience` mounts with `client:idle` over the existing poster. Use:

```tsx
<Canvas
  dpr={settings.dpr}
  frameloop={active ? 'always' : 'demand'}
  shadows={settings.shadows}
  gl={{ antialias: tier === 'full', alpha: true, powerPreference: tier === 'full' ? 'high-performance' : 'default' }}
  onCreated={({ gl }) => gl.domElement.setAttribute('data-canvas-ready', 'true')}
>
  <Suspense fallback={null}>
    <HeroScene settings={settings} progress={progressRef} onFirstFrame={markReady} />
  </Suspense>
</Canvas>
```

The scene contains the optimized avatar, cool key/fill/violet rim lights, instanced topology nodes, bounded pointer parallax, fog, and a restrained `Bloom` from `@react-three/postprocessing` only after the model machine reaches `full-ready`. It exposes `data-quality-tier`, `data-model-phase`, and `data-render-state` for diagnostics without rendering technical debug copy to visitors.

- [ ] **Step 4: Implement error and context-loss fallback**

React errors, loader rejection, shader/init failure, `webglcontextlost`, and three sustained regressions unmount Canvas and reveal the unchanged poster/CTA. Full loads only after Light renders and `PerformanceMonitor` stays stable.

- [ ] **Step 5: Implement GSAP camera handoff**

Use `gsap.matchMedia()` and `gsap.context()`; update a mutable `progressRef` from 0 to 1. Do not use `pin`, `snap`, `normalizeScroll`, wheel handlers, or Lenis. Revert the context on unmount. R3F reads progress without React state updates per frame.

- [ ] **Step 6: Verify and commit**

```powershell
npm test -- tests/components/hero-experience.test.tsx tests/unit/hero-motion.test.ts
npm run test:e2e -- tests/e2e/hero-modes.spec.ts --project=chromium
npm run check
git add src/components/hero src/lib/hero-motion.ts src/pages/index.astro src/pages/es/index.astro tests/components/hero-experience.test.tsx tests/unit/hero-motion.test.ts tests/e2e/hero-modes.spec.ts
git commit -m "feat: turn avatar into adaptive hero experience"
```

### Task 10: Add the native-scroll Selected Work track

**Files:**

- Create: `src/lib/selected-work-track.ts`
- Modify: `src/components/work/SelectedWork.astro`
- Modify: `src/components/work/ProjectChapter.astro`
- Test: `tests/unit/selected-work-track.test.ts`
- Test: `tests/e2e/selected-work.spec.ts`

- [ ] **Step 1: Write failing activation and geometry tests**

Test that activation requires width ≥1100, fine pointer, and motion allowed; three chapters produce two transition viewports plus entrance/exit; reduced motion/mobile return vertical mode; focus synchronization maps chapter index to a native vertical target.

- [ ] **Step 2: Verify RED**

```powershell
npm test -- tests/unit/selected-work-track.test.ts
npm run test:e2e -- tests/e2e/selected-work.spec.ts --project=chromium
```

- [ ] **Step 3: Implement bounded sticky behavior**

Use CSS sticky positioning and GSAP ScrollTrigger only to transform the track. Never register `wheel`, `touchmove`, or key handlers. Keep DOM order Formula1 → SGCI-app → Kinetic Systems Lab. A focused off-screen chapter calls native `window.scrollTo({ behavior: reduced ? 'auto' : 'smooth' })` to the computed vertical equivalent.

- [ ] **Step 4: Verify no trap and commit**

```powershell
npm test -- tests/unit/selected-work-track.test.ts
npm run test:e2e -- tests/e2e/selected-work.spec.ts --project=chromium
git add src/lib/selected-work-track.ts src/components/work tests/unit/selected-work-track.test.ts tests/e2e/selected-work.spec.ts
git commit -m "feat: add native-scroll project narrative"
```

### Task 11: Add the accessible CapabilityGraph island

**Files:**

- Create: `src/lib/capabilities.ts`
- Create: `src/components/capabilities/CapabilityGraph.tsx`
- Modify: `src/components/capabilities/CapabilityList.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/es/index.astro`
- Test: `tests/unit/capabilities.test.ts`
- Test: `tests/components/capability-graph.test.tsx`
- Test: `tests/e2e/capability-graph.spec.ts`

- [ ] **Step 1: Write failing semantic parity tests**

Normalize each relation to `{ domainId, technologyId, projectSlug }` and assert that list and graph projections contain identical sorted sets. Component tests cover `aria-pressed`, arrow keys, Home/End, Enter, Space, localized results, and selection indicated by text plus shape—not color alone.

- [ ] **Step 2: Verify RED**

```powershell
npm test -- tests/unit/capabilities.test.ts tests/components/capability-graph.test.tsx
npm run test:e2e -- tests/e2e/capability-graph.spec.ts --project=chromium
```

- [ ] **Step 3: Implement one shared projection**

`CapabilityList.astro` always renders grouped semantic HTML. `CapabilityGraph.tsx` receives that same normalized projection, renders an `aria-hidden` SVG, and writes selection/results into normal HTML. On mobile, the graph lives inside a localized `<details>` and the list remains primary.

Mount the graph from both home routes with `client:visible`; its semantic list remains server-rendered and authoritative before hydration or when JavaScript is unavailable.

- [ ] **Step 4: Verify and commit**

```powershell
npm test -- tests/unit/capabilities.test.ts tests/components/capability-graph.test.tsx
npm run test:e2e -- tests/e2e/capability-graph.spec.ts --project=chromium
git add src/lib/capabilities.ts src/components/capabilities src/pages/index.astro src/pages/es/index.astro tests/unit/capabilities.test.ts tests/components/capability-graph.test.tsx tests/e2e/capability-graph.spec.ts
git commit -m "feat: connect capabilities to project evidence"
```

## Phase C — Contact, SEO, accessibility, budgets, and deployment

### Task 12: Implement the Formspree contact flow and recoverable states

**Files:**

- Create: `src/lib/contact.ts`
- Create: `src/components/contact/ContactForm.tsx`
- Modify: `src/components/contact/ContactSection.astro`
- Modify: `src/i18n/en.ts`
- Modify: `src/i18n/es.ts`
- Modify: `src/i18n/schema.ts`
- Test: `tests/unit/contact.test.ts`
- Test: `tests/components/ContactForm.test.tsx`
- Test: `tests/e2e/contact.spec.ts`

- [ ] **Step 1: Write failing validation and request tests**

Use exact constraints: name 2–80, email valid and ≤254, message 20–2000, 10-second timeout. Test `429`, provider error, offline, timeout, unknown error, success focus, values retained on failure, and only submit disabled while pending.

- [ ] **Step 2: Verify RED**

```powershell
npm test -- tests/unit/contact.test.ts tests/components/ContactForm.test.tsx
npm run test:e2e -- tests/e2e/contact.spec.ts --project=chromium
```

- [ ] **Step 3: Implement pure contact functions**

```ts
export type ContactPayload = { name: string; email: string; message: string; _gotcha: string };
export type ContactResult = { ok: true } | { ok: false; reason: 'validation' | 'offline' | 'timeout' | 'rate-limit' | 'provider' | 'unknown' };

export async function submitContact(formId: string, payload: ContactPayload, signal: AbortSignal): Promise<ContactResult> {
  const response = await fetch(`https://formspree.io/f/${formId}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  if (response.ok) return { ok: true };
  if (response.status === 429) return { ok: false, reason: 'rate-limit' };
  return { ok: false, reason: 'provider' };
}
```

Wrap with online and timeout handling. The component uses visible labels, `aria-invalid`, `aria-describedby`, `role="status"`, and focus management.

Add an off-screen `_gotcha` honeypot field with `name="_gotcha"`, `tabIndex={-1}`, and `autoComplete="off"`; include it in the submitted JSON so Formspree can apply its provider-side spam controls. Component and intercepted-network tests assert the field is serialized while legitimate submissions keep it empty.

`ContactSection.astro` keeps the heading and direct contact alternatives in static HTML, then mounts `ContactForm.tsx` with `client:visible` and the localized dictionary. Read `PUBLIC_FORMSPREE_FORM_ID` through `import.meta.env`; a missing identifier disables submission with a localized configuration state instead of constructing an invalid endpoint.

- [ ] **Step 4: Verify with intercepted network and commit**

Playwright intercepts `**/formspree.io/f/**`; tests must never transmit a real message.

```powershell
npm test -- tests/unit/contact.test.ts tests/components/ContactForm.test.tsx
npm run test:e2e -- tests/e2e/contact.spec.ts --project=chromium
git add src/lib/contact.ts src/components/contact src/i18n tests/unit/contact.test.ts tests/components/ContactForm.test.tsx tests/e2e/contact.spec.ts
git commit -m "feat: add resilient contact channel"
```

### Task 13: Add complete localized SEO, structured data, social previews, and 404

**Files:**

- Create: `src/lib/seo.ts`
- Create: `src/components/seo/SeoHead.astro`
- Create: `src/components/seo/JsonLd.astro`
- Create: `src/components/errors/NotFound.astro`
- Create: `src/pages/404.astro`
- Create: `public/robots.txt`
- Create: `public/social/home-en.webp`
- Create: `public/social/home-es.webp`
- Create: `public/social/work-en.webp`
- Create: `public/social/work-es.webp`
- Create: project social previews for Formula1, SGCI-app, and Kinetic Systems Lab in both locales
- Create: `scripts/generate-social-previews.mjs`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/layouts/CaseStudyLayout.astro`
- Test: `tests/unit/seo.test.ts`
- Test: `tests/e2e/seo-locales.spec.ts`
- Test: `tests/e2e/not-found.spec.ts`

- [ ] **Step 1: Write failing canonical and JSON-LD tests**

Test self-canonical URLs, `en`/`es`/`x-default` reciprocal alternates, localized OG/Twitter metadata, Person+WebSite JSON-LD on home, CreativeWork on cases, SoftwareSourceCode only when a public repository is enabled, and `noindex` on 404.

- [ ] **Step 2: Verify RED**

```powershell
npm test -- tests/unit/seo.test.ts
npm run test:e2e -- tests/e2e/seo-locales.spec.ts tests/e2e/not-found.spec.ts --project=chromium
```

- [ ] **Step 3: Implement metadata and previews**

`buildSeo()` returns absolute canonical/alternate/social URLs from `SITE.url = 'https://juanfrxz.dev'`. `scripts/generate-social-previews.mjs` builds an SVG string from the approved Kinetic grid, wordmark, localized heading, and theme tokens, then converts it with Sharp to 1200×630 WebP at quality 84. Each result must be ≤300 KB and contain no third-party trademark artwork. Add `"assets:social": "node scripts/generate-social-previews.mjs"` and run it before the build.

The single static 404 document includes both language blocks. A pre-paint inline script checks `location.pathname.startsWith('/es/')`, sets `<html lang>` accordingly, and reveals only the matching block without redirecting. With JavaScript disabled, the English block and direct English/Spanish home links remain usable.

- [ ] **Step 4: Verify build output and commit**

```powershell
npm test -- tests/unit/seo.test.ts
npm run build
npm run test:e2e -- tests/e2e/seo-locales.spec.ts tests/e2e/not-found.spec.ts --project=chromium
git add src/lib/seo.ts src/components/seo src/components/errors src/pages/404.astro public/robots.txt public/social scripts/generate-social-previews.mjs src/layouts package.json tests/unit/seo.test.ts tests/e2e/seo-locales.spec.ts tests/e2e/not-found.spec.ts
git commit -m "feat: add localized portfolio discovery metadata"
```

### Task 14: Enforce content, link, environment, and bundle budgets

**Files:**

- Create: `scripts/lib/build-audit.ts`
- Create: `scripts/validate-build.ts`
- Create: `scripts/check-external-links.ts`
- Create: `scripts/check-bundle-budgets.ts`
- Create: `scripts/check-production-env.ts`
- Test: `tests/unit/build-audit.test.ts`
- Test: `tests/unit/bundle-budgets.test.ts`
- Test: `tests/unit/i18n-parity.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing audit tests**

Fixtures must fail for missing assets, broken reciprocal `hreflang`, two `h1` elements, wrong `html[lang]`, invalid JSON-LD, unsafe blank targets, unavailable demos with hrefs, oversized assets, initial non-3D JS >90 KB gzip, and deferred hero JS >350 KB gzip.

- [ ] **Step 2: Verify RED**

```powershell
npm test -- tests/unit/build-audit.test.ts tests/unit/bundle-budgets.test.ts tests/unit/i18n-parity.test.ts
```

- [ ] **Step 3: Implement build and production checks**

Add scripts:

```json
{
  "validate:build": "tsx scripts/validate-build.ts",
  "validate:links": "tsx scripts/check-external-links.ts",
  "check:budgets": "tsx scripts/check-bundle-budgets.ts",
  "check:production-env": "node scripts/check-production-env.ts",
  "verify": "npm run format:check && npm run check && npm test && npm run build && npm run validate:build && npm run validate:links && npm run check:models && npm run check:budgets"
}
```

External links use HEAD, GET fallback, 10-second timeout, and two retries. A demo explicitly marked unavailable is skipped and must render without an href. `DEPLOY_TARGET=production` fails when `PUBLIC_FORMSPREE_FORM_ID` is absent or equals `test-form-id`.

- [ ] **Step 4: Verify and commit**

```powershell
npm test -- tests/unit/build-audit.test.ts tests/unit/bundle-budgets.test.ts tests/unit/i18n-parity.test.ts
npm run build
npm run validate:build
npm run validate:links
npm run check:models
npm run check:budgets
git add scripts package.json tests/unit/build-audit.test.ts tests/unit/bundle-budgets.test.ts tests/unit/i18n-parity.test.ts
git commit -m "test: enforce portfolio production budgets"
```

### Task 15: Complete the cross-browser, accessibility, and performance matrix

**Files:**

- Modify: `playwright.config.ts`
- Create: `tests/e2e/core/routes-locales.spec.ts`
- Create: `tests/e2e/core/theme.spec.ts`
- Create: `tests/e2e/core/static-fallback.spec.ts`
- Create: `tests/e2e/chromium/responsive-navigation.spec.ts`
- Create: `tests/e2e/chromium/keyboard-focus.spec.ts`
- Create: `tests/e2e/chromium/interactive-modes.spec.ts`
- Create: `tests/e2e/chromium/visual-regression.spec.ts`
- Create: `tests/e2e/chromium/interaction-performance.spec.ts`
- Create: `tests/e2e/accessibility/axe.spec.ts`
- Create: `lighthouserc.cjs`
- Create: `performance-budgets.json`
- Create: `docs/verification/2026-07-13-release-checklist.md`

- [ ] **Step 1: Add failing browser matrix tests**

Core tests run in Chromium, Firefox, and WebKit. Chromium-specific tests cover full interactions and visual states. `visual-regression.spec.ts` uses `toHaveScreenshot()` for desktop and mobile home plus one case in both themes, with animations disabled and deterministic static/Light hero modes. `interaction-performance.spec.ts` records click/keyboard response and fails when the synthetic interaction duration exceeds 200 ms. Axe runs home, work, and three cases × two locales × two themes. JavaScript-disabled tests must still expose hero, CTA, projects, capability list, and contact details. The theme test injects a stored preference before navigation and asserts the first observed document state already matches it, preventing a light/dark flash regression.

- [ ] **Step 2: Run the matrix and capture RED evidence**

```powershell
npx playwright install chromium firefox webkit
npm run test:e2e
npm run test:a11y
```

Expected: at least the new accessibility/performance assertions fail before final fixes.

- [ ] **Step 3: Fix only observed failures**

Address concrete keyboard, contrast, target-size, focus, landmark, overflow, fallback, or localization defects revealed by the tests. Do not lower axe rules, hide violations, or broaden timeouts to mask failures.

- [ ] **Step 4: Configure Lighthouse CI**

Configure `lighthouserc.cjs` with `collect.staticDistDir = './dist'`, three runs, and the built `/`, `/work/`, and `/es/` URLs. Use mobile emulation at 412×915, DPR 2.625, CPU 4×, RTT 150 ms, 1.6 Mbps down, and 750 Kbps up. Assert categories performance ≥0.90, accessibility 1.0, best-practices 1.0, SEO 1.0, plus `largest-contentful-paint` ≤2500 ms and `cumulative-layout-shift` ≤0.1; write reports to `.lighthouseci/` without public upload. Lighthouse does not substitute for INP: the automated 200 ms interaction gate and the recorded physical-device check cover that budget.

- [ ] **Step 5: Complete manual checks and commit**

Record keyboard, NVDA+Chrome, 200% zoom, reduced motion, Windows forced colors, coarse pointer, data saver, both themes/locales, and Pixel 7-class 10-second frame test in the release checklist.

```powershell
npm run test:e2e
npm run test:a11y
npx lhci autorun
git add playwright.config.ts tests/e2e lighthouserc.cjs performance-budgets.json docs/verification/2026-07-13-release-checklist.md
git commit -m "test: verify accessible responsive experience"
```

### Task 16: Replace deployment with gated GitHub Pages delivery

**Files:**

- Replace: `.github/workflows/deploy.yml`
- Modify: `README.md`
- Modify: `.gitignore`
- Test: `tests/unit/workflow-contract.test.ts`

- [ ] **Step 1: Write a failing workflow contract test**

Parse the YAML text and assert Node 24, `npm ci`, `npm run verify`, production environment check, Pages permissions, `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`, and `dist/CNAME` verification are present. Assert `JamesIves/github-pages-deploy-action` and `@v2` actions are absent.

- [ ] **Step 2: Verify RED**

```powershell
npm test -- tests/unit/workflow-contract.test.ts
```

- [ ] **Step 3: Implement the gated workflow**

PR job: checkout → Node 24 with npm cache → `npm ci` → format/check/unit/build/validators → Playwright/axe → Lighthouse. Main deploy job uses environment `github-pages`, `PUBLIC_FORMSPREE_FORM_ID`, `DEPLOY_TARGET=production`, Pages permissions, artifact upload, and Pages deploy.

- [ ] **Step 4: Document setup and verify**

README documents Node requirement, commands, content workflow, Formspree environment variable, GitHub Pages Actions source, custom domain, and project evidence policy.

```powershell
npm test -- tests/unit/workflow-contract.test.ts
npm run verify
git add .github/workflows/deploy.yml README.md .gitignore tests/unit/workflow-contract.test.ts
git commit -m "ci: gate and deploy Astro portfolio"
```

### Task 17: Remove the legacy frontend and run final release verification

**Files:**

- Delete: `index.html`
- Delete: `vite.config.js`
- Delete: `assets/js/`
- Delete: `assets/css/`
- Delete: `assets/scss/`
- Delete: `assets/languages/`
- Delete: `public/vite.svg`
- Move or delete only after migration: remaining `assets/img/`, `assets/icons/`, `assets/pdf/`
- Modify: `src/content/projects/kinetic-systems-lab.json`
- Modify: `docs/verification/2026-07-13-release-checklist.md`

- [ ] **Step 1: Prove every legacy asset has a replacement**

Run:

```powershell
rg -n "assets/(js|css|scss|languages|img|icons|pdf)|vite\.svg|mailto:|particles\.js|scrollreveal|i18next|driver\.js|unpkg|cdnjs|jsdelivr|googleapis" src public
```

Expected before cleanup: only intentional source migrations remain. Move any still-required CV/media to stable `public/files` or `src/assets` paths and update references before deleting.

- [ ] **Step 2: Delete legacy files with Git-aware operations**

Use `git rm` only for tracked legacy files verified by Step 1. Keep `assets/models/avatar_programador.glb` as the source asset unless the final repository policy moves it to a documented source directory.

- [ ] **Step 3: Populate the Kinetic case with measured evidence**

Record actual final bundle sizes, GLB sizes, Lighthouse median, route count, accessibility result, and implemented architecture. Do not add a metric unless its command output is preserved in the release checklist.

- [ ] **Step 4: Run the complete clean-install gate**

```powershell
npm ci
npm run verify
npm run test:e2e
npm run test:a11y
npx lhci autorun
$forbidden = 'mailto:|particles\.js|scrollreveal|i18next|driver\.js|unpkg|cdnjs|jsdelivr|googleapis'
rg -n $forbidden src public
if ($LASTEXITCODE -eq 0) { throw 'Forbidden legacy references remain.' }
if ($LASTEXITCODE -gt 1) { throw "rg failed with exit code $LASTEXITCODE" }
git status --short
```

Expected: install and every verification command exit 0; the inverse assertion accepts `rg` exit 1 only because it means no matches; status shows only the intended final task changes.

- [ ] **Step 5: Perform final visual re-audit**

Inspect desktop and mobile in both themes/locales, compare against approved Kinetic mockups, and record score changes against the 2.4/5 baseline. Fix regressions before committing.

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "feat: complete Kinetic Systems Lab redesign"
```

## Final handoff checks

- [ ] Confirm every task commit exists in order.
- [ ] Confirm `.superpowers/` was never staged.
- [ ] Confirm `BackHackthon` is not linked.
- [ ] Confirm Formspree production ID is configured before deployment.
- [ ] Confirm GitHub Pages uses GitHub Actions and `juanfrxz.dev` remains verified.
- [ ] Confirm one real Formspree submission after deployment; this external side effect requires action-time user confirmation.
- [ ] Push and open a draft PR only when explicitly requested or after presenting the verified local result.
