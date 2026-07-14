import { z } from 'zod';

const nonemptyString = z.string().min(1);

export const dictionarySchema = z.strictObject({
  nav: z.strictObject({
    work: nonemptyString,
    about: nonemptyString,
    contact: nonemptyString,
    menu: nonemptyString,
  }),
  hero: z.strictObject({
    label: nonemptyString,
    heading: nonemptyString,
    support: nonemptyString,
    availability: nonemptyString,
    primaryCta: nonemptyString,
    secondaryCta: nonemptyString,
  }),
  work: z.strictObject({
    label: nonemptyString,
    heading: nonemptyString,
    indexDescription: nonemptyString,
    caseStudyTitle: nonemptyString,
    backToIndex: nonemptyString,
    sourceOnly: nonemptyString,
    individual: nonemptyString,
    collaborative: nonemptyString,
    connectsTo: nonemptyString,
    nodeLabel: nonemptyString,
    identitySignal: nonemptyString,
    problem: nonemptyString,
    contribution: nonemptyString,
    architecture: nonemptyString,
    decisions: nonemptyString,
    outcome: nonemptyString,
    technologies: nonemptyString,
    archive: nonemptyString,
    viewCase: nonemptyString,
  }),
  projectStatus: z.strictObject({
    shipped: nonemptyString,
    inProgress: nonemptyString,
    archived: nonemptyString,
    repository: nonemptyString,
    demo: nonemptyString,
    documentation: nonemptyString,
    unavailable: nonemptyString,
  }),
  capabilities: z.strictObject({
    label: nonemptyString,
    heading: nonemptyString,
    showGraph: nonemptyString,
    hideGraph: nonemptyString,
    frontend: nonemptyString,
    backend: nonemptyString,
    data: nonemptyString,
    immersive: nonemptyString,
    delivery: nonemptyString,
  }),
  trail: z.strictObject({
    label: nonemptyString,
    heading: nonemptyString,
    current: nonemptyString,
  }),
  contact: z.strictObject({
    label: nonemptyString,
    heading: nonemptyString,
    availability: nonemptyString,
    invitation: nonemptyString,
    professionalLinks: nonemptyString,
    name: nonemptyString,
    email: nonemptyString,
    message: nonemptyString,
    submit: nonemptyString,
    sending: nonemptyString,
    success: nonemptyString,
    invalid: nonemptyString,
    offline: nonemptyString,
    timeout: nonemptyString,
    rateLimit: nonemptyString,
    provider: nonemptyString,
    unknown: nonemptyString,
    unavailable: nonemptyString,
  }),
  theme: z.strictObject({
    useLight: nonemptyString,
    useDark: nonemptyString,
  }),
  accessibility: z.strictObject({
    skipToContent: nonemptyString,
    openMenu: nonemptyString,
    closeMenu: nonemptyString,
    changeLanguage: nonemptyString,
    capabilityResults: nonemptyString,
  }),
});

export type Dictionary = z.infer<typeof dictionarySchema>;

export function defineDictionary(input: unknown): Dictionary {
  return dictionarySchema.parse(input);
}
