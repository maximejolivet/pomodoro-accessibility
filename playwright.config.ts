import { defineConfig, devices } from '@playwright/test';

/**
 * Tests de non-régression d'accessibilité : ils démarrent l'app et la parcourent
 * comme un utilisateur (clavier, focus, contrastes) — voir tests/a11y.spec.ts.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 420, height: 900 } } }
  ],
  webServer: {
    command: 'npm start -- --port 4200',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000
  }
});
