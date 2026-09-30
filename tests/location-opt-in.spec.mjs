import { test, expect } from '@playwright/test'

test('location is opt-in, locally suggests county and never starts live search or stores coordinates', async ({ page, context }) => {
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: 39.7285, longitude: -121.8375, accuracy: 50 })
  await page.addInitScript(() => {
    window.locationCalls = 0
    const original = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation)
    navigator.geolocation.getCurrentPosition = (...args) => { window.locationCalls++; original(...args) }
  })
  const calls = []
  page.on('request', r => calls.push({url:r.url(),body:r.postData()}))
  await page.goto('/')
  expect(await page.evaluate(() => window.locationCalls)).toBe(0)
  const before = calls.length
  await page.getByRole('button', {name:'Use current location'}).click()
  await expect(page.getByLabel('California county')).toHaveValue('Butte')
  await expect(page.getByRole('status')).toContainText('Showing Butte County options')
  expect(await page.evaluate(() => window.locationCalls)).toBe(1)
  expect(calls.slice(before).every(r => !r.body && !/39\.7285|121\.8375|api\/la-county/.test(r.url))).toBe(true)
  expect(await page.evaluate(() => JSON.stringify({local:{...localStorage},session:{...sessionStorage}}))).not.toMatch(/39\.7285|121\.8375/)
  await expect(page).not.toHaveURL(/39\.7285|121\.8375|Butte/)
  await expect(page.locator('section[aria-label="Butte adult outpatient centers"] article')).toHaveCount(4)
})

for (const scenario of ['denied', 'timeout', 'unsupported', 'outside', 'poor-accuracy', 'stale']) {
  test(`location ${scenario} preserves manual selection`, async ({ page }) => {
    await page.addInitScript((scenario) => {
      if (scenario === 'unsupported') { Object.defineProperty(navigator, 'geolocation', {value:undefined}); return }
      navigator.geolocation.getCurrentPosition = (ok, fail) => {
        if (scenario === 'denied' || scenario === 'timeout') { fail({code:scenario==='denied'?1:3}); return }
        const p={coords:{latitude:scenario==='outside'?40.7128:39.7285,longitude:scenario==='outside'?-74.006:-121.8375,accuracy:scenario==='poor-accuracy'?50000:50}}
        if(scenario==='stale') window.deliverLocation=()=>ok(p)
        else ok(p)
      }
    }, scenario)
    await page.goto('/')
    await page.getByLabel('California county').selectOption('Colusa')
    await page.getByRole('button', {name:'Use current location'}).click()
    if(scenario==='stale') {
      await page.getByLabel('California county').selectOption('Alameda')
      await page.evaluate(()=>window.deliverLocation())
      await expect(page.getByLabel('California county')).toHaveValue('Alameda')
    } else {
      await expect(page.getByRole('status')).toContainText(/manually/)
      await expect(page.getByLabel('California county')).toHaveValue('Colusa')
    }
    await page.getByRole('button',{name:'Find support options'}).click()
    await expect(page.locator('section[aria-label="County mental health plan"]')).toBeVisible()
  })
}

test('default directory avoids repeated crisis cards but filters retain them; About includes all new sources',async({page})=>{
  await page.goto('/')
  await expect(page.getByText('Showing 20 of 23 resources')).toBeVisible()
  await expect(page.locator('#directory').getByRole('link',{name:'988 Suicide & Crisis Lifeline',exact:true})).toHaveCount(0)
  await expect(page.getByRole('link',{name:'Call 988 now'})).toBeVisible()
  await page.getByRole('searchbox',{name:'Search'}).fill('988')
  await expect(page.locator('#directory').getByRole('link',{name:'988 Suicide & Crisis Lifeline',exact:true})).toBeVisible()
  await page.getByRole('link',{name:'About',exact:true}).click()
  await expect(page.locator('main')).toContainText('Butte County adult outpatient-center subset')
  await expect(page.locator('main')).toContainText('Coordinates are matched')
})
