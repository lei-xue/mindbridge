import { test, expect } from '@playwright/test'

for (const locale of ['en', 'es']) {
  for (const stage of ['no-browser-callback', 'boundary-download-stalled']) {
    test(`${locale} ${stage} exits location loading and ignores a late response`, async ({ page }) => {
      await page.clock.install()
      await page.addInitScript(stage => {
        navigator.geolocation.getCurrentPosition = ok => {
          const position = { coords: { latitude: 39.7285, longitude: -121.8375, accuracy: 50 } }
          window.deliverLateLocation = () => ok(position)
          if (stage === 'boundary-download-stalled') ok(position)
        }
      }, stage)
      if (stage === 'boundary-download-stalled') await page.route('**/*countyLocation*', () => {})
      await page.goto(locale === 'es' ? '/es' : '/')
      await page.locator('#california-search-value').selectOption('Colusa')
      await page.getByRole('button', { name: /Use current location|Usar mi ubicación/ }).click()
      await expect(page.locator('form button:disabled')).toHaveCount(1)
      await page.clock.runFor(12500)
      await expect(page.locator('form button:disabled')).toHaveCount(0)
      await expect(page.getByRole('status')).toContainText(locale === 'es' ? 'La ubicación tardó demasiado.' : 'Location timed out')
      await expect(page.locator('#california-search-value')).toHaveValue('Colusa')
      if (stage === 'no-browser-callback') await page.evaluate(() => window.deliverLateLocation())
      await page.locator('form').getByRole('button', { name: /Find support options|Buscar opciones/ }).click()
      await expect(page.locator('tr[data-provider="county-Colusa"]')).toBeVisible()
      await expect(page.locator('tr[data-provider="county-Butte"]')).toHaveCount(0)
    })
  }
}

test('throwing browser location implementation cannot leave the button disabled', async ({ page }) => {
  await page.addInitScript(() => { navigator.geolocation.getCurrentPosition = () => { throw new Error('Location provider unavailable') } })
  await page.goto('/')
  await page.getByRole('button', { name: 'Use current location', exact: true }).click()
  await expect(page.locator('form button:disabled')).toHaveCount(0)
  await expect(page.getByRole('status')).toContainText('Your device could not determine a location')
})
