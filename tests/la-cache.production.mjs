import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

// Inputs come from published source geography, never the user's location.
// Do not log, hard-code or persist postal inputs.
const countyData = JSON.parse(readFileSync(new URL('../src/data/california-county-access.json', import.meta.url)))
const sourceInputs = Object.entries(countyData.zipCounties).filter(([, counties]) => counties.length === 1 && counties[0] === 'Los Angeles').map(([key]) => key)
const input = sourceInputs[0]
const otherInput = sourceInputs[1]
const fixture = (id = 'cache-fixture') => ({ id, name: `SYNTHETIC ${id}`, address: { lines: [], city: 'Los Angeles', state: 'CA', postalCode: '' }, phones: [], websites: [], hours: [], languages: [], populations: [], accessibility: [], lastUpdated: '2020-01-01' })
const labels = {
  en: { path: '/', mode: 'ZIP code', input: 'California ZIP code', submit: 'Find support options', refresh: 'Refresh LA results', retry: 'Retry LA search', stale: 'Showing previous results; refresh failed.', cached: 'Cached in this tab (up to 5 min).' },
  es: { path: '/es', mode: 'Código postal', input: 'Código postal de California', submit: 'Buscar opciones de apoyo', refresh: 'Actualizar resultados de LA', retry: 'Reintentar búsqueda de LA', stale: 'Se muestran resultados anteriores; no se pudo actualizar.', cached: 'En caché en esta pestaña (hasta 5 min).' },
}
const panel = page => page.locator('section[aria-labelledby="local-support-heading"]')
const stamp = page => panel(page).locator('time[data-la-fetched-at]')
async function submit(page, locale = 'en', value = input) {
  const l = labels[locale]
  await page.getByRole('button', { name: l.mode, exact: true }).click()
  await page.getByLabel(l.input, { exact: true }).fill(value)
  await page.getByRole('button', { name: l.submit, exact: true }).click()
}
async function noStoredInputs(page) {
  expect(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))).toEqual({ local: [], session: [] })
  expect(new URL(page.url()).search).toBe('')
}

for (const locale of ['en', 'es']) {
  test(`${locale} repeats reuse original time, failed refresh retains data, Retry uses submitted query`, async ({ page }) => {
    const l = labels[locale]
    await page.clock.install()
    const requests = []
    let fail = false
    await page.route('**/api/la-county/locations', route => {
      requests.push(route.request().postDataJSON())
      return route.fulfill({ status: fail ? 503 : 200, json: fail ? { error: 'SYNTHETIC unavailable' } : { results: [fixture()], hasMore: true } })
    })
    await page.goto(l.path)
    await submit(page, locale)
    await expect(stamp(page)).toBeVisible()
    const original = await stamp(page).getAttribute('datetime')
    await page.getByRole('button', { name: l.submit, exact: true }).click()
    await expect(panel(page).getByText(l.cached, { exact: true })).toBeVisible()
    expect(requests.length).toBe(1)
    expect(await stamp(page).getAttribute('datetime')).toBe(original)
    await page.clock.fastForward(2000)
    fail = true
    await page.getByRole('button', { name: l.refresh, exact: true }).click()
    await expect(panel(page).getByRole('alert')).toBeVisible()
    await expect(panel(page).getByText(l.stale, { exact: true })).toBeVisible()
    await expect(panel(page).getByText(l.cached, { exact: true })).toHaveCount(0)
    await expect(panel(page).getByRole('heading', { name: 'SYNTHETIC cache-fixture', exact: true })).toBeVisible()
    expect(await stamp(page).getAttribute('datetime')).toBe(original)
    expect(requests.length).toBe(2)
    // A new draft is not a submission; Retry must not send this text.
    await page.getByLabel(l.input, { exact: true }).fill('ABCDE')
    fail = false
    await page.getByRole('button', { name: l.retry, exact: true }).click()
    await expect(panel(page).getByRole('alert')).toHaveCount(0)
    await expect(page.getByRole('button', { name: l.refresh, exact: true })).toBeVisible()
    expect(requests.length).toBe(3)
    expect(requests.at(-1).value === input).toBe(true)
    expect(requests.every(r => r.searchType === 'zip')).toBe(true)
    expect(await stamp(page).getAttribute('datetime')).not.toBe(original)
    await noStoredInputs(page)
  })
}

test('TTL re-fetch failure keeps original time and rows rather than a fresh or empty success', async ({ page }) => {
  await page.clock.install()
  let calls = 0
  await page.route('**/api/la-county/locations', route => {
    calls++
    return route.fulfill({ status: calls === 1 ? 200 : 503, json: calls === 1 ? { results: [fixture()], hasMore: false } : { error: 'SYNTHETIC expired source failure' } })
  })
  await page.goto('/')
  await submit(page)
  await expect(stamp(page)).toBeVisible()
  const original = await stamp(page).getAttribute('datetime')
  await page.clock.fastForward(300001)
  await page.getByRole('button', { name: labels.en.submit, exact: true }).click()
  await expect(panel(page).getByText(labels.en.stale, { exact: true })).toBeVisible()
  await expect(panel(page).getByRole('heading', { name: 'SYNTHETIC cache-fixture', exact: true })).toBeVisible()
  expect(await stamp(page).getAttribute('datetime')).toBe(original)
  expect(calls).toBe(2)
})

test('a first failure is not cached zero success; genuine empty is reusable and reload clears memory', async ({ page }) => {
  let calls = 0
  await page.route('**/api/la-county/locations', route => {
    calls++
    return route.fulfill({ status: calls === 1 ? 503 : 200, json: calls === 1 ? { error: 'SYNTHETIC first failure' } : { results: [], hasMore: false } })
  })
  await page.goto('/')
  await submit(page)
  await expect(panel(page).getByRole('alert')).toBeVisible()
  await expect(stamp(page)).toHaveCount(0)
  await expect(panel(page).getByRole('heading').filter({ hasText: /^0 directory listings/ })).toHaveCount(0)
  await page.getByRole('button', { name: labels.en.retry, exact: true }).click()
  await expect(stamp(page)).toBeVisible()
  await expect(panel(page).getByRole('heading').filter({ hasText: /^0 directory listings/ })).toBeVisible()
  await page.getByRole('button', { name: labels.en.submit, exact: true }).click()
  await expect(panel(page).getByText(labels.en.cached, { exact: true })).toBeVisible()
  expect(calls).toBe(2)
  await noStoredInputs(page)
  await page.reload()
  await submit(page)
  await expect(stamp(page)).toBeVisible()
  expect(calls).toBe(3)
})

test('a late ignored-abort response neither replaces the new query nor warms the abandoned query', async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window)
    window.fetch = (url, options) => String(url).includes('/api/la-county/locations') ? originalFetch(url, { ...options, signal: undefined }) : originalFetch(url, options)
  })
  let release
  let calls = 0
  await page.route('**/api/la-county/locations', async route => {
    calls++
    const thisCall = calls
    if (thisCall === 1) await new Promise(resolve => { release = resolve })
    await route.fulfill({ json: { results: [fixture(`request-${thisCall}`)], hasMore: false } })
  })
  await page.goto('/')
  await submit(page)
  await expect.poll(() => calls).toBe(1)
  await page.getByLabel(labels.en.input, { exact: true }).fill(otherInput)
  await page.getByRole('button', { name: labels.en.submit, exact: true }).click()
  await expect(stamp(page)).toBeVisible()
  const newStamp = await stamp(page).getAttribute('datetime')
  const lateResponse = page.waitForResponse(response => response.url().includes('/api/la-county/locations') && response.request().postDataJSON().value === input)
  release()
  await (await lateResponse).finished()
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await expect.poll(() => panel(page).getByRole('heading').filter({ hasText: /^1 directory listing/ }).textContent().then(text => text.includes(otherInput))).toBe(true)
  await expect(stamp(page)).toHaveAttribute('datetime', newStamp)
  await page.getByLabel(labels.en.input, { exact: true }).fill(input)
  await page.getByRole('button', { name: labels.en.submit, exact: true }).click()
  await expect.poll(() => calls).toBe(3)
  await expect(stamp(page)).toBeVisible()
})

test('busy refresh preserves focus, blocks duplicate actions and does not steal voluntary focus', async ({ page }) => {
  let calls = 0
  let release
  await page.route('**/api/la-county/locations', async route => {
    calls++
    if (calls === 2) await new Promise(resolve => { release = resolve })
    await route.fulfill({ json: { results: [], hasMore: false } })
  })
  await page.goto('/')
  await submit(page)
  const refresh = page.getByRole('button', { name: labels.en.refresh, exact: true })
  await expect(refresh).toBeEnabled()
  await refresh.focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => calls).toBe(2)
  await expect(refresh).toBeDisabled()
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await expect(refresh).toBeFocused()
  await page.keyboard.press('Enter')
  await refresh.dispatchEvent('click')
  expect(calls).toBe(2)
  const draft = page.getByLabel(labels.en.input, { exact: true })
  await draft.focus()
  release()
  await expect(refresh).toBeEnabled()
  await expect(draft).toBeFocused()
})

for (const locale of ['en', 'es']) for (const width of [320, 390, 1440]) {
  test(`${locale} cache controls fit at ${width}px with accessible touch targets`, async ({ page }) => {
    const l = labels[locale]
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.route('**/api/la-county/locations', route => route.fulfill({ json: { results: [fixture()], hasMore: false } }))
    await page.goto(l.path)
    await submit(page, locale)
    const refresh = page.getByRole('button', { name: l.refresh, exact: true })
    await expect(refresh).toBeVisible()
    expect((await refresh.boundingBox()).height).toBeGreaterThanOrEqual(44)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    await refresh.focus()
    await page.keyboard.press('Enter')
    await expect(refresh).toBeEnabled()
    await expect(refresh).toBeFocused()
    await noStoredInputs(page)
  })
}
