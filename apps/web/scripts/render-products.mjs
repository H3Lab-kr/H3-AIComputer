import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
const base = process.argv[2] || 'http://127.0.0.1:4173',
  out = process.argv[3] || 'public/brand'
await fs.mkdir(out, { recursive: true })
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
try {
  const page = await browser.newPage({
    viewport: { width: 900, height: 760 },
    deviceScaleFactor: 1,
  })
  for (const kind of ['nvidia', 'mini', 'studio', 'macpro']) {
    await page.goto(`${base}/?product=${kind}`)
    await page.waitForSelector('canvas')
    await page.evaluate(() => {
      document.documentElement.style.background = 'transparent'
      document.body.style.background = 'transparent'
    })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(out, `product-${kind}.png`), omitBackground: true })
    console.log(kind)
  }
} finally {
  await browser.close()
}
