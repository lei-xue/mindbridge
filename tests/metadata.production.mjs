import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const resources = JSON.parse(readFileSync(new URL('../src/data/resources.json', import.meta.url)))
const origin = 'https://mindbridge.leixue.dev'
const englishPaths = ['', '/about', ...resources.map(r => `/resource/${r.id}`)]
const routes = [...englishPaths, ...englishPaths.map(p => p === '' ? '/es' : `/es${p}`)]

const managed = [
  'meta[name="description"]', 'meta[name="theme-color"]', 'link[rel="canonical"]',
  'meta[property="og:type"]', 'meta[property="og:site_name"]', 'meta[property="og:title"]',
  'meta[property="og:description"]', 'meta[property="og:url"]', 'meta[property="og:locale"]',
  'meta[property="og:locale:alternate"]', 'meta[property="og:image"]', 'meta[property="og:image:type"]',
  'meta[property="og:image:width"]', 'meta[property="og:image:height"]', 'meta[property="og:image:alt"]',
  'meta[name="twitter:card"]', 'meta[name="twitter:title"]', 'meta[name="twitter:description"]',
  'meta[name="twitter:image"]', 'meta[name="twitter:image:alt"]',
  'link[rel="alternate"][hreflang="en"]', 'link[rel="alternate"][hreflang="es"]',
  'link[rel="alternate"][hreflang="x-default"]', 'script[type="application/ld+json"]',
]

async function expectNoDuplicates(page, label) {
  for (const selector of managed) {
    expect(await page.locator(selector).count(), `${label}: ${selector}`).toBe(1)
  }
}

test('the sharing card is served as a 1200x630 PNG for both locales', async ({ request }) => {
  for (const locale of ['en', 'es']) {
    const response = await request.get(`/social/mindbridge-${locale}-1200x630.png`)
    expect(response.status(), locale).toBe(200)
    const body = await response.body()
    expect(body.subarray(1, 4).toString('latin1')).toBe('PNG')
    expect(body.readUInt32BE(16)).toBe(1200)
    expect(body.readUInt32BE(20)).toBe(630)
  }
})

test('every built route serves complete, localized, duplicate-free metadata', async ({ request }) => {
  test.setTimeout(120_000)
  for (const path of routes) {
    const locale = path.startsWith('/es') ? 'es' : 'en'
    const response = await request.get(path === '' ? '/' : path)
    expect(response.ok(), path).toBe(true)
    const html = await response.text()
    const count = (pattern) => (html.match(pattern) || []).length
    expect(html, path).toMatch(new RegExp(`<html lang="${locale}"`))
    expect(count(/<meta\s+property="og:image"/g), path).toBe(1)
    expect(count(/<meta\s+property="og:title"/g), path).toBe(1)
    expect(count(/<meta\s+name="twitter:image"/g), path).toBe(1)
    expect(count(/<link\s+rel="canonical"/g), path).toBe(1)
    expect(count(/<script\s+type="application\/ld\+json">/g), path).toBe(1)
    expect(html, path).toContain(`href="${origin}${path === '' ? '/' : path}"`)
    expect(html, path).toContain(`content="${origin}/social/mindbridge-${locale}-1200x630.png"`)
    expect(html, path).toContain(`content="${locale}_US"`)
    expect(html, path).toContain(`content="${locale === 'es' ? 'en' : 'es'}_US"`)
    expect(html, path).toContain('content="#506a56"')
    expect(html, path).toContain('content="summary_large_image"')
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])
    expect(schema['@type'], path).toBe('WebSite')
    expect(schema.inLanguage, path).toBe(locale)
  }
})

test('client-side route changes keep exactly one of every metadata tag', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expectNoDuplicates(page, 'initial /')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${origin}/social/mindbridge-en-1200x630.png`)

  // Client-side switch to Spanish: same tags, localized values, no duplicates.
  await page.locator('header').getByRole('link', { name: /español/i }).click()
  await expect(page).toHaveURL(/\/es$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'es_US')
  await expect(page.locator('meta[property="og:locale:alternate"]')).toHaveAttribute('content', 'en_US')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${origin}/social/mindbridge-es-1200x630.png`)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${origin}/es`)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /no (es )?un proveedor médico/i)
  await expectNoDuplicates(page, 'client nav /es')

  // Deeper client-side navigation and back/forward must not accumulate tags.
  await page.goto('/es/resource/988-lifeline')
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /988/)
  await expectNoDuplicates(page, '/es/resource/988-lifeline')
  await page.locator('header a[href="/es/about"]').click()
  await expect(page.locator('main h1')).toHaveText('Acerca de MindBridge')
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `${origin}/es/about`)
  await expectNoDuplicates(page, '/es/about')
  await page.goBack()
  await expect(page.locator('main h1')).toContainText('988')
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `${origin}/es/resource/988-lifeline`)
  await expectNoDuplicates(page, 'back to resource')
  await page.reload()
  await expectNoDuplicates(page, 'after reload')
  expect(await page.context().cookies()).toEqual([])
})

test('SPA metadata matches the prerendered HTML for the same route', async ({ page, request }) => {
  const path = '/es/about'
  const html = await (await request.get(path)).text()
  const serverDescription = html.match(/<meta name="description" content="([^"]*)"/)[1]
  const serverTitle = html.match(/<title>([^<]*)<\/title>/)[1]
  await page.goto(path)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', serverDescription)
  expect(await page.title()).toBe(serverTitle)
  await expectNoDuplicates(page, 'hydrated /es/about')
})
