import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('project scaffold', () => {
  it('publishes the custom domain from the public directory', () => {
    const cname = readFileSync(resolve('public/CNAME'), 'utf8');

    expect(cname.trim()).toBe('juanfrxz.dev');
  });

  it('runs on a supported Node major version', () => {
    const nodeMajor = Number.parseInt(process.versions.node, 10);

    expect(nodeMajor).toBeGreaterThanOrEqual(22);
  });
});
