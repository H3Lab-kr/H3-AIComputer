import { defineConfig } from '@playwright/test'
const baseURL = process.env.H3_WEB_TEST_URL || 'http://127.0.0.1:4173'
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1440, height: 960 },
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: process.env.H3_WEB_TEST_URL
    ? undefined
    : { command: 'npm run dev -- --port 4173', url: baseURL, reuseExistingServer: true },
  reporter: [['list'], ['html', { open: 'never' }]],
})
