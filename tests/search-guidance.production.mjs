import { test, expect } from '@playwright/test'
const local = page => page.locator('section[aria-labelledby="local-support-heading"]')
for (const locale of ['en', 'es']) {
  const mode = { zip: locale === 'es' ? 'Código postal' : 'ZIP code', city: locale === 'es' ? 'Ciudad' : 'City', county: locale === 'es' ? 'Condado' : 'County' }
  const cta = locale === 'es' ? 'Buscar por condado' : 'Search by County'
  for (const width of [320, 390, 768, 1024, 1440]) {
    test(`${locale} support and browse sprouts align at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(locale === 'es' ? '/es' : '/')
      const positions = await page.locator('section[aria-labelledby="local-support-heading"] [data-sprout-speech], #directory > div > [data-sprout-speech]').evaluateAll(els => els.map(el => {
        const svg = el.querySelector('[data-sprout]').getBoundingClientRect()
        const bubble = el.querySelector('[data-speech-bubble]').getBoundingClientRect()
        return { x: svg.x, bubbleX: bubble.x, cy: svg.y + svg.height / 2, bubbleCy: bubble.y + bubble.height / 2 }
      }))
      expect(positions).toHaveLength(2)
      expect(positions[0].x).toBe(positions[1].x)
      expect(positions[0].bubbleX).toBe(positions[1].bubbleX)
      for (const row of positions) expect(Math.abs(row.cy - row.bubbleCy)).toBeLessThanOrEqual(1)
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
      await expect(page.locator('#directory article')).toHaveCount(23)
    })
  }
  for (const [zip, rows] of [['99999', 0], ['90620', 1]]) {
    test(`${locale} ZIP ${zip} warm guidance offers optional County search without false results`, async ({ page }) => {
      const requests = []
      page.on('request', request => { if (request.url().includes('/api/')) requests.push(request.url()) })
      await page.goto(locale === 'es' ? '/es' : '/')
      await local(page).getByRole('button', { name: mode.zip, exact: true }).click()
      await page.locator('#california-search-value').fill(zip)
      await local(page).locator('form').getByRole('button', { name: /Find support options|Buscar opciones/ }).click()
      await expect(local(page).locator('tr[data-provider]')).toHaveCount(rows)
      await expect(local(page).locator('[aria-live="polite"] [data-sprout="hug"]')).toHaveCount(1)
      await expect(local(page).getByRole('status')).toContainText(locale === 'es' ? 'área más amplia' : 'broader area')
      await expect(local(page).locator('#choose-county')).toHaveCount(0)
      if (rows === 1) await expect(local(page).locator('tr[data-provider^="county-"]')).toHaveCount(1)
      else await expect(local(page).locator('a[href="tel:211"]')).toBeVisible()
      await local(page).getByRole('button', { name: cta, exact: true }).click()
      await expect(page.locator('#california-search-value')).toHaveJSProperty('tagName', 'SELECT')
      await expect(page.locator('#california-search-value')).toHaveValue('')
      await expect(page.locator('#california-search-value')).toBeFocused()
      await expect(local(page).getByRole('button', { name: mode.county, exact: true })).toHaveAttribute('aria-pressed', 'true')
      await expect(local(page).locator('tr[data-provider]')).toHaveCount(0)
      expect(requests).toEqual([])
      expect(page.url()).not.toContain(zip)
    })
  }
  for (const previousMode of ['county', 'zip']) {
    test(`${locale} cancelling location from ${previousMode} immediately restores manual County entry and ignores late callbacks`, async ({ page }) => {
      await page.clock.install()
      await page.addInitScript(() => {
        navigator.geolocation.getCurrentPosition = ok => { window.deliverLateLocation = () => ok({ coords: { latitude: 39.7285, longitude: -121.8375, accuracy: 50 } }) }
      })
      await page.goto(locale === 'es' ? '/es' : '/')
      if (previousMode === 'county') await page.locator('#california-search-value').selectOption('Colusa')
      else {
        await local(page).getByRole('button', { name: mode[previousMode], exact: true }).click()
        await page.locator('#california-search-value').fill(previousMode === 'zip' ? '99999' : 'Santa Ana')
      }
      await local(page).getByRole('button', { name: /Use current location|Usar mi ubicación/ }).click()
      await expect(local(page).locator('form button:disabled')).toHaveCount(1)
      const cancel = local(page).getByRole('button', { name: /Cancel and choose|Cancelar y elegir/ })
      await expect(cancel).toBeVisible()
      expect((await cancel.boundingBox()).height).toBeGreaterThanOrEqual(44)
      await cancel.click()
      await expect(local(page).locator('form button:disabled')).toHaveCount(0)
      await expect(page.locator('#california-search-value')).toHaveJSProperty('tagName', 'SELECT')
      await expect(page.locator('#california-search-value')).toHaveValue(previousMode === 'county' ? 'Colusa' : '')
      await expect(page.locator('#california-search-value')).toBeFocused()
      await page.evaluate(() => window.deliverLateLocation())
      await page.clock.runFor(12500)
      await expect(local(page).getByRole('status')).toHaveCount(0)
      await expect(local(page).locator('tr[data-provider="county-Butte"]')).toHaveCount(0)
    })
  }
}
