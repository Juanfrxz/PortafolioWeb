type HttpsUrl = `https://${string}`;

export interface ProfessionalLink {
  readonly label: 'GitHub' | 'LinkedIn';
  readonly href: HttpsUrl;
}

interface SiteConfig {
  readonly name: string;
  readonly url: HttpsUrl;
  readonly email: string;
  readonly professionalLinks: readonly ProfessionalLink[];
}

const professionalLinks = Object.freeze([
  Object.freeze({
    label: 'GitHub',
    href: 'https://github.com/Juanfrxz',
  }),
  Object.freeze({
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/david-rodr%C3%ADguez-13686a25b',
  }),
]) satisfies readonly ProfessionalLink[];

export const SITE = Object.freeze({
  name: 'Juan Rodriguez',
  url: 'https://juanfrxz.dev',
  email: 'jr563384@gmail.com',
  professionalLinks,
}) satisfies Readonly<SiteConfig>;
