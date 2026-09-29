import { test, expect } from '@playwright/test'

test('California county snapshot searches locally without putting location in URL or network', async ({ page }) => {
  const requests = []
  page.on('request', (request) => { if (request.method() !== 'GET') requests.push(request.url()) })
  await page.goto('/')
  await page.getByLabel('Search by').selectOption('county')
  await page.getByLabel('California city, county, or ZIP').fill('Orange')
  await page.getByRole('button', { name: 'Find support options' }).click()
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
  await page.getByRole('button', { name: 'Find support options' }).click()
  await expect(page.getByRole('heading', { name: /2 provider sites listed in Fountain Valley · Orange County/ })).toBeVisible()
  await expect(page.getByText(/Other licensed facilities elsewhere in Orange County/)).toHaveCount(0)
  expect(countyRequests).toEqual([])
})

test('county search shows the official mental-health plan access line even without local provider listings', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Search by').selectOption('county')
  await page.getByLabel('California city, county, or ZIP').fill('Colusa')
  await page.getByRole('button', { name: 'Find support options' }).click()
  await expect(page.getByText(/Colusa County Mental Health Plan/)).toBeVisible()
  await expect(page.getByText('(888) 793-6580')).toBeVisible()
  await expect(page.getByRole('link', { name: /DHCS county mental health plans/i })).toHaveAttribute('href', 'https://www.dhcs.ca.gov/individuals/county-mental-health-plan-information/')
})

test('a ZIP spanning counties asks the visitor to choose rather than assuming a county or calling LA', async ({ page }) => {
  const requests = []
  page.on('request', (request) => { if (request.url().includes('/api/la-county/locations')) requests.push(request.url()) })
  await page.goto('/')
  await page.getByLabel('California city, county, or ZIP').fill('90630')
  await page.getByRole('button', { name: 'Find support options' }).click()
  await expect(page.getByText(/This ZIP may cross county boundaries/)).toBeVisible()
  await page.getByLabel('Choose your county').selectOption('Orange')
  await expect(page.getByText(/Orange County Mental Health Plan/)).toBeVisible()
  expect(requests).toEqual([])
})

test('ambiguous ZIP can explicitly request the live LA directory after choosing LA', async ({ page }) => {
  const requests = []
  await page.route('**/api/la-county/locations', async (route) => {
    requests.push({ method: route.request().method(), body: route.request().postDataJSON() })
    await route.fulfill({ json: { results: [], hasMore: false } })
  })
  await page.goto('/')
  await page.getByLabel('California city, county, or ZIP').fill('90630')
  await page.getByRole('button', { name: 'Find support options' }).click()
  await page.getByLabel('Choose your county').selectOption('Los Angeles')
  expect(requests).toEqual([])
  await page.getByRole('button', { name: 'Search live LA County directory' }).click()
  await expect(page.getByText(/0 directory listings for ZIP 90630/)).toBeVisible()
  expect(requests).toHaveLength(1)
  expect(requests[0].method).toBe('POST')
  expect(page.url()).not.toContain('90630')
})

test('visitor can correct a single suggested county without treating its snapshot as comprehensive', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('California city, county, or ZIP').fill('92708')
  await page.getByRole('button', { name: 'Find support options' }).click()
  await expect(page.getByRole('heading', { name: /2 provider sites listed in Fountain Valley/ })).toBeVisible()
  await page.getByText('Change county').click()
  await page.getByLabel('Choose your county').selectOption('Colusa')
  await expect(page.getByText(/Colusa County Mental Health Plan/)).toBeVisible()
  await expect(page.getByRole('heading', { name: /2 provider sites listed in Fountain Valley/ })).toHaveCount(0)
})

test('correcting a city hint removes sites from the previous county', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Search by').selectOption('city')
  await page.getByLabel('California city, county, or ZIP').fill('Santa Ana')
  await page.getByRole('button', { name: 'Find support options' }).click()
  await expect(page.getByRole('heading', { name: /Orange County BHP provider sites for city Santa Ana/ })).toBeVisible()
  await page.getByText('Change county').click()
  await page.getByLabel('Choose your county').selectOption('Colusa')
  await expect(page.getByRole('heading', { name: /Orange County BHP provider sites for city Santa Ana/ })).toHaveCount(0)
  await expect(page.getByText(/Colusa County Mental Health Plan/)).toBeVisible()
})

test('footer shows the exact frontend build version after deployment', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('footer')).toContainText(/Version: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z · [0-9a-f]{8}/)
})

test('zero state-licensed ZIP matches do not hide separate Orange County sites', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('California city, county, or ZIP').fill('92708')
  await page.getByRole('button', { name: 'Find support options' }).click()
  await expect(page.getByText(/0 statewide licensed-facility listings for zip 92708/)).toHaveCount(0)
  await expect(page.getByText(/No listed facilities in that exact ZIP/)).toHaveCount(0)
  await expect(page.getByRole('heading', { name: /2 provider sites listed in Fountain Valley · Orange County/ })).toBeVisible()
  await expect(page.getByText('CYS Western Youth Services West', { exact: true })).toBeVisible()
  await expect(page.getByText('CYS Western Youth Services West MHSA', { exact: true })).toBeVisible()
  const sourceOrder = await page.locator('section[aria-label="Orange County Behavioral Health Plan sites"]').evaluate((site) => {
    const plan = document.querySelector('section[aria-label="County mental health plan"]')
    return Boolean(plan && site.compareDocumentPosition(plan) & Node.DOCUMENT_POSITION_FOLLOWING)
  })
  expect(sourceOrder).toBe(true)
  await expect(page.getByText(/Orange County access line/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Orange County Behavioral Health Plan provider directory' })).toHaveAttribute('href', 'https://bhpproviderdirectory.ochca.com/')
  await expect(page.getByText(/other licensed facility listings elsewhere in Orange County/)).toBeHidden()
})

test('a ZIP with no exact listings does not present distant county facilities as local results', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('California city, county, or ZIP').fill('90620')
  await page.getByRole('button', { name: 'Find support options' }).click()
  await expect(page.getByText(/No exact ZIP listings were found/)).toBeVisible()
  await expect(page.getByText(/does not mean there is no care nearby/)).toBeVisible()
  const otherCounty = page.getByText(/Other licensed facilities elsewhere in Orange County/)
  await expect(otherCounty).toBeVisible()
  await expect(page.getByText(/ALISO RIDGE BEHAVIORAL HEALTH, LLC/i)).toBeHidden()
  await otherCounty.click()
  await expect(page.getByText(/ALISO RIDGE BEHAVIORAL HEALTH, LLC/i)).toBeVisible()
})
