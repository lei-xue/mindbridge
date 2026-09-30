import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
for (const width of [320, 390, 1440]) {
  test(`Irvine result puts name, type, address, phone and source in one row at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/')
    await page.getByLabel('California county').selectOption('Orange')
    await page.getByRole('button', { name: 'Find support options' }).click()
    await page.locator('#local-city-filter').selectOption('Irvine')
    const search = page.locator('section[aria-labelledby="local-support-heading"]')
    const row = search.locator('tr[data-provider^="oc-"]')
    await expect(row).toHaveCount(1)
    await expect(row.getByRole('heading', { name: 'Progeny Psychiatric Group - Irvine', exact: true })).toBeVisible()
    await expect(row.getByRole('link', { name: /^Open in maps:/ })).toBeVisible()
    await expect(row.getByRole('link', { name: '949-722-7118', exact: true })).toBeVisible()
    await expect(row.getByText('Psychiatry & Neurology Psychiatry', { exact: true })).toBeVisible()
    await expect(row.getByRole('link', { name: 'OC BHP' })).toHaveAttribute('href', 'https://bhpproviderdirectory.ochca.com/')
    await expect(row.locator('th, td')).toHaveCount(5)
    await expect(search.locator('details, summary')).toHaveCount(0)
    await expect(search.getByRole('link', { name: 'Call county plan', exact: true })).toBeVisible()
    const accessibility = await new AxeBuilder({ page }).include('section[aria-labelledby="local-support-heading"]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(accessibility.violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  })
}
test('county referral is a directly usable row even without provider records', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('California county').selectOption('Colusa')
  await page.getByRole('button', { name: 'Find support options' }).click()
  const row = page.locator('tr[data-provider="county-Colusa"]')
  await expect(row).toBeVisible()
  await expect(row.getByRole('link', { name: 'Call county plan', exact: true })).toBeVisible()
})
