import { test, expect } from '@playwright/test'
test.use({ reducedMotion: 'reduce' })

for (const locale of ['en', 'es']) {
  for (const mode of ['county', 'city', 'zip']) {
    test(`${locale} location from ${mode} displays county records without guessing a city or requiring another form`, async ({ page }) => {
      await page.addInitScript(() => {
        navigator.geolocation.getCurrentPosition = ok => ok({ coords: { latitude: 33.8366, longitude: -117.9143, accuracy: 30 } })
      })
      await page.goto(locale === 'es' ? '/es' : '/')
      const labels = locale === 'es' ? { county: 'Condado', city: 'Ciudad', zip: 'Código postal' } : { county: 'County', city: 'City', zip: 'ZIP code' }
      await page.getByRole('button', { name: labels[mode], exact: true }).click()
      await page.getByRole('button', { name: /Use current location|Usar mi ubicación/ }).click()
      const search = page.locator('section[aria-labelledby="local-support-heading"]')
      await expect(search.locator('#california-search-value')).toHaveValue('Orange')
      await expect(search.locator('a[href="tel:8007238641"]')).toBeVisible()
      expect(await search.locator('tr[data-provider^="oc-"]').count()).toBeGreaterThan(3)
      await expect(search.locator('#local-city-filter')).toHaveCount(0)
      await expect(search).not.toContainText(/Choose a city|not ranked/)
      await expect(search.locator('details, summary')).toHaveCount(0)
      await search.screenshot({ path: `test-results/location-contact-${locale}-${mode}.png` })
      // A later explicit manual search must not stay stuck in the location result.
      await search.getByRole('button', { name: labels.city, exact: true }).click()
      await search.locator('#california-search-value').fill('Irvine')
      await search.locator('form').getByRole('button', { name: /Find support options|Buscar opciones/ }).click()
      await expect(search.locator('tr[data-provider^="oc-"]')).toHaveCount(1)
    })
  }
  test(`${locale} all 23 original resource cards expose a visible details link that really opens their page`, async ({ page }) => {
    test.setTimeout(90000)
    const home = locale === 'es' ? '/es' : '/'
    await page.goto(home)
    const cards = page.locator('#directory article')
    await expect(cards).toHaveCount(23)
    const resources = await cards.evaluateAll(cards => cards.map(card => ({ name: card.querySelector('h3').textContent, href: card.querySelector('a[href*="/resource/"]').getAttribute('href') })))
    expect(new Set(resources.map(r => r.href)).size).toBe(23)
    for (const resource of resources) {
      const card = page.locator('#directory article').filter({ has: page.getByRole('heading', { name: resource.name, exact: true }) })
      const link = card.getByRole('link', { name: /Details|Detalles/ })
      await expect(link).toBeVisible()
      await expect(card.locator('a[href*="/resource/"]')).toHaveCount(1)
      await link.click()
      await expect(page).toHaveURL(new RegExp(resource.href + '$'))
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(resource.name)
      await page.goBack()
      await expect(page.locator('#directory article')).toHaveCount(23)
    }
  })
}
