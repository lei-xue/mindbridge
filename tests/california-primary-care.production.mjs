import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { visitProviderPages } from './provider-pages.mjs'
const source = JSON.parse(readFileSync(new URL('../src/data/california-primary-care.json', import.meta.url)))
const local = page => page.locator('section[aria-labelledby="local-support-heading"]')

for (const locale of ['en', 'es']) {
  test(`${locale} every HCAI record is available by county with literal address, phone, historical label and attribution`, async ({ page }) => {
    test.setTimeout(180000)
    await page.goto(locale === 'es' ? '/es' : '/')
    const seen = []
    for (const county of [...new Set(source.clinics.map(c => c.county))]) {
      await page.locator('#california-search-value').selectOption(county)
      await local(page).locator('form button[type="submit"]').click()
      const expected = source.clinics.filter(c => c.county === county)
      const entries = await visitProviderPages(local(page), async rows => {
        for (const row of await rows.locator('xpath=self::tr[starts-with(@data-provider,"hcai-")]').all()) {
          const id = (await row.getAttribute('data-provider')).slice(5)
          const clinic = expected.find(c => c.id === id)
          expect(clinic).toBeTruthy()
          seen.push(id)
          await expect(row).toContainText(clinic.name)
          await expect(row).toContainText(clinic.address)
          await expect(row).toContainText(clinic.phone)
          const dial = clinic.phone.match(/^(?:\+?1[ .-]*)?(\(?\d{3}\)?[ .-]*\d{3}[ .-]*\d{4})(?:\s*(?:ext\.?|x|#)\s*(\d{1,6}))?$/i)
          expect(dial).toBeTruthy()
          await expect(row.getByRole('link', { name: clinic.phone, exact: true })).toHaveAttribute('href', `tel:+1${dial[1].replace(/\D/g, '')}${dial[2] ? `;ext=${dial[2]}` : ''}`)
          await expect(row).toContainText('2025')
          await expect(row).toContainText(locale === 'es' ? 'declarados en 2025' : 'reported in 2025')
          await expect(row.getByRole('link', { name: 'HCAI · 2025', exact: true })).toHaveAttribute('href', source.source)
          await expect(row).toContainText(source.sourceExtractedAt)
          await expect(row.locator('a[href*="google.com/maps/search"]')).toHaveAttribute('href', `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinic.address} · ${clinic.city}, CA ${clinic.zip}`)}`)
        }
      })
      expect(entries.filter(entry => entry.id.startsWith('hcai-')).map(entry => entry.id)).toEqual(expected.map(c => `hcai-${c.id}`))
    }
    expect(seen.sort()).toEqual(source.clinics.map(c => c.id).sort())
    await expect(page.locator('#directory article')).toHaveCount(23)
  })

  test(`${locale} rural city and ZIP+4 records match exactly without sending a visitor query upstream`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    const requests = []
    page.on('request', request => { if (request.method() === 'POST') requests.push({ url: request.url(), body: request.postData() || '' }) })
    await page.goto(locale === 'es' ? '/es' : '/')
    const cityClinic = source.clinics.find(c => c.county === 'Sierra')
    await local(page).getByRole('button', { name: locale === 'es' ? 'Ciudad' : 'City', exact: true }).click()
    await page.locator('#california-search-value').fill(cityClinic.city.toLowerCase())
    await local(page).locator('form button[type="submit"]').click()
    let entries = await visitProviderPages(local(page))
    expect(entries.filter(e => e.id.startsWith('hcai-')).map(e => e.id)).toEqual(source.clinics.filter(c => c.city.toLowerCase() === cityClinic.city.toLowerCase()).map(c => `hcai-${c.id}`))
    const zipClinic = source.clinics.find(c => c.zip.includes('-') && c.county !== 'Los Angeles')
    await local(page).getByRole('button', { name: locale === 'es' ? 'Código postal' : 'ZIP code', exact: true }).click()
    await page.locator('#california-search-value').fill(zipClinic.zip.slice(0, 5))
    await local(page).locator('form button[type="submit"]').click()
    const countyChoice = page.locator('#choose-county')
    if (await countyChoice.count()) {
      await expect(local(page).locator('tr[data-provider^="hcai-"]')).toHaveCount(0)
      await countyChoice.selectOption(zipClinic.county)
    }
    entries = await visitProviderPages(local(page))
    const expected = source.clinics.filter(c => c.zip.slice(0, 5) === zipClinic.zip.slice(0, 5) && c.county === zipClinic.county)
    expect(entries.filter(e => e.id.startsWith('hcai-')).map(e => e.id)).toEqual(expected.map(c => `hcai-${c.id}`))
    expect(entries.some(e => e.text.includes(zipClinic.zip))).toBe(true)
    // Production hosting injects the already-disclosed Cloudflare beacon.
    // Permit that exact endpoint only, and inspect its data rather than
    // treating page-load performance telemetry as a directory query.
    for (const request of requests) {
      const url = new URL(request.url)
      expect(url.origin).toBe(new URL(page.url()).origin)
      expect(url.pathname).toBe('/cdn-cgi/rum')
      const payload = JSON.parse(request.body)
      expect(payload.location).toBe(page.url())
      expect(request.body.toLowerCase()).not.toContain(cityClinic.city.toLowerCase())
      const strings = JSON.stringify(payload)
      expect(strings).not.toContain(JSON.stringify(zipClinic.zip.slice(0, 5)))
      expect(Object.keys(payload).filter(key => ['zip', 'city', 'query', 'county'].includes(key))).toEqual([])
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    await page.goto(locale === 'es' ? '/es/about' : '/about')
    await expect(page.locator('main')).toContainText(`${source.clinicCount}`)
    await expect(page.locator('main')).toContainText(`${source.countyCount}`)
    await expect(page.locator('main').getByRole('link', { name: 'HCAI', exact: true })).toHaveAttribute('href', source.source)
  })
}
