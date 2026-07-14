import type { ImageMetadata } from 'astro';

const projectImageModules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/projects/**/*.{avif,jpeg,jpg,png,webp}',
  { eager: true },
);

const projectImages = new Map(
  Object.entries(projectImageModules).map(([modulePath, module]) => [
    modulePath.replace('../assets', ''),
    module.default,
  ]),
);

export function resolveProjectImage(src: string): ImageMetadata {
  const image = projectImages.get(src);

  if (!image) {
    throw new Error(`Project image is not available at ${src}.`);
  }

  return image;
}

const technologyLabels: Readonly<Record<string, string>> = {
  astro: 'Astro',
  'c-sharp': 'C#',
  dotnet: '.NET',
  javascript: 'JavaScript',
  lit: 'Lit',
  mysql: 'MySQL',
  react: 'React',
  sql: 'SQL',
  'three-js': 'Three.js',
  typescript: 'TypeScript',
  vite: 'Vite',
  'web-components': 'Web Components',
};

export function technologyLabel(technology: string): string {
  return technologyLabels[technology] ?? technology;
}
