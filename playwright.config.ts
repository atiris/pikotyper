import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  use: { baseURL: 'http://localhost:4173/pikotyper/', viewport: { width: 1366, height: 768 } },
  webServer: { command: 'npm run build && npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173/pikotyper/', reuseExistingServer: true, timeout: 120_000 },
});
