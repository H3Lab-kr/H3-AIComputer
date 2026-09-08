import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
const base = process.argv[2] || 'http://127.0.0.1:4173'
const output = process.argv[3] || '../../output/h3-web-review'
await fs.mkdir(output, { recursive: true })
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } })
const page = await context.newPage()
const errors = [],
  requests = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('requestfailed', (request) =>
  errors.push(`${request.url()}: ${request.failure()?.errorText}`),
)
page.on('request', (request) => requests.push(request.url()))
await page.goto(base, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.getByRole('button', { name: '움직임 멈추기', exact: true }).click()
await page.screenshot({ path: path.join(output, 'desktop.png'), fullPage: true })
await page.getByRole('button', { name: '내부 펼쳐보기' }).click()
await page.screenshot({ path: path.join(output, 'hardware-exploded.png') })
await page.getByRole('button', { name: '나의 H3 구성하기' }).click()
await page.screenshot({ path: path.join(output, 'consultation.png') })
await page.keyboard.press('Escape')
await page.locator('#showcase').scrollIntoViewIfNeeded()
await page.getByRole('button', { name: '쇼케이스 움직임 멈추기' }).click()
for (const name of ['01 NVIDIA RTX', '02 Mac mini', '03 Mac Studio', '04 Mac Pro']) {
  await page.locator('#showcase').getByRole('button', { name }).click()
  await page.waitForTimeout(250)
  await page
    .locator('.showcase-stage')
    .screenshot({ path: path.join(output, `showcase-${name.slice(3).replaceAll(' ', '-')}.png`) })
}
await page.getByRole('button', { name: 'Mac 워크스페이스', exact: true }).click()
await page.locator('.mac-package-grid').screenshot({ path: path.join(output, 'mac-packages.png') })
const performance = await page.evaluate(() => ({
  navigation: performance.getEntriesByType('navigation')[0]?.toJSON(),
  resources: performance
    .getEntriesByType('resource')
    .map((r) => ({ name: r.name, duration: r.duration, transferSize: r.transferSize })),
}))
await page.setViewportSize({ width: 375, height: 812 })
await page.emulateMedia({ reducedMotion: 'reduce' })
await page.goto(`${base}/?view=static`, { waitUntil: 'networkidle' })
await page.screenshot({ path: path.join(output, 'mobile.png'), fullPage: false })
for (const section of ['showcase', 'brand-film', 'systems']) {
  await page.locator(`#${section}`).scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(output, `mobile-${section}.png`) })
}
await fs.writeFile(
  path.join(output, 'browser-review.json'),
  JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      base,
      errors,
      externalRequests: [...new Set(requests)].filter(
        (url) => !url.startsWith(base) && !url.startsWith('data:'),
      ),
      performance,
      caveat: 'Localhost and software WebGL. Not a customer device/network benchmark.',
    },
    null,
    2,
  ),
)
await browser.close()
if (errors.length) process.exitCode = 1
