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

test('LA directory explains that ZIP 92706 belongs outside Los Angeles County', async ({ page }) => {
  const countyRequests = []
  page.on('request', (request) => { if (request.url().includes('/api/la-county/locations')) countyRequests.push(request.url()) })
  await page.goto('/')
  await page.getByLabel('5-digit ZIP code', { exact: true }).fill('92706')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.getByText(/ZIP 92706 maps to Orange County, outside the LA County directory/)).toBeVisible()
  expect(countyRequests).toEqual([])
})

test('footer shows the exact frontend build version after deployment', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('footer')).toContainText(/Version: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z · [0-9a-f]{8}/)
})

test('a ZIP with no licensed facility listing does not claim no support exists', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('California city, county, or ZIP').fill('92706')
  await page.getByRole('button', { name: 'Find California facilities' }).click()
  await expect(page.getByText(/No listed facilities in that exact ZIP/)).toBeVisible()
  await expect(page.getByText(/does not mean there is no care nearby/)).toBeVisible()
  await expect(page.getByText(/2 Orange County BHP provider sites for ZIP 92706/)).toBeVisible()
  await expect(page.getByText('AMHS Telecare Comprehensive FACT FSP')).toBeVisible()
  await expect(page.getByText('AMHS STEPs Telecare FSP')).toBeVisible()
  await expect(page.getByText(/ZIP maps to Orange County/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Orange County Behavioral Health Plan provider directory' })).toHaveAttribute('href', 'https://bhpproviderdirectory.ochca.com/')
  await expect(page.getByText(/ALISO RIDGE BEHAVIORAL HEALTH, LLC/i)).toBeVisible()
})
