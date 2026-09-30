import { defineConfig } from '@playwright/test'
const liveURL = process.env.MINDBRIDGE_BASE_URL
export default defineConfig({
  testDir: './tests', testMatch: '**/*.production.mjs', fullyParallel: true, reporter: 'list',
  use: { baseURL: liveURL || 'http://127.0.0.1:4183', browserName: 'chromium', viewport: { width: 390, height: 844 } },
  webServer: liveURL ? undefined : { command: 'npm run preview -- --host 127.0.0.1 --port 4183', url: 'http://127.0.0.1:4183', reuseExistingServer: !process.env.CI },
})
