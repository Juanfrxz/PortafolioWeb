const chromePort = Number.parseInt(
  process.env.LIGHTHOUSE_CHROME_PORT ?? '',
  10,
);
const baseUrl = process.env.LIGHTHOUSE_BASE_URL?.replace(/\/$/, '');

module.exports = {
  ci: {
    collect: {
      staticDistDir: baseUrl ? undefined : './dist',
      chromePath: process.env.LIGHTHOUSE_CHROME_PATH || undefined,
      numberOfRuns: 3,
      url: baseUrl
        ? [`${baseUrl}/`, `${baseUrl}/work/`, `${baseUrl}/es/`]
        : [
            'http://localhost/',
            'http://localhost/work/',
            'http://localhost/es/',
          ],
      settings: {
        ...(Number.isInteger(chromePort) && chromePort > 0
          ? { port: chromePort }
          : {}),
        formFactor: 'mobile',
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 150,
          throughputKbps: 1600,
          uploadThroughputKbps: 750,
          cpuSlowdownMultiplier: 4,
        },
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 915,
          deviceScaleFactor: 2.625,
          disabled: false,
        },
      },
    },
    assert: {
      aggregationMethod: 'median',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 1 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
