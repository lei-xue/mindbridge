import { test, expect } from '@playwright/test'
import { visitProviderPages } from './provider-pages.mjs'

for (const mode of ['County', 'ZIP code']) {
  test(`location remains available from ${mode} and immediately displays county results`, async ({ page, context }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: 33.7455, longitude: -117.8677, accuracy: 50 })
    const requests = []
    page.on('request', r => { if (r.url().includes('/api/la-county') || r.url().includes('google.com/maps')) requests.push(r.url()) })
    await page.goto('/')
    await page.getByRole('button', { name: mode, exact: true }).click()
    await page.getByRole('button', { name: 'Use current location', exact: true }).click()
    await expect(page.getByRole('button', { name: 'County', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByLabel('California county')).toHaveValue('Orange')
    await expect(page.locator('tr[data-provider="county-Orange"]')).toContainText('Orange County')
    const entries = await visitProviderPages(page.locator('section[aria-labelledby="local-support-heading"]'))
    expect(entries.filter(entry => entry.id.startsWith('oc-')).length).toBeGreaterThan(3)
    await expect(page.locator('#local-city-filter')).toHaveCount(0)
    expect(requests).toEqual([])
  })
}

for (const width of [320, 390, 1440]) {
  test(`simple search modes and controls fit at ${width}px without extra explanations`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/')
    const search = page.locator('section[aria-labelledby="local-support-heading"]')
    await expect(search.getByText('Search by city or ZIP instead')).toHaveCount(0)
    await expect(search.getByRole('heading', { name: 'Find in-person mental-health support in California' })).toHaveCount(0)
    await expect(search.getByRole('button', { name: 'City', exact: true })).toHaveCount(0)
    for (const mode of ['County', 'ZIP code']) {
      await search.getByRole('button', { name: mode, exact: true }).click()
      await expect(search.getByRole('button', { name: 'Use current location' })).toBeVisible()
      await expect(search.getByRole('button', { name: 'Find support options' })).toBeVisible()
      await expect(search.locator('form input, form select')).toHaveCount(1)
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
      await expect(search.getByText(/New requests send this ZIP/)).toHaveCount(0)
    }
    await search.getByRole('textbox', { name: 'California ZIP code' }).fill('90012')
    await expect(search.getByText(/New requests send this ZIP via Cloudflare/)).toBeVisible()
    await search.getByRole('textbox', { name: 'California ZIP code' }).fill('92708')
    await expect(search.getByText(/New requests send this ZIP/)).toHaveCount(0)
    await expect(search.getByRole('link', { name: 'Search coverage and privacy' })).toHaveAttribute('href', '/about')
    await expect(search.locator('details, summary')).toHaveCount(0)
    await page.screenshot({ path: `test-results/search-${width}.png`, fullPage: true })
  })
}

for (const county of ['Orange', 'San Diego', 'Butte']) {
  test(`${county} publicly listed street addresses are clickable map links`, async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('California county').selectOption(county)
    await page.getByRole('button', { name: 'Find support options' }).click()

    const links = page.getByRole('link', { name: /^Open in maps:/ })
    expect(await links.count()).toBeGreaterThan(0)
    await visitProviderPages(page.locator('section[aria-labelledby="local-support-heading"]'), async () => {
    for (const link of await links.all()) {
      const url = new URL(await link.getAttribute('href'))
      expect(url.origin).toBe('https://www.google.com')
      expect(url.pathname).toBe('/maps/search/')
      expect(url.searchParams.get('api')).toBe('1')
      expect(url.searchParams.get('query')).toBe(await link.textContent())
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
    })
    // Exercise navigation without contacting a third party or leaking device coordinates.
    const firstHref = await links.first().getAttribute('href')
    await page.context().route('https://www.google.com/maps/**', route => route.fulfill({ body: 'Map navigation intercepted by regression test', contentType: 'text/plain' }))
    const popupPromise = page.waitForEvent('popup')
    await links.first().click()
    const popup = await popupPromise
    await popup.waitForLoadState()
    expect(popup.url()).toBe(firstHref)
  })
}

test('licensed facilities and LA live directory street addresses also link to maps', async ({ page }) => {
  await page.route('**/api/la-county/locations', route => route.fulfill({ json: { results: [{ id: 'map-fixture', name: 'Map regression fixture', address: { lines: ['123 Public St'], city: 'Los Angeles', state: 'CA', postalCode: '90012' }, phones: [], websites: [], hours: [], languages: [], populations: [], accessibility: [], lastUpdated: null }], hasMore: false } }))
  await page.goto('/')
  await page.getByLabel('California county').selectOption('Sacramento')
  await page.getByRole('button', { name: 'Find support options' }).click()
  await page.locator('#local-city-filter').selectOption('Carmichael')
  const snapshot = page.locator('tr[data-provider^="license-"]')
  expect(await snapshot.getByRole('link', { name: /^Open in maps:/ }).count()).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'ZIP code', exact: true }).click()
  await page.getByLabel('California ZIP code').fill('90012')
  await page.getByRole('button', { name: 'Find support options' }).click()
  await expect(page.getByRole('link', { name: /Open in maps: 123 Public St/ })).toBeVisible()
})
