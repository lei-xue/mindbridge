import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

for (const locale of ['en', 'es']) {
  for (const width of [320, 390, 1440]) {
    test(`${locale} OC has a three-row preview and quiet directory link at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.goto(locale === 'es' ? '/es' : '/')
      await page.locator('#california-search-value').selectOption('Orange')
      await page.locator('form').getByRole('button', { name: /Find support options|Buscar opciones/ }).click()
      const oc = page.locator('section[aria-label]').filter({ has: page.locator('#orange-county-city') })
      await expect(oc.locator('article')).toHaveCount(0)
      await oc.locator('select').selectOption('*')
      await expect(oc.locator('article')).toHaveCount(3)
      await expect(oc).not.toContainText(/first 20|primeros 20|98|99/)
      await expect(oc.getByRole('link', { name: /Full OC|Directorio completo/ })).toBeVisible()
      for (const article of await oc.locator('article').all()) {
        await expect(article.locator('h5')).toBeVisible()
        await expect(article.locator('a[href^="tel:"]')).toBeVisible()
        expect(await article.locator('a[href^="tel:"]').evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44)
        expect(await article.evaluate(el => getComputedStyle(el).borderRadius)).toBe('0px')
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
      console.log(JSON.stringify({ locale, width, cards: await oc.locator('article').count(), visibleTextLength: (await oc.innerText()).length }))
      await oc.screenshot({ path: `test-results/oc-simplified-${locale}-${width}.png` })
      const scan = await new AxeBuilder({ page }).include('section[aria-labelledby="local-support-heading"]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(scan.violations).toEqual([])
      await oc.locator('select').selectOption('Santa Ana')
      await expect(oc.locator('article')).toHaveCount(3)
      for (const article of await oc.locator('article').all()) await expect(article).toContainText('Santa Ana')
      await oc.locator('select').selectOption('Irvine')
      await expect(oc.locator('article')).toHaveCount(1)
      await expect(oc).not.toContainText(/not ranked|sin clasificación/)
    })
  }
}

for (const locale of ['en', 'es']) {
  for (const width of [320, 390, 1440]) {
    test(`${locale} unmatched ZIP has one next step, no county detour at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.goto(locale === 'es' ? '/es' : '/')
      await page.getByRole('button', { name: locale === 'es' ? 'Código postal' : 'ZIP code', exact: true }).click()
      await page.locator('#california-search-value').fill('99999')
      await page.locator('form').getByRole('button', { name: /Find support options|Buscar opciones/ }).click()
      const region = page.locator('section[aria-labelledby="local-support-heading"]')
      await expect(region.locator('#choose-county')).toHaveCount(0)
      await expect(region.locator('article')).toHaveCount(0)
      await expect(region.locator('section[aria-label="County mental health plan"]')).toHaveCount(0)
      await expect(region).not.toContainText(/not local matches|crosswalk|coincidencias locales|tabla aproximada/i)
      await expect(region.locator('a[href="tel:211"]')).toBeVisible()
      await expect(region.locator('[role="status"]')).toHaveCount(1)
      expect(page.url()).not.toContain('99999')
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
      await region.screenshot({ path: `test-results/yagni-no-results-${locale}-${width}.png` })
      const scan = await new AxeBuilder({ page }).include('section[aria-labelledby="local-support-heading"]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      expect(scan.violations).toEqual([])
    })
  }
}

test('county contact exposes one phone and folds secondary information', async ({ page }) => {
  await page.goto('/')
  await page.locator('#california-search-value').selectOption('Butte')
  await page.locator('form').getByRole('button', { name: 'Find support options' }).click()
  const county = page.getByRole('region', { name: 'County mental health plan' })
  await expect(county.getByRole('link', { name: 'Call county plan', exact: true })).toBeVisible()
  await expect(county.getByText(/Official Medi-Cal specialty mental-health contact/)).toBeHidden()
  await expect(county.getByRole('link', { name: 'Visit Butte County plan website' })).toBeHidden()
  await county.locator('summary').click()
  await expect(county.getByRole('link', { name: 'Visit Butte County plan website' })).toBeVisible()
})

test('mapped ZIP without results never offers unrelated county-wide facility cards', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'ZIP code', exact: true }).click()
  await page.locator('#california-search-value').fill('90620')
  await page.locator('form').getByRole('button', { name: 'Find support options' }).click()
  const region = page.locator('section[aria-labelledby="local-support-heading"]')
  await expect(region.locator('article')).toHaveCount(0)
  await expect(region).not.toContainText(/elsewhere|not local matches/)
  await expect(region.getByRole('link', { name: 'Call county plan', exact: true })).toBeVisible()
})
