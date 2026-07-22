import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowPath = join(process.cwd(), '.github', 'workflows', 'deploy.yml');
const workflow = readFileSync(workflowPath, 'utf8');
const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
) as { scripts?: Record<string, string> };

describe('GitHub Pages workflow contract', () => {
  it('validates pull requests and deploys main with the supported toolchain', () => {
    expect(workflow).toMatch(/pull_request:/);
    expect(workflow).toMatch(/push:[\s\S]*branches:[\s\S]*- main/);
    expect(workflow).toMatch(
      /actions\/setup-node@v4[\s\S]*node-version:\s*['"]?24/,
    );
    expect(workflow).toContain('npm ci');
    expect(workflow).toContain('npm run verify');
    expect(workflow).toContain('npm run check:production-env');
    expect(workflow).toContain('npm run test:e2e');
    expect(workflow).toContain('npm run test:a11y');
    expect(workflow).toContain('npm run lighthouse');
    expect(packageJson.scripts?.lighthouse).toBe(
      'node scripts/run-lighthouse-ci.mjs',
    );
  });

  it('uses the official Pages artifact and deployment contract', () => {
    expect(workflow).toMatch(/contents:\s*read/);
    expect(workflow).toMatch(/pages:\s*write/);
    expect(workflow).toMatch(/id-token:\s*write/);
    expect(workflow).toContain('environment:');
    expect(workflow).toContain('github-pages');
    expect(workflow).toContain('PUBLIC_FORMSPREE_FORM_ID');
    expect(workflow).toContain('DEPLOY_TARGET: production');
    expect(workflow).toContain('actions/configure-pages@v5');
    expect(workflow).toContain('actions/upload-pages-artifact@v4');
    expect(workflow).toContain('actions/deploy-pages@v4');
    expect(workflow).toContain('dist/CNAME');
  });

  it('contains no retired deploy action or version-two GitHub actions', () => {
    expect(workflow).not.toContain('JamesIves/github-pages-deploy-action');
    expect(workflow).not.toMatch(/uses:\s*[^\s]+@v2(?:\s|$)/);
  });
});
