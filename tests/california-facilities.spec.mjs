import { test, expect } from '@playwright/test'

test('California snapshot searches by county without putting location in URL or network', async ({ page }) => {
  const requests = []
  page.on('request', (request) => {
    if (request.method() !== 'GET' || request.url().includes('Orange')) requests.push(request.url())
  })
  await page.goto('/')
  await page.getByLabel('Search California facilities by').selectOption('county')
  await page.getByLabel('California city, county, or ZIP').fill('Orange')
  await page.getByRole('button', { name: 'Find California facilities' }).click()
  await expect(page.getByText(/California facility listings for county Orange/)).toBeVisible()
  await expect(page.getByText(/ALISO RIDGE BEHAVIORAL HEALTH, LLC/i)).toBeVisible()
  expect(page.url()).not.toContain('Orange')
  expect(requests).toEqual([])
})

test('a ZIP with no licensed facility listing does not claim no support exists', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('California city, county, or ZIP').fill('92706')
  await page.getByRole('button', { name: 'Find California facilities' }).click()
  await expect(page.getByText(/No listed facilities in that exact ZIP/)).toBeVisible()
  await expect(page.getByText(/does not mean there is no care nearby/)).toBeVisible()
})
