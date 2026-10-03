import { test, expect } from '@playwright/test'

for (const width of [320, 390]) {
  for (const route of ['/', '/es']) {
    test(`${route} enlarged text preserves the whole pinned header and left-hand sprout at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(route)
      await page.addStyleTag({ content: 'html { font-size: 32px !important; }' })
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto')
      const sprout = await page.locator('[data-sprout-speech]').first().locator('[data-sprout]').boundingBox()
      const bubble = await page.locator('[data-speech-bubble]').first().boundingBox()
      expect(sprout.width).toBe(80)
      expect(sprout.x + sprout.width).toBeLessThanOrEqual(bubble.x)
      await page.keyboard.press('Tab')
      await expect(page.locator('a').first()).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page.locator('main')).toBeFocused()
      const mainTop = await page.locator('main').evaluate(e => e.getBoundingClientRect().top)
      const topBottom = await page.locator('[data-top-stack]').count() ? await page.locator('[data-top-stack]').evaluate(e => e.getBoundingClientRect().bottom) : await page.locator('header').evaluate(e => e.getBoundingClientRect().bottom)
      expect(mainTop).toBeGreaterThanOrEqual(topBottom - 2)
    })
  }
}
