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
  await expect(page.getByText(/Other licensed facilities elsewhere in Orange County/)).toHaveCount(0)
  expect(countyRequests).toEqual([])
})

test('county search shows the official mental-health plan access line even without local provider listings', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Search California facilities by').selectOption('county')
  await page.getByLabel('California city, county, or ZIP').fill('Colusa')
  await page.getByRole('button', { name: 'Find California facilities' }).click()
  await expect(page.getByText(/Colusa County Mental Health Plan/)).toBeVisible()
  await expect(page.getByText('(888) 793-6580')).toBeVisible()
  await expect(page.getByRole('link', { name: /DHCS county mental health plans/i })).toHaveAttribute('href', 'https://www.dhcs.ca.gov/individuals/county-mental-health-plan-information/')
})

test('a ZIP spanning counties asks the visitor to choose rather than assuming a county or calling LA', async ({ page }) => {
  const requests = []
  page.on('request', (request) => { if (request.url().includes('/api/la-county/locations')) requests.push(request.url()) })
  await page.goto('/')
  await page.getByLabel('California city, county, or ZIP').fill('90630')
  await page.getByRole('button', { name: 'Find California facilities' }).click()
  await expect(page.getByText(/This ZIP may cross county boundaries/)).toBeVisible()
  await page.getByLabel('Choose your county').selectOption('Orange')
  await expect(page.getByText(/Orange County Mental Health Plan/)).toBeVisible()
  expect(requests).toEqual([])
})

test('footer shows the exact frontend build version after deployment', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('footer')).toContainText(/Version: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z · [0-9a-f]{8}/)
})

test('zero state-licensed ZIP matches do not hide separate Orange County sites', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('California city, county, or ZIP').fill('92708')
  await page.getByRole('button', { name: 'Find California facilities' }).click()
  await expect(page.getByText(/0 statewide licensed-facility listings for zip 92708/)).toHaveCount(0)
  await expect(page.getByText(/No listed facilities in that exact ZIP/)).toHaveCount(0)
  await expect(page.getByText(/2 Orange County BHP provider sites for ZIP 92708/)).toBeVisible()
  await expect(page.getByText('CYS Western Youth Services West', { exact: true })).toBeVisible()
  await expect(page.getByText('CYS Western Youth Services West MHSA', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Orange County Behavioral Health Plan provider directory' })).toHaveAttribute('href', 'https://bhpproviderdirectory.ochca.com/')
  await expect(page.getByText(/other licensed facility listings elsewhere in Orange County/)).toBeHidden()
})

test('a ZIP with no exact listings does not present distant county facilities as local results', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('California city, county, or ZIP').fill('90620')
  await page.getByRole('button', { name: 'Find California facilities' }).click()
  await expect(page.getByText(/No exact ZIP listings were found/)).toBeVisible()
  await expect(page.getByText(/does not mean there is no care nearby/)).toBeVisible()
  const otherCounty = page.getByText(/Other licensed facilities elsewhere in Orange County/)
  await expect(otherCounty).toBeVisible()
  await expect(page.getByText(/ALISO RIDGE BEHAVIORAL HEALTH, LLC/i)).toBeHidden()
  await otherCounty.click()
  await expect(page.getByText(/ALISO RIDGE BEHAVIORAL HEALTH, LLC/i)).toBeVisible()
})
