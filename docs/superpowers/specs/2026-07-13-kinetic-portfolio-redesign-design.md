# Kinetic Systems Lab — Portfolio Redesign Design

**Status:** Approved in conversation

**Date:** 2026-07-13

**Target repository:** `PortafolioWeb`

**Implementation branch:** `codex/kinetic-portfolio-redesign`

## 1. Purpose

Rebuild Juan Rodriguez's portfolio as a distinctive personal-brand experience rather than a decorated résumé. The site must position Juan as a **Creative Full-Stack Developer** who combines frontend craft, backend architecture, data work, and immersive 3D.

The experience should feel like a precise, living technical instrument: memorable at first sight, easy to navigate, truthful about project evidence, and fast enough to remain credible.

### Primary outcome

Build a technical and creative personal brand that makes visitors think: “This developer knows how to create high-level interfaces and can connect them to real systems.”

### Required capabilities

- English and Spanish versions.
- Complete light and dark themes.
- A real contact form with validation and delivery states.
- The existing avatar concept retained and elevated into the central interactive system.
- Responsive, accessible, indexable, and performance-budgeted output.

### Non-goals

- Reproducing the current page section-for-section.
- Preserving the current cards, skill icon wall, particle background, tour, loader, or `mailto:` form.
- Claiming seniority, impact metrics, AI experience, or individual ownership that cannot be verified.
- Adding a CMS, authentication, blog, analytics, custom backend, or admin interface in this redesign.
- Fixing security or deployment problems in external repositories as part of this repository's implementation.

## 2. Current-State Findings

The current site is a Vite-powered static page built from one large `index.html`, global CSS, imperative JavaScript, JSON translations, and raw Three.js loaded through CDNs. The local branch was clean before design artifacts were created.

The redesign must resolve these observed issues:

- Mobile navigation cannot open because JavaScript expects `#nav-toggle`, but the control is absent.
- The CV link resolves to the SPA fallback instead of the real PDF.
- The initial experience waits for a 20.8 MB GLB and other window assets before hiding a blocking loader.
- Several source images are 6–7 MB and have no responsive formats or lazy loading.
- Three.js runs continuously and does not adapt to device capability, viewport visibility, data-saving preferences, or reduced motion.
- Two translation systems mutate the same DOM, and some project translation keys are crossed.
- The project area communicates technologies but not responsibility, architecture, decisions, outcomes, or collaborative authorship.
- SEO metadata, localized URLs, canonical URLs, social previews, structured data, and case-study pages are absent.
- Keyboard focus, accessible names, semantic state, canvas fallback, and reduced-motion behavior are incomplete.
- The effective CSS and the SCSS source have diverged; the HTML and global stylesheet are difficult to maintain.

The existing theme switch, localization concept, deployment automation, domain, avatar, experience data, and project media are useful inputs, but not architectural constraints.

## 3. Creative Direction

The approved direction is **Kinetic Systems Lab**.

### Design principles

1. **Evidence before decoration.** Visual effects reveal technical evidence instead of competing with it.
2. **Energy with restraint.** Motion is noticeable but purposeful; native scrolling remains in control.
3. **A connected system.** Hero, projects, capabilities, experience, and contact share one visual grammar of signals, nodes, coordinates, and system states.
4. **Progressive immersion.** HTML content is complete before WebGL loads. Every interactive visual has an equivalent static or semantic representation.
5. **Truthful confidence.** Copy is direct and ambitious without inflating role, ownership, metrics, or experience.

## 4. Information Architecture

The homepage follows a five-module narrative.

### 01 — System Core

The first viewport introduces the brand position, primary promise, two calls to action, availability, and the interactive avatar.

Approved English copy:

- Label: `CREATIVE FULL-STACK DEVELOPER · COLOMBIA`
- Heading: `Engineering interfaces for real systems.`
- Support: `I connect frontend craft, backend architecture, data, and immersive 3D to build digital products with intent.`
- Primary CTA: `Explore selected work`
- Secondary CTA: `Open a channel`

Approved Spanish copy:

- Label: `DESARROLLADOR FULL-STACK CREATIVO · COLOMBIA`
- Heading: `Creo interfaces para sistemas reales.`
- Support: `Conecto diseño frontend, arquitectura backend, datos y experiencias 3D para construir productos digitales con intención.`
- Primary CTA: `Explorar proyectos`
- Secondary CTA: `Abrir un canal`

### 02 — Selected Work / Case Nodes

Three flagship projects appear as full-width narrative chapters, not independent cards. At desktop widths of at least 1100 px, a sticky viewport maps native vertical progress to a three-chapter horizontal track without intercepting wheel, touch, or keyboard input. The section has a clear entrance and exit in the normal document flow. Tablet, mobile, reduced-motion, and no-script modes use a normal vertical sequence.

Each chapter contains:

- Problem and context.
- Juan's verified contribution.
- Explicit ownership mode (`individual` or `collaborative`) and team attribution.
- Architecture or system map.
- Important engineering decisions.
- Verifiable qualitative or measured outcome.
- Technology evidence.
- Demo and source links when functional.
- Dedicated case-study route.

### 03 — Capability Graph

Skills become an explorable relationship graph. Selecting a domain highlights the technologies and projects that prove it. The default DOM view contains the same information as grouped text so the graph is never required for comprehension.

Domains:

- Frontend systems.
- Backend architecture.
- Data and persistence.
- Immersive web and 3D.
- Delivery and tooling.

### 04 — Signal Trail

About and experience merge into a short professional progression: ICT infrastructure, network work, full-stack development, business systems, and creative interface engineering. It avoids generic personality claims and focuses on how Juan approaches systems and collaboration.

### 05 — Open Channel

The closing module contains availability, a short invitation, professional links, and a real contact form. Its terminal-inspired presentation must remain visibly and semantically a standard form.

## 5. Routing and Localization

Astro generates independent static HTML for every public route.

| Language | Home | Work index | Case study |
|---|---|---|---|
| English | `/` | `/work/` | `/work/[slug]/` |
| Spanish | `/es/` | `/es/proyectos/` | `/es/proyectos/[slug]/` |

Rules:

- English is the canonical root experience for international personal-brand reach.
- Each localized page declares canonical and reciprocal `hreflang` links.
- Locale navigation uses real links, not runtime text replacement.
- Locale is determined entirely by the current URL. The site does not auto-redirect or persist a hidden locale preference.
- The `<html lang>` value, metadata, structured data, navigation, validation messages, and accessible labels match the current route.
- Missing translation fields fail validation during the build.

## 6. Visual System

### Dark theme — Deep Space

| Token | Value | Use |
|---|---|---|
| Void | `#05070A` | Primary background |
| Panel | `#0B0F15` | Elevated system surfaces |
| Electric Iris | `#6077FF` | Primary interactive signal |
| Signal Green | `#58F9A1` | Availability and success |
| Ice | `#F4F6F8` | Primary text |
| Muted | `#9098A8` | Secondary text |

### Light theme — Lab Paper

| Token | Value | Use |
|---|---|---|
| Paper | `#EEECE5` | Primary background |
| Ink | `#101216` | Primary text and controls |
| Cobalt | `#4059EF` | Primary interactive signal |
| Emerald | `#087352` | Availability and success |
| Graphite | `#666B76` | Secondary text |

The two themes provide equivalent information hierarchy and interaction states. The light theme is not an inverted afterthought.

### Typography

- **Instrument Sans:** headings, body copy, navigation, buttons, and editorial content.
- **DM Mono:** system labels, coordinates, status text, metadata, project facts, and technical annotations.
- Fonts are self-hosted as variable/subset assets to avoid render-blocking third-party requests.
- Display headings use tight tracking and a responsive `clamp()` scale; body copy preserves comfortable line length and at least 16 px mobile sizing.

### Surfaces and decoration

- Fine grid lines, coordinates, node paths, and scan states establish the lab grammar.
- Gradients represent light and depth rather than generic card decoration.
- Glass effects are limited to overlays that genuinely require depth separation.
- Icon use is sparse and semantic. Technology logos do not form the primary skills interface.
- Native focus indicators are replaced only by a more visible branded `:focus-visible` treatment.

## 7. 3D Experience

The avatar is the visual system's core, not an isolated spinning decoration.

### Scene composition

- Optimized avatar with a controlled neutral material response.
- Cool key light, softer fill light, violet rim, and restrained environment reflection.
- Sparse instanced nodes and connecting paths form a topological field around the figure.
- Light fog and subtle bloom create depth without obscuring silhouette or copy.
- Pointer movement produces bounded camera and light parallax.

### Scroll choreography

1. **Idle:** subtle breathing, slow signal drift, and pointer response.
2. **Enter:** camera reveals the avatar while headline and status resolve.
3. **Scroll:** the core rotates and contracts into a system map that visually hands focus to Selected Work.
4. **Rest:** the canvas pauses when outside its meaningful viewport range; project content becomes the sole focal point.

No scroll-jacking, mandatory drag, forced camera tour, or motion-dependent navigation is allowed.

### Asset strategy

- Optimize the current source GLB with `gltf-transform` and inspect geometry/materials before deciding what can be removed.
- Produce a complete model target of at most 4 MB and a simplified model target of at most 1.5 MB.
- Convert eligible textures to KTX2 or modern compressed alternatives and cap texture dimensions by actual display need.
- Generate typed reusable model components with `gltfjsx` where it improves mesh/material control.
- Preload only the light model after critical content; load the complete model as a progressive enhancement.

### Quality tiers

| Tier | Behavior |
|---|---|
| Full | Complete model, dynamic lighting, bounded bloom, particles, adaptive DPR |
| Balanced | Light model, reduced DPR, fewer particles, simplified shadows and postprocessing |
| Static | Optimized poster, no WebGL, all content and navigation preserved |

Tier selection responds to measured frame performance and explicit user preferences. `prefers-reduced-motion`, data saving, WebGL failure, or repeated performance regression selects a simplified or static experience.

## 8. Motion System

- Native document scrolling is retained; Lenis is intentionally excluded.
- GSAP and ScrollTrigger coordinate only the hero camera handoff and selected narrative transitions.
- CSS transitions and Web Animations handle small UI feedback; GSAP is reserved for the hero camera handoff and desktop case-study track.
- Microinteractions last approximately 160–240 ms.
- Section and camera transitions last approximately 600–900 ms.
- Motion never delays access to links, content, form fields, or navigation.
- Every animation has a reduced-motion state that preserves hierarchy without movement.
- WebGL uses on-demand rendering when resting and explicit invalidation while interaction or animation is active.

## 9. Technical Architecture

### Selected stack

- Astro with static output.
- Official Astro React integration.
- React for interactive islands.
- React Three Fiber and Drei for the scene and performance adaptation.
- Three.js as the rendering foundation.
- GSAP with ScrollTrigger for limited scroll-linked choreography.
- Astro Content Collections with build-time schema validation.
- Scoped component styles plus global cascade layers and CSS custom-property tokens. Tailwind is not used.
- Formspree for contact delivery.
- Vitest, Testing Library, Playwright, axe, and Lighthouse CI for verification.

Astro is selected because static HTML remains the default and JavaScript is loaded only for independent interactive islands. This protects content, SEO, and first-load performance while retaining React and R3F where they add real value.

### Hydration strategy

| Island | Trigger | Responsibility |
|---|---|---|
| `HeroExperience` | `client:idle` with immediate static markup and poster | Scene lifecycle, camera, pointer input, quality tier, hero choreography |
| `CapabilityGraph` | `client:visible` | Graph filtering, keyboard interaction, semantic synchronization |
| `ThemeControl` | minimal inline bootstrap plus small island | Prevent theme flash and expose accessible theme control |
| `ContactForm` | `client:visible` | Client validation, request lifecycle, feedback, recovery |

All other layout, copy, projects, experience, metadata, and navigation render as static Astro HTML without a client runtime.

### Component boundaries

```text
src/
  components/
    layout/
      SiteShell.astro
      HudNavigation.astro
      Footer.astro
    hero/
      HeroCopy.astro
      HeroExperience.tsx
      HeroScene.tsx
      HeroFallback.astro
    work/
      SelectedWork.astro
      ProjectChapter.astro
      ArchitectureMap.astro
    capabilities/
      CapabilityList.astro
      CapabilityGraph.tsx
    profile/
      SignalTrail.astro
    contact/
      ContactSection.astro
      ContactForm.tsx
    ui/
      ThemeControl.tsx
      LocaleLinks.astro
      SystemLabel.astro
  content/
    projects/
    experience/
  i18n/
    en.ts
    es.ts
    schema.ts
  layouts/
    BaseLayout.astro
    CaseStudyLayout.astro
  lib/
    contact.ts
    locale.ts
    motion.ts
    projects.ts
    quality-tier.ts
  pages/
    index.astro
    work/
    es/
  styles/
    tokens.css
    reset.css
    global.css
    utilities.css
  tests/
```

Each component owns one clear concern. Content does not live inside visual components, 3D state does not control document navigation, and project facts do not depend on a runtime GitHub request.

## 10. Content Model and Project Selection

Project data is curated at build time rather than fetched live from GitHub. This avoids rate limits, loading instability, accidental content drift, and reliance on repository descriptions as marketing copy.

Each project record requires:

- Stable slug and localized title.
- Localized summary, problem, contribution, decisions, and outcome.
- Project type and status.
- Team attribution.
- Technology relationships.
- Architecture nodes/edges used by the visual map.
- Repository, demo, and documentation links with explicit availability states.
- Responsive media with descriptive alt text.
- Featured/archive state and ordering.
- Evidence notes used during editorial review but not rendered publicly.

### Launch case studies

1. **Formula1** — primary frontend/3D case. It demonstrates modular JavaScript, Web Components, CRUD flows, data access, simulation, and Three.js. The live API behavior must be verified before the demo CTA is enabled. The page labels it as collaborative and describes only contribution supported by repository history.
2. **SGCI-app** — primary business-systems case. It demonstrates a broad inventory/purchasing/sales domain, layered organization, repositories, persistence, and SQL. It is labeled collaborative and does not claim a public demo.
3. **Kinetic Systems Lab** — the redesigned portfolio itself. It demonstrates Astro islands, accessible interaction, adaptive R3F, content architecture, localization, and measured performance. Final case-study metrics come directly from the completed verification run.

### Secondary archive

- **Proyecto MySQL** — focused data/SQL evidence.
- **FacturaWeb-Lit** — shown only as source until its configured demo returns successfully.
- **Event Mobile App** — retained in the content archive but not rendered at launch.

### Exclusions and safety gates

- `BackHackthon` is not linked or promoted until the published JWT/configuration material and connection details are removed, rotated, and history-cleaned outside this repository.
- Forked AI repositories are not used as evidence of original AI work.
- Forked projects are excluded unless Juan's specific upstream contribution is verifiable and clearly attributed.
- Empty, broken, or undocumented repositories do not appear merely to increase project count.
- When individual contribution cannot be verified, the copy says `Collaborative project` and limits claims to observable repository behavior.

## 11. Data Flows

### Build-time content

```text
Localized project/experience records
  -> schema validation
  -> route generation
  -> static HTML + metadata + structured data
  -> link/media validation
  -> deployable artifact
```

Schema errors, missing translations, duplicate slugs, invalid relationships, or missing required evidence fail the build.

### Theme

```text
Inline bootstrap reads saved preference or system preference
  -> sets data-theme before first paint
  -> accessible control updates attribute and local preference
  -> both themes preserve identical content and state
```

### 3D scene

```text
Static hero and poster render first
  -> capability and preference check
  -> light model loads
  -> measured performance selects quality tier
  -> complete model/effects load only when the Full tier remains stable
  -> canvas pauses when inactive
```

### Contact

```text
Semantic form
  -> localized client validation
  -> Formspree request
  -> sending state
  -> success confirmation or recoverable error
```

The Formspree form identifier is configured through `PUBLIC_FORMSPREE_FORM_ID`. Preview and test environments use request interception. The production deployment job refuses to publish the contact form as enabled when the identifier is absent.

## 12. Error and Empty States

### 3D

- An error boundary contains React/R3F failures.
- WebGL initialization, model loading, shader compilation, or sustained low performance switches to the static poster.
- The poster remains visible beneath the canvas until the first meaningful frame is ready.
- Canvas errors never remove hero text or controls.

### Contact

- Required-field, formatting, rate-limit, provider, offline, timeout, and unknown-error states have localized messages.
- Submission disables only the submit action, not the full form.
- Failed content remains in the fields for retry.
- Success provides a visible status and returns focus to the confirmation.

### Content and links

- Unavailable demos render as a clear `Source only` state rather than a dead button.
- Missing optional media uses a designed project-identity fallback, not a broken image.
- External links use safe targets and receive automated status checks.

## 13. Accessibility

Target: WCAG 2.2 AA.

- Semantic landmarks, heading order, skip link, and descriptive page titles.
- Fully keyboard-operable HUD navigation, menus, graph filters, theme control, locale links, case-study links, and form.
- Highly visible `:focus-visible` styling in both themes.
- Theme and language controls expose names, current state, and result.
- Touch targets meet at least 44 × 44 CSS pixels where applicable.
- Color is never the sole indicator of state or graph relationships.
- Canvas is hidden from assistive technology when decorative; project and capability meaning exists in normal HTML.
- Images and project diagrams use meaningful alt text or explicit decorative treatment.
- Form fields retain visible labels, instructions, errors, and live status.
- Reduced-motion mode removes scroll-linked transforms, camera travel, parallax, particle motion, and animated graph traversal while preserving content order.
- Contrast is tested for body text, muted text, controls, focus indicators, status colors, and both themes.

## 14. SEO and Sharing

Every public page includes:

- Localized title and description.
- Canonical URL and reciprocal `hreflang` links.
- Open Graph and Twitter metadata.
- Dedicated social preview image.
- Person and WebSite JSON-LD on home routes.
- CreativeWork/SoftwareSourceCode JSON-LD on project routes when evidence supports it.
- Robots and sitemap output.
- Meaningful heading structure and crawlable project copy.
- Stable clean URLs and a useful localized 404 page.

No runtime GitHub request is required for indexed content.

## 15. Performance Budgets

| Metric | Target |
|---|---|
| Initial non-3D JavaScript | ≤ 90 KB gzip |
| Deferred hero 3D JavaScript | ≤ 350 KB gzip |
| Complete GLB | ≤ 4 MB |
| Light GLB | ≤ 1.5 MB |
| Typical main responsive image | ≤ 300 KB at its intended viewport |
| Mobile LCP | ≤ 2.5 s in the pinned Lighthouse mobile profile below |
| CLS | ≤ 0.1 |
| INP | ≤ 200 ms |
| Full-tier scene | 55–60 FPS on a capable desktop |
| Balanced scene | Median ≥45 FPS with p95 frame time ≤33 ms on the mobile check below |

Additional rules:

- Explicit media dimensions prevent layout shift.
- Noncritical images and islands load near the viewport.
- Fonts are subset, self-hosted, and preloaded only when critical.
- CDN scripts from the current implementation are removed.
- Repeated meshes use shared geometry/materials or instancing.
- DPR, particles, shadows, and effects adapt before the UI drops frames.
- WebGL stops rendering when its state is static and no update is requested.

Lighthouse CI runs three times against the production preview and evaluates the median using a 412 × 915 mobile viewport, DPR 2.625, 4× CPU slowdown, 150 ms RTT, 1.6 Mbps downstream, and 750 Kbps upstream. The mobile scene check uses current Chrome on a Pixel 7-class physical or remote device, after a warm model load, during a recorded 10-second pointer-and-scroll interaction. The test record names the exact device and browser build.

## 16. Responsive Behavior

### Desktop

- Persistent compact HUD navigation.
- Hero uses an asymmetric copy/scene composition.
- Selected Work uses the bounded sticky horizontal track defined in Section 4 while the browser continues normal vertical scroll.
- Capability graph and semantic detail coexist side by side.

### Tablet

- HUD condenses without hiding language, theme, work, or contact actions.
- Scene occupies less visual area and enters Balanced quality sooner.
- Project chapters retain diagrams but reduce decorative metadata.

### Mobile

- Compact top bar and accessible overlay navigation.
- Hero copy leads; the avatar occupies a secondary bounded region.
- Projects become a vertical sequence with no horizontal requirement.
- Capability graph defaults to the semantic grouped view and offers visualization as an enhancement.
- Coarse pointers receive no hover-only information.

## 17. Verification Strategy

### Static and unit checks

- TypeScript strict mode.
- Content and localization schema tests.
- Theme, locale, quality-tier, project-relationship, and contact utility tests.
- Component tests for controls, graph filtering, validation, and error boundaries.
- Script that verifies internal assets, external links, demos, project status, and localized route parity.

### Browser tests

Playwright covers:

- English and Spanish navigation.
- Direct loading of every localized case-study URL.
- Theme bootstrap and switching without flash-sensitive regressions.
- Desktop, tablet, and mobile navigation.
- Keyboard-only traversal and visible focus.
- Capability graph plus equivalent semantic content.
- Contact validation, sending, success, provider failure, offline recovery, and retained values.
- Full, balanced, reduced-motion, and WebGL-failure hero modes.
- Project demo/source availability states.
- 404 and unexpected runtime error containment.

The browser matrix runs in Chromium, Firefox, and WebKit. Chromium is the full interaction and visual-regression target; Firefox and WebKit cover navigation, content, themes, locale routes, form behavior, and static 3D fallback compatibility.

### Accessibility and performance

- axe automation on both themes, both locales, home, work index, and case-study templates.
- Lighthouse CI budgets for performance, accessibility, best practices, and SEO.
- Manual checks with keyboard, NVDA plus current Chrome on Windows, 200% zoom, reduced motion, Windows high contrast, coarse pointer, and data-saving behavior.
- Performance profiling confirms model size, draw calls, memory stability, frame pacing, pause behavior, and no long main-thread blocks during first interaction.

### Completion gate

The redesign is not complete until:

- Production build succeeds from a clean install using `npm ci`.
- Automated tests and content/link checks pass.
- Both themes and locales pass the defined route matrix.
- The contact form has a production Formspree identifier and a verified success path.
- Performance budgets pass or any exception is explicitly approved with recorded evidence.
- Visual comparison confirms the implementation matches the approved Kinetic Systems Lab direction on desktop and mobile.

## 18. Deployment and Migration

- Preserve the `juanfrxz.dev` custom domain and the `CNAME` file.
- Continue static deployment through GitHub Pages.
- Replace the existing workflow with a current `npm ci` → test → build → upload → deploy pipeline.
- Use root base paths because the custom domain serves the project at `/`.
- Generate a clean static output directory; do not rely on the stale checked-out `dist` snapshot.
- Keep the old site available through Git history rather than mixing old and new source structures.
- Add `.superpowers/` to `.gitignore` during implementation; the approved mockups remain local design companions and are not production assets.
- Remove obsolete CDN imports, duplicate i18n code, dead tour code, unreferenced Vite starter assets, stale SCSS, and blocking loader only after the Astro replacement is functioning and verified.

## 19. Approved Decisions Summary

- Primary purpose: technical and creative personal brand.
- Positioning: Creative Full-Stack Developer.
- Required retained capabilities: bilingual site, light/dark themes, real contact form, central 3D avatar concept.
- Creative direction: Kinetic Systems Lab.
- Narrative: System Core → Selected Work → Capability Graph → Signal Trail → Open Channel.
- Visual language: Deep Space and Lab Paper, Instrument Sans plus DM Mono.
- Motion: native scrolling, controlled GSAP choreography, adaptive R3F, full reduced-motion parity.
- Architecture: Astro static output with React Islands, R3F, and typed content collections.
- Launch cases: Formula1, SGCI-app, and Kinetic Systems Lab.
- Contact: Formspree with deployment configuration gate.
- Hosting: GitHub Pages with `juanfrxz.dev`.
- Quality: WCAG 2.2 AA target, explicit performance budgets, automated and manual verification.

## References

- [Astro Islands architecture](https://docs.astro.build/en/concepts/islands/)
- [Astro integrations](https://docs.astro.build/en/guides/integrations/)
- [React Three Fiber performance scaling](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [React Three Fiber model loading](https://r3f.docs.pmnd.rs/tutorials/loading-models)
- [Vite static deployment guidance](https://vite.dev/guide/static-deploy.html)
- [Formula1 repository](https://github.com/Juanfrxz/Formula1)
- [SGCI-app repository](https://github.com/Juanfrxz/SGCI-app)
- [Proyecto MySQL repository](https://github.com/Juanfrxz/Proyecto_mysql_JuanDavidRodriguez)
- [FacturaWeb-Lit repository](https://github.com/Juanfrxz/FacturaWeb-Lit)
