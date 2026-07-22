import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import sharp from 'sharp';

const outputDirectory = join(process.cwd(), 'public', 'social');
const previews = [
  ['home-en', 'Engineering interfaces', 'for real systems.'],
  ['home-es', 'Creo interfaces', 'para sistemas reales.'],
  ['work-en', 'Selected work', 'Systems, decisions, evidence.'],
  ['work-es', 'Proyectos seleccionados', 'Sistemas, decisiones, evidencia.'],
  ['formula1-en', 'Formula1', 'Data · simulation · interactive 3D'],
  ['formula1-es', 'Formula1', 'Datos · simulación · 3D interactivo'],
  ['sgci-app-en', 'SGCI-app', 'Business workflows · persistence · SQL'],
  ['sgci-app-es', 'SGCI-app', 'Flujos de negocio · persistencia · SQL'],
  [
    'kinetic-systems-lab-en',
    'Kinetic Systems Lab',
    'Astro · accessible islands · adaptive 3D',
  ],
  [
    'kinetic-systems-lab-es',
    'Laboratorio de Sistemas Cinéticos',
    'Astro · islas accesibles · 3D adaptativo',
  ],
];

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function createSvg(heading, support) {
  const safeHeading = escapeXml(heading);
  const safeSupport = escapeXml(support);

  return `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M64 0H0V64" fill="none" stroke="#252C3A" stroke-width="1" />
        </pattern>
        <radialGradient id="signal" cx="78%" cy="22%" r="64%">
          <stop offset="0" stop-color="#6077FF" stop-opacity="0.48" />
          <stop offset="0.46" stop-color="#6077FF" stop-opacity="0.1" />
          <stop offset="1" stop-color="#05070A" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="630" fill="#05070A" />
      <rect width="1200" height="630" fill="url(#grid)" opacity="0.58" />
      <rect width="1200" height="630" fill="url(#signal)" />
      <path d="M768 74H1126V432" fill="none" stroke="#6077FF" stroke-width="2" />
      <circle cx="768" cy="74" r="7" fill="#58F9A1" />
      <circle cx="1126" cy="432" r="7" fill="#6077FF" />
      <text x="76" y="88" fill="#58F9A1" font-family="monospace" font-size="18" letter-spacing="4">KINETIC SYSTEMS LAB</text>
      <text x="76" y="304" fill="#F4F6F8" font-family="Arial, sans-serif" font-size="68" font-weight="700" letter-spacing="-3">${safeHeading}</text>
      <text x="80" y="362" fill="#9098A8" font-family="monospace" font-size="23" letter-spacing="1">${safeSupport}</text>
      <text x="80" y="548" fill="#9098A8" font-family="monospace" font-size="16" letter-spacing="3">JUAN RODRIGUEZ · CREATIVE FULL-STACK DEVELOPER</text>
      <text x="1080" y="548" fill="#58F9A1" font-family="monospace" font-size="16" text-anchor="end">01—05</text>
    </svg>`;
}

await mkdir(outputDirectory, { recursive: true });

for (const [filename, heading, support] of previews) {
  await sharp(Buffer.from(createSvg(heading, support)))
    .webp({ quality: 84 })
    .toFile(join(outputDirectory, `${filename}.webp`));
}

console.log(`Generated ${previews.length} localized social previews.`);
