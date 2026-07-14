import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('legacy tour dependency imports', () => {
  it('uses the exported driver.js package specifiers', async () => {
    const source = await readFile('assets/js/tour.js', 'utf8');

    expect(source).not.toContain('../../node_modules');
    expect(source).toContain("import('driver.js')");
    expect(source).toContain("import('driver.js/dist/driver.css')");
  });

  it('resolves the driver.js package exports to installed targets', async () => {
    const resolutionScript = `
      console.log(JSON.stringify([
        import.meta.resolve('driver.js'),
        import.meta.resolve('driver.js/dist/driver.css'),
      ]));
    `;
    const { stdout } = await execFileAsync(
      process.execPath,
      ['--input-type=module', '--eval', resolutionScript],
      { cwd: process.cwd() },
    );
    const [moduleUrl, stylesheetUrl] = JSON.parse(stdout.trim()) as [
      string,
      string,
    ];

    expect(moduleUrl).toMatch(/\/driver\.js\/dist\/driver\.js\.mjs$/);
    expect(stylesheetUrl).toMatch(/\/driver\.js\/dist\/driver\.css$/);
    await expect(access(fileURLToPath(moduleUrl))).resolves.toBeUndefined();
    await expect(access(fileURLToPath(stylesheetUrl))).resolves.toBeUndefined();
  });
});
