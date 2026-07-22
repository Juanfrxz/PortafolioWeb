# Kinetic Systems Lab

Portafolio bilingüe de Juan Rodriguez, construido como un sitio estático con Astro y React Islands. Presenta proyectos verificables, tema claro/oscuro, una experiencia 3D progresiva y un formulario de contacto con degradación segura.

Producción: [juanfrxz.dev](https://juanfrxz.dev)

## Arquitectura

- Astro 7 genera rutas estáticas en inglés y español.
- React se reserva para islas interactivas: el avatar 3D se importa al primer gesto sobre el hero, y el gráfico de capacidades y el formulario se hidratan al entrar en contexto.
- Las colecciones tipadas de `src/content/` validan proyectos y experiencia durante el build.
- El contenido semántico y los fallbacks funcionan sin JavaScript, WebGL o animación.
- GitHub Pages publica `dist/` en el dominio raíz conservando `public/CNAME`.

## Requisitos

- Node.js 24.x, la misma versión usada en CI.
- npm incluido con Node.
- Para la matriz E2E local: Chromium, Firefox y WebKit de Playwright.

## Inicio local

```bash
npm ci
npx playwright install chromium firefox webkit
npm run dev
```

Astro mostrará la URL local. Para comprobar exactamente el artefacto estático:

```bash
npm run build
npm run preview
```

El formulario queda deshabilitado de forma explícita cuando `PUBLIC_FORMSPREE_FORM_ID` no existe. Para probarlo con un formulario propio, cree un `.env` local que no debe versionarse:

```dotenv
PUBLIC_FORMSPREE_FORM_ID=su-identificador-de-formspree
```

## Comandos de calidad

| Comando | Alcance |
| --- | --- |
| `npm run check` | Tipos y diagnósticos de Astro |
| `npm test` | Pruebas unitarias y de componentes |
| `npm run build` | Build estático y previews sociales |
| `npm run verify` | Formato, tipos, tests, build, enlaces, contenido y presupuestos |
| `npm run test:e2e` | Matriz Playwright y regresión visual |
| `npm run test:a11y` | Axe en rutas, idiomas y temas aprobados |
| `npm run lighthouse` | Lighthouse CI con los presupuestos de `lighthouserc.cjs` y una sesión de Chromium administrada |

La lista de comprobación de lanzamiento vive en `docs/verification/2026-07-13-release-checklist.md`. Los ítems de NVDA y dispositivos físicos permanecen manuales; la emulación automatizada no los sustituye.

## Flujo de contenido

- Proyectos: `src/content/projects/*.json`.
- Trayectoria profesional: `src/content/experience/*.json`.
- Esquema y reglas de evidencia: `src/content/schema.ts`.
- Traducciones de interfaz: `src/i18n/en.ts` y `src/i18n/es.ts`.
- Configuración canónica, correo y enlaces profesionales: `src/config/site.ts`.
- Medios públicos: `public/`; cada imagen de proyecto declara ruta, dimensiones y texto alternativo bilingüe.

Al añadir o modificar contenido, ejecute `npm run verify`. Los dos idiomas deben mantener la misma estructura y todas las referencias internas deben resolver durante el build.

## Política de evidencia de proyectos

El portafolio no presenta como comprobado lo que el repositorio no puede demostrar:

- Use `available` únicamente para enlaces públicos comprobados; los demás estados no llevan URL.
- Distinga trabajo individual de colaborativo e incluya atribución bilingüe cuando corresponda.
- No publique métricas, resultados, demos ni estados finales sin una fuente verificable.
- Registre en `evidenceNotes` qué respalda cada afirmación y mantenga las limitaciones visibles.
- Las capturas y previews sociales son evidencia visual del portafolio, no prueba de resultados externos de otro proyecto.

## CI y despliegue

`.github/workflows/deploy.yml` ejecuta en cada pull request y push a `main`:

1. `npm ci` con Node 24 y caché de npm.
2. `npm run verify`.
3. La matriz Playwright, axe y Lighthouse CI.

Solo un push verificado a `main` crea y publica el artefacto de producción mediante las acciones oficiales de GitHub Pages. El job vuelve a construir con la configuración real, valida `dist/CNAME` y despliega `dist/` en el environment `github-pages`.

Configuración requerida del repositorio:

1. En **Settings → Pages → Build and deployment**, seleccione **GitHub Actions** como source.
2. Cree el secret de Actions `PUBLIC_FORMSPREE_FORM_ID` con el identificador real del formulario.
3. Mantenga el dominio personalizado `juanfrxz.dev`; `public/CNAME` y el workflow impiden publicar un artefacto sin ese dominio.
4. Proteja el environment `github-pages` si se requieren aprobaciones adicionales.

El gate `DEPLOY_TARGET=production npm run check:production-env` rechaza un identificador ausente o el valor de prueba. Después del primer despliegue debe realizarse una entrega real del formulario y revisar el correo recibido; esa acción externa no forma parte de las pruebas automatizadas.

## Licencia y uso

El código sirve como portafolio personal. El contenido, la identidad y los medios de proyectos conservan su autoría y atribución declaradas en cada entrada.
