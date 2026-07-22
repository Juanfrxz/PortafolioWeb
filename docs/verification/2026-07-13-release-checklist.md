# Kinetic Systems Lab release checklist

## Automated gates

- [x] `npm run verify` — 266/266 unit/component tests and all build validators on 2026-07-22
- [x] Chromium interaction, environment, and visual suite — 22/22 on 2026-07-22
- [x] Firefox core route, theme, fallback, and form suite — 15/15 on 2026-07-22
- [x] WebKit core route, theme, fallback, and form suite — 15/15 on 2026-07-22
- [x] axe: home, work, and three cases in two locales and two themes — 20/20 on 2026-07-22
- [x] Lighthouse: performance >= 0.90 — all route medians 0.98
- [x] Lighthouse: accessibility, best practices, and SEO = 1.00
- [x] Lighthouse: LCP <= 2500 ms and CLS <= 0.1
- [x] Synthetic theme interaction <= 200 ms

## Automated environment emulation

- [x] Reduced motion keeps static hero and vertical project sequence
- [x] Data saver keeps static hero and full semantic content
- [x] Mobile/coarse layout has no hover-only dependency
- [x] Stored light/dark preference is applied before the first observed theme state
- [x] JavaScript-disabled home retains hero, CTA, projects, capabilities, and contact
- [x] 200% equivalent viewport reflows without horizontal document or form overflow in both locales
- [x] Chromium forced-colors emulation preserves content and visible keyboard focus in both locales

## Manual and device checks

- [ ] Keyboard-only walkthrough in current Chrome on Windows
- [ ] NVDA + current Chrome on Windows
- [ ] Browser zoom at 200%
- [ ] Windows forced-colors/high-contrast mode
- [ ] Coarse pointer on a physical touch device
- [ ] Browser/device data-saver preference
- [ ] Both locales and both themes on desktop and mobile
- [ ] Pixel 7-class device, current Chrome build, warm model load, recorded 10-second pointer-and-scroll profile

Manual items remain unchecked until they are performed on the named assistive technology or physical device. Automated emulation is supporting evidence, not a substitute for those checks.

## Measured release evidence — 2026-07-22

- `npm run build`: 11 static pages, including the localized route set and `404.html`.
- `npm run validate:build`: passed.
- `npm run check:budgets`: 61.7 KiB gzip initial non-3D JavaScript; 311.2 KiB deferred hero closure.
- `npm run check:models`: `avatar-full.glb` 2,070,924 bytes; `avatar-light.glb` 782,400 bytes.
- `npm run test:a11y`: 20/20 locale, route, and theme combinations passed.
- `npm run test:e2e`: 141/141 across the complete configured browser matrix.
- `npx playwright test tests/e2e/core`: 45/45 across Chromium, Firefox, and WebKit.
- `npx playwright test tests/e2e/chromium --project=chromium`: 22/22 interaction, environment, and visual checks.
- `npm audit --omit=dev --audit-level=low`: zero production dependency vulnerabilities with Astro 7.1.3 and Vite 8.1.5.
- Full `npm audit`: 10 transitive development-tool findings remain in LHCI and 3D optimization CLIs; npm offers only incompatible `--force` downgrades, and none of those packages ship in `dist/`.
- `npm run lighthouse`: 9/9 reports completed with zero console errors and no residual browser processes.

| Route    | Performance | Accessibility | Best practices |  SEO | LCP median | CLS median |
| -------- | ----------: | ------------: | -------------: | ---: | ---------: | ---------: |
| `/`      |        0.98 |          1.00 |           1.00 | 1.00 |    2108 ms |     0.0006 |
| `/work/` |        0.98 |          1.00 |           1.00 | 1.00 |    2106 ms |     0.0003 |
| `/es/`   |        0.98 |          1.00 |           1.00 | 1.00 |    2183 ms |     0.0000 |

## Final design re-audit — `portfolio`

- Previous score: 2.4/5.
- Current score: 4.6/5.
- Delta: +2.2.

| Area                                  | Before | After | Status   |
| ------------------------------------- | -----: | ----: | -------- |
| Brand and visual distinctiveness      |      — |   5/5 | Improved |
| Editorial quality                     |      — |   4/5 | Improved |
| Content and information architecture  |      — |   5/5 | Improved |
| Visual hierarchy                      |      — |   5/5 | Improved |
| Interaction and contact path          |      — |   4/5 | Improved |
| Accessibility and responsive behavior |      — |   5/5 | Improved |
| Performance perception                |      — |   4/5 | Improved |

Evidence: full-page references were inspected for desktop and mobile, light and dark themes, and both locales. The original mobile navigation, blocking-loader, duplicate-localization, weak project-evidence, SEO, focus, fallback, favicon, and Windows Lighthouse-runner issues are resolved in the implementation. A production Formspree submission, NVDA, real browser zoom/high-contrast, and physical-device checks remain open and cap the release score.
