import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import fs from 'node:fs/promises'
import path from 'node:path'
const base = process.argv[2] || 'http://127.0.0.1:4173'
const dest = path.resolve(process.argv[3] || '../../output/h3-brand-film')
const language = process.argv[4] === 'en' ? 'en' : 'ko'
const firstFrame = Number(process.argv[5] || 0)
const lastFrame = Number(process.argv[6] || 720)
if (
  !Number.isInteger(firstFrame) ||
  !Number.isInteger(lastFrame) ||
  firstFrame < 0 ||
  lastFrame > 720 ||
  firstFrame >= lastFrame
)
  throw new Error('Invalid frame range')
const ffmpeg = process.env.FFMPEG || 'ffmpeg'
await fs.mkdir(dest, { recursive: true })
const output = path.join(dest, 'picture.mp4')
// Refuse to overwrite a previous render.
try {
  await fs.access(output)
  throw new Error('picture.mp4 exists; choose a new output directory')
} catch (e) {
  if (e.code !== 'ENOENT') throw e
}
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
})
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const encoder = spawn(
  ffmpeg,
  [
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'image2pipe',
    '-framerate',
    '24',
    '-vcodec',
    'mjpeg',
    '-i',
    'pipe:0',
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    output,
  ],
  { stdio: ['pipe', 'ignore', 'inherit'] },
)
const done = once(encoder, 'close')
try {
  await page.goto(`${base}/?film=1&lang=${language}`)
  await page.waitForFunction(() => window.setFilmTime)
  await page.evaluate(() => document.fonts.ready)
  for (let frame = firstFrame; frame < lastFrame; frame++) {
    await page.evaluate((t) => window.setFilmTime(t), frame / 24)
    const jpg = await page.screenshot({ type: 'jpeg', quality: 95 })
    if (!encoder.stdin.write(jpg)) await once(encoder.stdin, 'drain')
    if (frame % 72 === 0) console.log(`frame ${frame}/720`)
  }
  encoder.stdin.end()
  const [code] = await done
  if (code !== 0) throw new Error(`ffmpeg exit ${code}`)
  await fs.writeFile(
    path.join(dest, 'render.json'),
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        language,
        fps: 24,
        frames: lastFrame - firstFrame,
        firstFrame,
        lastFrame,
        width: 1920,
        height: 1080,
        errors,
        source: 'apps/web/src/BrandFilm.tsx + ProductModels.tsx + HardwareScene.tsx',
        renderer: 'Chromium software WebGL, deterministic time samples',
        generationModel: null,
      },
      null,
      2,
    ),
  )
  if (errors.length) throw new Error(errors.join('\n'))
} finally {
  await browser.close()
  if (encoder.exitCode === null) encoder.kill('SIGTERM')
}
