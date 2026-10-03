import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { visitProviderPages } from './provider-pages.mjs'
import primaryCare from '../src/data/california-primary-care.json' with { type: 'json' }
const data = name => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url)))
const facilities = data('california-facilities'), orange = data('orange-provider-sites'), access = data('california-county-access')
const sd = data('san-diego-adult-clinics'), butte = data('butte-adult-clinics')
const local = page => page.locator('section[aria-labelledby="local-support-heading"]')
async function search(page, mode, value) {
  if (mode === 'City') {
    const county = { Carmichael: 'Sacramento', 'Woodland Hills': 'Los Angeles', Escondido: 'San Diego' }[value]
    await search(page, 'County', county)
    const options = await page.locator('#local-city-filter option').evaluateAll(nodes => nodes.map(n => n.value))
    const city = options.find(option => option.toLowerCase() === value.toLowerCase())
    if (city) await page.locator('#local-city-filter').selectOption(city)
    return
  }
  await page.getByRole('button', { name: mode, exact: true }).click()
  if (mode === 'County') await page.locator('#california-search-value').selectOption(value)
  else await page.locator('#california-search-value').fill(value)
  await page.getByRole('button', { name: 'Find support options' }).click()
}
for (const county of ['Fresno', 'Orange', 'San Diego', 'Butte']) {
  test(`${county} restores every matching snapshot record in one table, without nested disclosures`, async ({ page }) => {
    const requests = []
    page.on('request', r => { if (r.method() !== 'GET') requests.push(r.url()) })
    await page.goto('/')
    await search(page, 'County', county)
    const region = local(page)
    await expect(region.getByRole('table')).toHaveCount(1)
    await expect(region.locator('details, summary')).toHaveCount(0)
    const entries = await visitProviderPages(region)
    const expected = [`county-${county}`, ...facilities.filter(f => f.county === county).map(f => `license-${f.id}`)]
    if (county === 'Orange') expected.push(...orange.sites.filter(site => access.zipCounties[site.zip]?.includes('Orange')).map(site => `oc-${site.id}`))
    if (county === 'San Diego') expected.push(...sd.clinics.map(clinic => `sd-${clinic.id}`))
    if (county === 'Butte') expected.push(...butte.clinics.map(clinic => `butte-${clinic.id}`))
    expected.push(...primaryCare.clinics.filter(clinic => clinic.county === county).map(clinic => `hcai-${clinic.id}`))
    expect(entries.map(entry => entry.id)).toEqual(expected)
    await expect(region.locator('tr[data-provider^="county-"]')).toHaveCount(1)
    await expect(region.getByRole('link', { name: 'Call county plan' })).toBeVisible()
    await expect(page.locator('#directory article')).toHaveCount(23)
    expect(page.url()).not.toContain(county)
    expect(requests).toEqual([])
  })
}
test('optional city filter applies to all sources and resets on county change', async ({ page }) => {
  await page.goto('/')
  for (const [county, city, prefix, expected] of [['Orange', 'Irvine', 'oc-', 1], ['San Diego', 'Escondido', 'sd-', 2], ['Butte', 'Paradise', 'butte-', 1]]) {
    await search(page, 'County', county)
    await expect(page.getByLabel('City (optional filter)')).toHaveValue('*')
    await page.getByLabel('City (optional filter)').selectOption(city)
    for (const row of await local(page).locator('tr[data-provider]:not([data-provider^="county-"])').all()) expect((await row.innerText()).toLowerCase()).toContain(city.toLowerCase())
    await expect(local(page).locator(`tr[data-provider^="${prefix}"]`)).toHaveCount(expected)
    await page.getByLabel('City (optional filter)').selectOption('*')
  }
  const phone = '530-877-5845'
  let found = false
  await visitProviderPages(local(page), async rows => {
    const link = rows.getByRole('link', { name: phone, exact: true })
    if (await link.count()) {
      found = true
      await expect(link).toHaveAttribute('href', `tel:+1${phone.replace(/\D/g, '')}`)
    }
  })
  expect(found).toBe(true)
  await search(page, 'County', 'Colusa')
  await expect(local(page).locator('tr[data-provider^="butte-"]')).toHaveCount(0)
  await expect(local(page)).toContainText('Colusa County Mental Health Plan')
})
test('mixed-format licensing phone stays literal text, not a misleading dial link', async ({ page }) => {
  await page.goto('/')
  await search(page, 'City', 'Carmichael')
  const row = local(page).locator('tr[data-provider^="license-"]').filter({ hasText: '(916) 483-8424, 977- 0949' })
  await expect(row).toContainText('(916) 483-8424, 977- 0949')
  await expect(row.locator('a[href^="tel:"]')).toHaveCount(0)
})
test('LA county choice exposes the official directory without a live request', async ({ page }) => {
  const requests = []
  page.on('request', r => { if (r.url().includes('/api/la-county/locations')) requests.push(r.url()) })
  await page.goto('/')
  await search(page, 'County', 'Los Angeles')
  await expect(local(page).getByRole('link', { name: 'official LA County provider directory' })).toHaveAttribute('href', 'https://dmh.lacounty.gov/pd/')
  expect(requests).toEqual([])
})
for (const [zip, prefix, expected] of [['92708', 'oc-', 2], ['92025', 'sd-', 2]]) {
  test(`ZIP ${zip} preserves exact records, inline attribution and no LA request`, async ({ page }) => {
    const requests = []
    page.on('request', r => { if (r.url().includes('/api/la-county/locations')) requests.push(r.url()) })
    await page.goto('/')
    await search(page, 'ZIP code', zip)
    const records = local(page).locator(`tr[data-provider^="${prefix}"]`)
    await expect(records).toHaveCount(expected)
    for (const row of await records.all()) {
      await expect(row.getByRole('link', { name: /^Open in maps:/ })).toContainText(zip)
      await expect(row.locator('td').last().getByRole('link')).toBeVisible()
    }
    await expect(local(page).locator('details')).toHaveCount(0)
    expect(requests).toEqual([])
  })
}
test('sparse county retains phone and DHCS fallback; verified county links remain plan landing pages', async ({ page }) => {
  await page.goto('/')
  await search(page, 'County', 'Colusa')
  await expect(local(page)).toContainText('(888) 793-6580')
  await expect(local(page).getByRole('link', { name: /DHCS county mental health plans/i })).toHaveAttribute('href', access.source)
  await expect(local(page).getByRole('link', { name: 'Visit Colusa County plan website' })).toHaveCount(0)
  await search(page, 'County', 'Butte')
  await expect(local(page).getByRole('link', { name: 'Visit Butte County plan website' })).toHaveAttribute('href', 'https://www.buttecounty.net/159/Behavioral-Health')
})
test('ambiguous ZIP requires candidate choice and separate consent before LA transfer', async ({ page }) => {
  const requests = []
  await page.route('**/api/la-county/locations', async route => {
    requests.push({ method: route.request().method(), body: route.request().postDataJSON() })
    await route.fulfill({ json: { results: [], hasMore: false } })
  })
  await page.goto('/')
  await search(page, 'ZIP code', '90630')
  await expect(local(page)).toContainText('This ZIP may cross county boundaries')
  await expect(page.getByLabel('Choose your county').locator('option')).toHaveCount(3)
  await expect(local(page).locator('tr[data-provider^="county-"]')).toHaveCount(0)
  await page.getByLabel('Choose your county').selectOption('Orange')
  await expect(local(page)).toContainText('Orange County Mental Health Plan')
  expect(requests).toEqual([])
  await page.getByLabel('Choose your county').selectOption('Los Angeles')
  expect(requests).toEqual([])
  await page.getByRole('button', { name: 'Search live LA County directory' }).click()
  await expect(page.getByRole('heading', { name: /0 directory listings for ZIP 90630/ })).toBeVisible()
  expect(requests).toEqual([{ method: 'POST', body: { searchType: 'zip', value: '90630' } }])
  expect(page.url()).not.toContain('90630')
})
for (const zip of ['90620', '92620', '92037']) {
  test(`no exact ZIP ${zip} match never appends unrelated county facilities`, async ({ page }) => {
    await page.goto('/')
    await search(page, 'ZIP code', zip)
    await expect(local(page)).toContainText('No listings in our directory for this ZIP.')
    await expect(local(page).locator('tr[data-provider]:not([data-provider^="county-"])')).toHaveCount(0)
    await expect(local(page).getByRole('link', { name: 'Call county plan' })).toBeVisible()
    await expect(local(page)).not.toContainText(/elsewhere|not local matches/)
  })
}
test('unmapped ZIP has one 211 next step; county search is separate and optional', async ({ page }) => {
  await page.goto('/')
  await search(page, 'ZIP code', '99999')
  await expect(local(page)).toContainText('No listings in our directory for this ZIP.')
  await expect(local(page).locator('a[href="tel:211"]')).toHaveCount(1)
  await expect(local(page).locator('#choose-county, table')).toHaveCount(0)
  await search(page, 'County', 'Butte')
  await expect(local(page).locator('tr[data-provider^="county-"]')).toContainText('(800) 334-6622')
})
test('out-of-county OC network site never creates a false Orange hint', async ({ page }) => {
  await page.goto('/')
  await search(page, 'City', 'Woodland Hills')
  await expect(local(page).locator('tr[data-provider^="oc-"]')).toHaveCount(0)
  await expect(local(page)).not.toContainText('Orange County Mental Health Plan')
})
test('changing search mode removes stale city results', async ({ page }) => {
  await page.goto('/')
  await search(page, 'City', 'Escondido')
  await expect(local(page).locator('tr[data-provider^="sd-"]')).toHaveCount(2)
  await search(page, 'County', 'Butte')
  await expect(local(page).locator('tr[data-provider^="sd-"]')).toHaveCount(0)
  await expect(local(page)).toContainText('Butte County Mental Health Plan')
})
test('footer identifies the actual frontend build', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('footer')).toContainText(/Version: v\d+\.\d+\.\d+ · \d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z · [0-9a-f]{8}/)
})
