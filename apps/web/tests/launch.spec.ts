import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('desktop customer journey and hardware controls', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('생각을 만들고')
  await expect(page.locator('.hero canvas')).toBeVisible({ timeout: 30000 })
  // 히어로는 내부를 펼친 상태로 시작한다.
  const reassemble = page.getByRole('button', { name: '다시 조립하기' })
  await expect(reassemble).toHaveAttribute('aria-pressed', 'true')
  await reassemble.click()
  const explode = page.getByRole('button', { name: '내부 펼쳐보기' })
  await expect(explode).toHaveAttribute('aria-pressed', 'false')
  await explode.click()
  await expect(page.getByRole('button', { name: '다시 조립하기' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: '움직임 멈추기', exact: true }).click()
  await expect(page.getByRole('button', { name: '움직임 재생', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: '세 모델 자세히 비교' }).click()
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.getByRole('table')).toContainText('96GB ECC')
  await page.getByRole('button', { name: 'H3 Studio 구성 상담', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('관심 있는 컴퓨터')).toHaveValue('studio')
  await dialog.getByLabel('만들고 싶은 것, 해결하고 싶은 일').fill('이미지 제작과 사내 문서 검색')
  await expect(dialog.getByRole('link', { name: '이메일로 상담 이어가기' })).toHaveAttribute(
    'href',
    /^mailto:hi@h3lab.kr\?subject=/,
  )
  const download = page.waitForEvent('download')
  await dialog.getByRole('button', { name: '구성안 저장' }).click()
  expect((await download).suggestedFilename()).toBe('H3-studio-consultation.txt')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'H3 Studio 구성 상담', exact: true })).toBeFocused()
  await expect(page.locator('#systems .product-card')).toHaveCount(3)
  await expect(page.locator('#systems .mac-package-grid article')).toHaveCount(3)
  await page.locator('#mac-family-title').scrollIntoViewIfNeeded()
  await expect(page.getByRole('button', { name: 'Mac 도입 상담' })).toBeVisible()
  expect(errors).toEqual([])
})

test('mobile, reduced motion and static fallback', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?view=static')
  await expect(page.locator('canvas')).toHaveCount(0)
  await page.getByRole('button', { name: '메뉴 열기' }).click()
  await expect(page.getByRole('navigation')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: '메뉴 열기' })).toBeFocused()
  await page.getByRole('button', { name: '메뉴 열기' }).click()
  await page.getByRole('navigation').getByRole('link', { name: 'AI 컴퓨터', exact: true }).click()
  await expect(page.getByRole('button', { name: '메뉴 열기' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy()
  await page.getByRole('button', { name: 'H3 Core 구성 상담', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(
    await page
      .getByRole('dialog')
      .evaluate((el) => el.getBoundingClientRect().width <= window.innerWidth),
  ).toBeTruthy()
  await page.getByRole('button', { name: '상담 창 닫기' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('accessibility of main page and consultation', async ({ page }) => {
  await page.goto('/?view=static')
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(result.violations).toEqual([])
  await page.getByRole('button', { name: '나의 H3 구성하기' }).click()
  const modal = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(modal.violations).toEqual([])
})

test('signature collection selects the matching consultation package', async ({ page }) => {
  await page.goto('/?view=static')
  const showcase = page.locator('#showcase')
  for (const [button, value, title] of [
    ['02 Mac mini', 'mini', 'H3 Mini'],
    ['03 Mac Studio', 'macstudio', 'H3 Mac Studio'],
    ['04 Mac Pro', 'macpro', 'H3 Mac Pro'],
  ]) {
    await showcase.getByRole('button', { name: button }).click()
    await expect(showcase.getByRole('heading', { name: title, exact: true })).toBeVisible()
    await showcase.getByRole('button', { name: '이 패키지 상담하기' }).click()
    await expect(page.getByRole('dialog').getByLabel('관심 있는 컴퓨터')).toHaveValue(value)
    await page.keyboard.press('Escape')
  }
  await expect(page.locator('#systems .product-card')).toHaveCount(3)
  await expect(page.locator('#systems .mac-package-grid article')).toHaveCount(3)
  await page.locator('#mac-family-title').scrollIntoViewIfNeeded()
  await expect(page.locator('.mac-package-grid article')).toHaveCount(3)
  const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(scan.violations).toEqual([])
})

test('small phone layout and WebGL failure remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (String(type).includes('webgl')) return null
      return original.apply(this, [type, ...args] as Parameters<typeof original>)
    } as typeof original
  })
  await page.goto('/')
  await expect(page.locator('.hero .static-hardware')).toBeVisible()
  await page.locator('#showcase').scrollIntoViewIfNeeded()
  await expect(page.locator('#showcase .showroom-fallback')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await page.getByRole('button', { name: '나의 H3 구성하기' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('brand film plays a complete 30-second HD asset', async ({ page }) => {
  await page.goto('/?view=static')
  await page.getByRole('button', { name: '브랜드 필름 보기' }).click()
  const video = page.locator('#brand-film video')
  await expect(video).toHaveJSProperty('videoWidth', 1920)
  await expect(video).toHaveJSProperty('videoHeight', 1080)
  await expect(video).toHaveJSProperty('duration', 30)
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime))
    .toBeGreaterThan(0.2)
  await video.evaluate((el: HTMLVideoElement) => {
    el.pause()
    el.currentTime = 29
  })
  await expect(video).toHaveJSProperty('paused', true)
})

test('robot simulation requires approval, pauses and resets without device commands', async ({
  page,
}) => {
  await page.goto('/?view=static')
  const lab = page.locator('#robotics')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('AI 컴퓨터')
  await expect(lab).toContainText('실제 장치 연결 없음')
  await lab.getByRole('button', { name: '작업 시연 시작' }).click()
  await expect(lab.getByRole('button', { name: '시뮬레이션 실행 승인' })).toBeVisible()
  await expect(lab.getByRole('status')).toHaveText('실행 승인을 기다립니다')
  await lab.getByRole('button', { name: '시뮬레이션 실행 승인' }).click()
  await lab.getByRole('button', { name: '시연 일시 정지' }).click()
  await expect(lab.getByRole('status')).toHaveText('시연 일시 정지')
  await lab.getByRole('button', { name: '시연 계속하기' }).click()
  await expect(lab.getByRole('status')).toHaveText('시연 완료', { timeout: 15000 })
  await expect(lab.locator('.simulation-result')).toContainText('실제 촬영·AI 생성 결과가 아닙니다')
  await lab.getByRole('button', { name: '시연 초기화' }).click()
  await expect(lab.getByRole('button', { name: '작업 시연 시작' })).toBeVisible()
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
})

test('language switch translates content, consultation and remembers selection', async ({
  page,
}) => {
  await page.goto('/?view=static&lang=ko')
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('#download .desktop-shot img')).toHaveAttribute(
    'src',
    '/brand/h3-mac-041-en.png',
  )
  await expect(page.getByRole('heading', { level: 1 })).toContainText('H3 AI Computer')
  await expect(page.locator('body')).not.toContainText('당신')
  await page.getByRole('button', { name: 'Configure my H3', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('Tell us about')
  await expect(page.getByLabel('Computer of interest')).toBeVisible()
  await page.getByRole('button', { name: 'Close consultation' }).click()
  await page.goto('/?view=static')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await page.getByRole('button', { name: 'KO', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko')
  await expect(page.locator('#download .desktop-shot img')).toHaveAttribute(
    'src',
    '/brand/h3-mac-041-ko.png',
  )
})

test('English interface meets accessibility checks', async ({ page }) => {
  await page.goto('/?view=static&lang=en')
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(result.violations).toEqual([])
})

test('English film has its own narration asset and captions', async ({ page }) => {
  await page.goto('/?view=static&lang=en')
  await expect(page.locator('#brand-film source')).toHaveAttribute(
    'src',
    '/media/h3-brand-film-en.mp4',
  )
  await expect(page.locator('#brand-film track')).toHaveAttribute('srcLang', 'en')
  await page.getByRole('button', { name: 'Watch the brand film' }).click()
  await expect(page.locator('#brand-film video')).toHaveJSProperty('duration', 30)
  await expect(page.locator('#brand-film video')).toHaveJSProperty('videoWidth', 1920)
})
