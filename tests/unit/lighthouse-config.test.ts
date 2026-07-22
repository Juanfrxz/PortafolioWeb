import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const config = require(join(process.cwd(), 'lighthouserc.cjs'));

describe('Lighthouse CI contract', () => {
  it('evaluates the median of the three runs instead of an optimistic sample', () => {
    expect(config.ci.assert.aggregationMethod).toBe('median');
  });
});
