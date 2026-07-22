import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

type Environment = Record<string, string | undefined>;

export function validateProductionEnvironment(
  environment: Environment,
): string[] {
  if (environment.DEPLOY_TARGET !== 'production') {
    return [];
  }

  const formId = environment.PUBLIC_FORMSPREE_FORM_ID?.trim();
  if (!formId) {
    return ['PUBLIC_FORMSPREE_FORM_ID is required for production.'];
  }
  if (formId === 'test-form-id') {
    return ['PUBLIC_FORMSPREE_FORM_ID cannot use the test identifier.'];
  }
  return [];
}

export function main() {
  const errors = validateProductionEnvironment(process.env);
  if (errors.length > 0) {
    errors.forEach((error) => console.error(error));
    process.exitCode = 1;
    return;
  }
  console.log(
    process.env.DEPLOY_TARGET === 'production'
      ? 'Production environment is configured.'
      : 'Production environment check skipped for non-production target.',
  );
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : '';
if (currentFile === invokedFile) {
  main();
}
