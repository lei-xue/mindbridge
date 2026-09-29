import { test, expect } from '@playwright/test'

test('California county snapshot searches locally without putting location in URL or network', async ({ page }) => {
  const requests = []
  page.on('request', (request) => { if (request.method() !== 'GET') requests.push(request.url()) })
  await page.goto('/')
  await page.getByLabel('Search California facilities by').selectOption('county')
  await page.getByLabel('California city, county, or ZIP').fill('Orange')
  await page.getByRole('button', { name: 'Find California facilities' }).click()
  await expect(page.getByText(/statewide licensed-facility listings for county Orange/)).toBeVisible()
  await expect(page.getByText(/ALISO RIDGE BEHAVIORAL HEALTH, LLC/i)).toBeVisible()
  expect(page.url()).not.toContain('Orange')
  expect(requests).toEqual([])
})

test('non-LA ZIP searches local records without calling the live LA API', async ({ page }) => {
  const countyRequests = []
  page.on('request', (request) => { if (request.url().includes('/api/la-county/locations')) countyRequests.push(request.url()) })
  await page.goto('/')
  await page.getByLabel('California city, county, or ZIP').fill('92708')
  await page.getByRole('button', { name: 'Find California facilities' }).click()
  await expect(page.getByText(/2 Orange County BHP provider sites for ZIP 92708/)).toBeVisible()
  await expect(page.getByText(/ZIP maps to Orange County/)).toBeVisible()
  expect(countyRequests).toEqual([])
})

test('footer shows the exact frontend build version after deployment', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('footer')).toContainText(/Version: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z · [0-9a-f]{8}/)
})

test('zero state-licensed ZIP matches do not hide separate Orange County sites', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('California city, county, or ZIP').fill('92708')
  await page.getByRole('button', { name: 'Find California facilities' }).click()
  await expect(page.getByText(/No listed facilities in that exact ZIP/)).toBeVisible()
  await expect(page.getByText(/does not mean there is no care nearby/)).toBeVisible()
  await expect(page.getByText(/2 Orange County BHP provider sites for ZIP 92708/)).toBeVisible()
  await expect(page.getByText('CYS Western Youth Services West', { exact: true })).toBeVisible()
  await expect(page.getByText('CYS Western Youth Services West MHSA', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Orange County Behavioral Health Plan provider directory' })).toHaveAttribute('href', 'https://bhpproviderdirectory.ochca.com/')
})
