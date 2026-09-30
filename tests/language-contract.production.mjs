import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync } from 'node:fs'

const resources = JSON.parse(readFileSync(new URL('../src/data/resources.json', import.meta.url)))
const origin = 'https://mindbridge.leixue.dev'
const paths = ['', '/about', ...resources.map(r => `/resource/${r.id}`)]

test('switch preserves page, public filters and history while updating document metadata', async ({ page }) => {
  await page.goto('/?region=California#directory')
  await page.locator('header').getByRole('link', { name: /español/i }).click()
  await expect(page).toHaveURL(/\/es\?region=California#directory$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect(page.locator('#filter-region')).toHaveValue('California')
  await expect(page).toHaveTitle(/Encuentra ayuda/)
  await page.locator('header a[href="/es/about"]').click()
  await expect(page.locator('main h1')).toHaveText('Acerca de MindBridge')
  await page.locator('header').getByRole('link', { name: /English/i }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.locator('main h1')).toHaveText('About MindBridge')
  await page.goBack()
  await expect(page.locator('main h1')).toHaveText('Acerca de MindBridge')
  await page.goForward()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await page.goto('/es/resource/988-lifeline')
  await page.locator('header').getByRole('link', { name: /English/i }).click()
  await expect(page).toHaveURL(/\/resource\/988-lifeline$/)
  await page.locator('header').getByRole('link', { name: /español/i }).click()
  await expect(page).toHaveURL(/\/es\/resource\/988-lifeline$/)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${origin}/es/resource/988-lifeline`)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
})

test('Spanish keyword and issue filters work without persisting search text', async ({ page }) => {
  await page.goto('/es')
  await page.locator('#filter-q').fill('ansiedad')
  await expect(page.locator('#directory article')).not.toHaveCount(0)
  await expect(page.locator('#directory')).toContainText('Ansiedad')
  expect(page.url()).not.toContain('ansiedad')
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0])
  await page.getByRole('button', { name: 'Borrar filtros', exact: true }).click()
  await page.locator('#filter-issue').selectOption('Depression')
  await expect(page.locator('#directory')).toContainText('Depresión')
  await page.locator('#directory a[href^="/es/resource/"]').first().click()
  await expect(page).toHaveURL(/\/es\/resource\//)
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
})

test('Spanish Irvine results are concise and sparse counties keep an actionable referral', async ({ page }) => {
  await page.goto('/es')
  await page.locator('#california-search-value').selectOption('Orange')
  await page.locator('form').getByRole('button', { name: /Buscar/ }).click()
  await page.locator('#local-city-filter').selectOption('Irvine')
  const result = page.locator('tr[data-provider^="oc-"]')
  await expect(result).toContainText('Progeny Psychiatric Group - Irvine')
  await expect(result.locator('a[href="tel:+19497227118"]')).toBeVisible()
  await expect(result).not.toContainText('Call before visiting')
  await expect(page.locator('section[aria-labelledby="local-support-heading"] details')).toHaveCount(0)
  await expect(result.getByRole('link', { name: 'OC BHP' })).toBeVisible()
  await page.getByRole('button', { name: 'Condado', exact: true }).click()
  await page.locator('#california-search-value').selectOption('Alpine')
  await page.locator('form').getByRole('button', { name: /Buscar/ }).click()
  await expect(page.getByRole('link', { name: /Llamar al plan/i })).toBeVisible()
})

test('Spanish denied location and form validation remain useful', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: (_ok, fail) => fail({ code: 1 }) } }))
  await page.goto('/es')
  await page.getByRole('button', { name: /ubicación actual/i }).click()
  await expect(page.getByRole('status').filter({ hasText: /permiso/i })).toBeVisible()
  await page.locator('form').getByRole('button', { name: /Buscar/ }).click()
  await expect(page.getByRole('alert')).toContainText('California')
  await expect(page.getByRole('alert')).not.toContainText('Choose')
})

// Coordinator-owned acceptance checks: test the built HTML, not Vite's dev fallback.
test('Spanish LA live search discloses transfer and localizes network failure', async ({ page }) => {
  // Deliberately abort the real request: this checks failure handling, not County data.
  await page.route('**/api/la-county/locations', route => route.abort())
  await page.goto('/es')
  await page.getByRole('button', { name: 'Código postal', exact: true }).click()
  await page.locator('#california-search-value').fill('90630')
  await page.locator('form').getByRole('button', { name: /Buscar/ }).click()
  await page.locator('#choose-county').selectOption('Los Angeles')
  const live = page.getByRole('button', { name: /Buscar.*vivo/i })
  await expect(live).toBeVisible()
  await expect(live.locator('..')).toContainText('Cloudflare')
  await live.click()
  await expect(page.getByRole('alert')).toContainText('La búsqueda en el directorio no está disponible temporalmente.')
  expect(page.url()).not.toContain('Pasadena')
})

test('all Spanish routes serve localized HTML, own canonicals, alternate languages, and translated descriptions', async ({ request }) => {
  test.setTimeout(90_000)
  for (const suffix of paths) {
    const path = `/es${suffix}`
    const response = await request.get(path)
    expect(response.ok(), path).toBe(true)
    const html = await response.text()
    expect(html, path).toMatch(/<html[^>]+lang="es"/)
    expect(html, path).toContain(`href="${origin}${path}"`)
    expect(html, path).toMatch(/hreflang="en"/i)
    expect(html, path).toMatch(/hreflang="es"/i)
    expect(html, path).toMatch(/hreflang="x-default"/i)
    expect(html, path).toMatch(/property="og:locale" content="es_US"/)
    expect(html, path).toContain('href="tel:988"')
    expect(html, path).toContain('href="sms:988"')
    expect(html, path).not.toContain('Phone and website links work without JavaScript.')
    expect(html, path).not.toContain('You are not alone.')
    if (suffix.startsWith('/resource/')) {
      const r = resources.find(r => suffix.endsWith(`/${r.id}`))
      expect(html, path).not.toContain(r.description)
      expect(html, path).toContain(r.name.replaceAll('&', '&amp;'))
    }
  }
  const sitemap = await (await request.get('/sitemap.xml')).text()
  for (const suffix of paths) expect(sitemap).toContain(`${origin}/es${suffix}`)
})

for (const width of [320, 390, 1440]) {
  test(`Spanish crisis and language controls remain accessible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 })
    await page.goto('/es')
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page.locator('main h1')).not.toHaveText('You are not alone.')
    const languageSwitch = page.locator('header a[href="/"], header button[aria-label*="English"], header button[aria-label*="inglés"]')
    // Home brand can also target '/', so prefer a switch identified by its language name.
    const control = page.locator('header').getByRole('link', { name: /English|inglés|EN\b/i }).or(page.locator('header').getByRole('button', { name: /English|inglés|EN\b/i })).first()
    await expect(control).toBeVisible()
    expect((await control.boundingBox()).height).toBeGreaterThanOrEqual(44)
    expect(await languageSwitch.count()).toBeGreaterThan(0)
    for (const target of ['tel:988', 'sms:988']) {
      const link = page.locator(`a[href="${target}"]`).first()
      await expect(link).toBeVisible()
      const box = await link.boundingBox()
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.y + box.height).toBeLessThanOrEqual(740)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(a11y.violations).toEqual([])
    expect(await page.context().cookies()).toEqual([])
  })
}

for (const failure of ['no-js', 'script-and-css-failed']) {
  test(`Spanish static pages and navigation survive ${failure}`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: failure !== 'no-js', viewport: { width: 320, height: 740 } })
    const page = await context.newPage()
    if (failure !== 'no-js') await page.route('**/*', route => ['script', 'stylesheet'].includes(route.request().resourceType()) ? route.abort() : route.continue())
    await page.goto(`${baseURL}/es`)
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page.locator('main h1')).not.toHaveText('You are not alone.')
    const call = page.locator('a[href="tel:988"]').first()
    await expect(call).toBeVisible()
    expect((await call.boundingBox()).y + (await call.boundingBox()).height).toBeLessThanOrEqual(740)
    await page.locator('header a[href="/es/about"]').click()
    await expect(page).toHaveURL(/\/es\/about\/?$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page.locator('main')).not.toContainText('About MindBridge')
    await context.close()
  })
}
