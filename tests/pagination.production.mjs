import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { visitProviderPages } from './provider-pages.mjs'
const licenses = JSON.parse(readFileSync(new URL('../src/data/california-facilities.json', import.meta.url)))
const local = page => page.locator('section[aria-labelledby="local-support-heading"]')
for (const locale of ['en', 'es']) {
  const next = locale === 'es' ? 'Siguiente' : 'Next'
  const previous = locale === 'es' ? 'Anterior' : 'Previous'
  const pagerName = locale === 'es' ? 'Páginas de resultados locales' : 'Local results pages'
  const submit = /Find support options|Buscar opciones/
  for (const width of [320, 390, 1440]) {
    test(`${locale} San Francisco pagination caps rows at five and retains all records at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(locale === 'es' ? '/es' : '/')
      await page.locator('#california-search-value').selectOption('San Francisco')
      await local(page).locator('form').getByRole('button', { name: submit }).click()
      const pager = local(page).getByRole('navigation', { name: pagerName })
      await expect(local(page).locator('tr[data-provider]')).toHaveCount(5)
      await expect(pager.getByRole('button', { name: previous, exact: true })).toBeDisabled()
      await expect(pager.getByRole('button', { name: locale === 'es' ? 'Página 1' : 'Page 1', exact: true })).toHaveAttribute('aria-current', 'page')
      await expect(local(page).locator('[data-pagination-summary]')).toContainText(locale === 'es' ? '1–5 de 6' : '1–5 of 6')
      const box = await pager.boundingBox()
      const table = await local(page).getByRole('table').boundingBox()
      expect(box.y).toBeGreaterThanOrEqual(table.y + table.height)
      for (const button of await pager.getByRole('button').all()) expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44)
      await pager.getByRole('button', { name: next, exact: true }).focus()
      await page.keyboard.press('Enter')
      await expect(local(page).locator('tr[data-provider]')).toHaveCount(1)
      await expect(local(page).locator('tr[data-provider]')).toContainText('San Francisco Mental Health Rehabilitation Center')
      await expect(pager.getByRole('button', { name: next, exact: true })).toBeDisabled()
      await expect(local(page).locator('[data-pagination-summary]')).toContainText(locale === 'es' ? '6–6 de 6' : '6–6 of 6')
      const entries = await visitProviderPages(local(page))
      expect(entries.map(entry => entry.id)).toEqual(['county-San Francisco', ...licenses.filter(f => f.county === 'San Francisco').map(f => `license-${f.id}`)])
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
      await expect(page.locator('#directory article')).toHaveCount(23)
    })
  }
  test(`${locale} filter changes, repeated submissions, sparse and empty searches reset pagination`, async ({ page }) => {
    await page.goto(locale === 'es' ? '/es' : '/')
    const form = local(page).locator('form')
    await page.locator('#california-search-value').selectOption('Orange')
    await form.getByRole('button', { name: submit }).click()
    const pager = local(page).getByRole('navigation', { name: pagerName })
    await pager.getByRole('button', { name: /^(Page|Página) \d+$/ }).last().click()
    await expect(pager.getByRole('button', { name: next, exact: true })).toBeDisabled()
    expect(await local(page).locator('tr[data-provider]').count()).toBeLessThanOrEqual(5)
    await page.locator('#local-city-filter').selectOption('Irvine')
    await expect(local(page).locator('tr[data-provider]')).toHaveCount(2)
    await expect(pager).toHaveCount(0)
    await page.locator('#local-city-filter').selectOption('*')
    await expect(local(page).locator('tr[data-provider="county-Orange"]')).toBeVisible()
    await expect(pager.getByRole('button', { name: previous, exact: true })).toBeDisabled()
    await pager.getByRole('button', { name: next, exact: true }).click()
    await form.getByRole('button', { name: submit }).click()
    await expect(local(page).locator('tr[data-provider="county-Orange"]')).toBeVisible()
    await expect(pager.getByRole('button', { name: previous, exact: true })).toBeDisabled()
    await page.locator('#california-search-value').selectOption('Colusa')
    await form.getByRole('button', { name: submit }).click()
    await expect(local(page).locator('tr[data-provider]')).toHaveCount(1)
    await expect(pager).toHaveCount(0)
    await local(page).getByRole('button', { name: locale === 'es' ? 'Código postal' : 'ZIP code', exact: true }).click()
    await page.locator('#california-search-value').fill('99999')
    await form.getByRole('button', { name: submit }).click()
    await expect(pager).toHaveCount(0)
    await expect(local(page).getByRole('table')).toHaveCount(0)
  })
}
