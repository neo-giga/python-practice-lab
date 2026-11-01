import { defineConfig, devices } from '@playwright/test';

// E2E runs against the PRODUCTION build served under the GitHub Pages-style
// subpath /python-interview-lab/, with the real Pyodide runtime (no stubs).
const PORT = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e-results.json' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}/python-interview-lab/`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `node scripts/serve-dist.mjs --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/python-interview-lab/`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    { name: 'phone-375', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
    { name: 'tablet-768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true } },
    { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } }, grep: /@runtime/ },
    { name: 'webkit-desktop', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } }, grep: /@runtime/ },
    // Device EMULATION (not real devices): the full journey and the software-keyboard simulation.
    { name: 'iphone-15-webkit', use: { ...devices['iPhone 15'] }, grep: /@device/ },
    { name: 'ipad-gen7-webkit', use: { ...devices['iPad (gen 7)'] }, grep: /@device/ },
    { name: 'pixel-7-chromium', use: { ...devices['Pixel 7'] }, grep: /@device/ },
  ],
});
