import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

for (const width of [320, 390, 1440]) {
  test(`crisis call and text actions are above fold and at least 44px at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 })
    await page.goto('/')
    const banner = page.getByRole('region', { name: 'Crisis support' })
    for (const [name, href] of [['Call 988', 'tel:988'], ['Text 988', 'sms:988']]) {
      const link = banner.getByRole('link', { name, exact: true })
      await expect(link).toHaveAttribute('href', href)
      const box = await link.boundingBox()
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.y + box.height).toBeLessThan(740)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    await expect(page.getByRole('link', { name: 'Ayuda en español · 988' })).toHaveAttribute('lang', 'es')
  })
}

for (const scenario of ['no-js', 'script-failed', 'script-and-css-failed']) {
  test(`readable directory and crisis links survive ${scenario}`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: scenario !== 'no-js', viewport: { width: 320, height: 740 } })
    const page = await context.newPage()
    if (scenario !== 'no-js') await page.route('**/assets/**', route => /\.js$/.test(route.request().url()) || scenario === 'script-and-css-failed' ? route.abort() : route.continue())
    await page.goto(baseURL)
    const banner = page.getByRole('region', { name: 'Crisis support' })
    for (const name of ['Call 988', 'Text 988']) {
      const box = await banner.getByRole('link', { name, exact: true }).boundingBox()
      expect(box.y + box.height).toBeLessThan(740)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
    await expect(page.getByRole('heading', { name: 'Browse resources' })).toBeVisible()
    await expect(page.locator('#directory article')).toHaveCount(20)
    await expect(page.getByRole('button', { name: 'Use current location' })).toBeHidden()
    await expect(page.getByRole('searchbox', { name: 'Search' })).toBeHidden()
    await page.getByRole('link', { name: 'About', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'About MindBridge' })).toBeVisible()
    await expect(page.locator('main')).toContainText('Lei Xue')
    await context.close()
  })
}

for (const path of ['/', '/about', '/resource/988-lifeline']) {
  test(`static ${path} has crawlable content and accurate metadata`, async ({ request }) => {
    const response = await request.get(path)
    expect(response.status()).toBe(200)
    const html = await response.text()
    expect(html).toContain('<html lang="en">')
    expect(html).toContain(`rel="canonical" href="https://mindbridge.leixue.dev${path}"`)
    expect(html).toContain('property="og:title"')
    expect(html).toContain('application/ld+json')
    expect(html).toContain('href="sms:988"')
    expect(html).toContain('href="tel:988"')
    expect(html).toContain('favicon.svg')
    expect(html).not.toContain('<div id="root"></div>')
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])
    expect(schema['@type']).toBe('WebSite')
  })
  test(`automated WCAG A/AA scan for ${path}`, async ({ page }) => {
    await page.goto(path)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    expect(results.violations.map(v => ({ id: v.id, description: v.description, nodes: v.nodes.map(n => ({target: n.target, summary: n.failureSummary})) }))).toEqual([])
  })
}

test('source check scope and correction reporting are honest and privacy preserving', async ({ page, context, baseURL }) => {
  const origins = new Set()
  page.on('request', r => origins.add(new URL(r.url()).origin))
  await page.goto('/resource/988-lifeline')
  await expect(page.locator('time')).toHaveAttribute('datetime', '2026-09-30')
  const link = page.getByRole('link', { name: /Report an issue with 988/ })
  const href = await link.getAttribute('href')
  expect(href).toMatch(/^mailto:hi@leixue\.dev\?/)
  expect(decodeURIComponent(href)).toContain('Please do not include personal health information')
  expect(await context.cookies()).toEqual([])
  expect([...origins]).toEqual([new URL(baseURL).origin])
  await page.goto('/about')
  await expect(page.locator('main')).toContainText('not that a test call was made')
  await expect(page.locator('main')).toContainText('not medical advice')
  await expect(page.getByRole('link', { name: '911', exact: true })).toHaveAttribute('href', 'tel:911')
})
