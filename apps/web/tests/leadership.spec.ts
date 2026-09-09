import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('leadership profiles, language navigation and mobile accessibility', async ({ page }) => {
  await page.goto('/leadership?lang=ko')
  await expect(page).toHaveTitle('임원 소개 | H3 AI 컴퓨터')
  const cards = page.locator('.leader-card')
  await expect(cards).toHaveCount(3)
  for (const [index, name, role] of [
    [0, '정락현', '대표'],
    [1, '이강훈', '기술총괄'],
    [2, '문아라', '운영총괄'],
  ] as const) {
    await expect(cards.nth(index).getByRole('heading', { name })).toBeVisible()
    await expect(cards.nth(index).locator('.leader-identity p')).toHaveText(role)
    await expect(cards.nth(index).locator('img')).toBeVisible()
  }
  expect(
    await cards
      .locator('img')
      .evaluateAll((images) =>
        images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
      ),
  ).toBe(true)
  await expect(cards.nth(0).getByRole('listitem')).toHaveCount(7)
  await expect(cards.nth(1).getByRole('listitem')).toHaveCount(2)
  await expect(cards.nth(2).getByRole('listitem')).toHaveCount(2)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await expect(page).toHaveURL(/leadership\?lang=en/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('The people')
  await expect(cards.nth(1)).toContainText('Head of Technology')
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('link', { name: 'Explore H3' }).click()
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Leadership' }),
  ).toHaveAttribute('href', '/leadership?lang=en')
})
