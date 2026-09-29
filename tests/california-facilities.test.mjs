import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const facilities = JSON.parse(readFileSync(new URL('../src/data/california-facilities.json', import.meta.url)))
const zipCounties = JSON.parse(readFileSync(new URL('../src/data/california-zip-counties.json', import.meta.url)))
const orangeSnapshot = JSON.parse(readFileSync(new URL('../src/data/orange-provider-sites.json', import.meta.url)))
const orangeSites = orangeSnapshot.sites
const countyAccess = JSON.parse(readFileSync(new URL('../src/data/california-county-access.json', import.meta.url)))
const countySites = JSON.parse(readFileSync(new URL('../src/data/california-county-sites.json', import.meta.url)))
const sanDiego = JSON.parse(readFileSync(new URL('../src/data/san-diego-adult-clinics.json', import.meta.url)))

test('San Diego BHS adult clinic subset has physical sites, not contact-only programs', () => {
  assert.equal(sanDiego.source, 'https://www.sandiegocounty.gov/content/sdc/bhs/Outpatient_behavioral_health_centers.html')
  assert.equal(sanDiego.clinics.length, 20)
  assert.equal(new Set(sanDiego.clinics.map((clinic) => clinic.id)).size, sanDiego.clinics.length)
  assert.equal(sanDiego.clinics.filter((clinic) => clinic.zip === '92025').length, 2)
  assert.ok(sanDiego.clinics.every((clinic) => clinic.address && clinic.city && /^\d{5}$/.test(clinic.zip) && clinic.phone))
  assert.ok(!sanDiego.clinics.some((clinic) => clinic.name === 'Survivors of Torture International'))
})

test('DHCS-linked county plan websites are HTTPS landing pages, not a claim of provider coverage', () => {
  const names = new Set(countyAccess.countyPlans.map((plan) => plan.name))
  assert.equal(countySites.source, countyAccess.source)
  assert.ok(countySites.websites.length >= 15 && countySites.websites.length < names.size)
  assert.equal(new Set(countySites.websites.map((site) => site.name)).size, countySites.websites.length)
  assert.ok(countySites.websites.every((site) => names.has(site.name) && /^https:\/\/[^/]+/.test(site.url)))
  assert.ok(countySites.websites.some((site) => site.name === 'Butte'))
  assert.ok(!countySites.websites.some((site) => site.name === 'Colusa'))
})

test('official county mental health plan access spans every California county and ZIP matches can be ambiguous', () => {
  assert.equal(countyAccess.countyPlans.length, 58)
  assert.equal(new Set(countyAccess.countyPlans.map((plan) => plan.name)).size, 58)
  assert.ok(countyAccess.countyPlans.every((plan) => plan.phone && plan.name))
  assert.equal(countyAccess.countyPlans.find((plan) => plan.name === 'Colusa')?.phone, '(888) 793-6580')
  assert.deepEqual(countyAccess.zipCounties['92868'], ['Orange'])
  assert.deepEqual(countyAccess.zipCounties['90630'], ['Los Angeles', 'Orange'])
  assert.equal(countyAccess.zipCounties['99999'], undefined)
})

test('every mapped California ZIP resolves only to counties with an official access contact', () => {
  const names = new Set(countyAccess.countyPlans.map((plan) => plan.name))
  const entries = Object.entries(countyAccess.zipCounties)
  assert.ok(entries.length > 1800)
  for (const [zip, counties] of entries) {
    assert.match(zip, /^\d{5}$/)
    assert.ok(counties.length > 0)
    assert.ok(counties.every((name) => names.has(name)))
  }
})

test('official Orange County MHP sites include real entries without personal provider data', () => {
  assert.ok(orangeSites.length >= 50)
  assert.equal(new Set(orangeSites.map((site) => site.id)).size, orangeSites.length)
  const sites = orangeSites.filter((site) => site.zip === '92708')
  assert.equal(sites.length, 2)
  assert.ok(sites.every((site) => site.city === 'Fountain Valley'))
  assert.ok(orangeSites.every((site) => !('providers' in site) && site.name && site.zip && site.city))
  const physicalCountySites = orangeSites.filter((site) => countyAccess.zipCounties[site.zip]?.includes('Orange'))
  assert.equal(physicalCountySites.length, 98)
  assert.ok(orangeSites.some((site) => site.city === 'Woodland Hills' && !physicalCountySites.includes(site)))
})

test('ZIP fallback is based on unambiguous official California facility counties', () => {
  assert.equal(zipCounties['92708'], 'Orange')
  assert.equal(zipCounties['90012'], 'Los Angeles')
  assert.equal(zipCounties['99999'], undefined)
})

test('statewide snapshot lists licensed or approved mental-health facilities across California', () => {
  assert.ok(facilities.length >= 100)
  assert.ok(new Set(facilities.map((item) => item.county)).size >= 20)
  assert.ok(facilities.some((item) => item.county === 'Orange'))
  assert.ok(facilities.some((item) => item.county === 'San Diego'))
  assert.ok(facilities.some((item) => item.county === 'Los Angeles'))
  assert.equal(new Set(facilities.map((item) => item.id)).size, facilities.length)
  for (const facility of facilities) {
    assert.match(facility.zip, /^\d{5}$/)
    assert.ok(facility.name && facility.city && facility.county && facility.category)
    assert.ok(facility.source === 'DHCS' || facility.source === 'CDPH')
  }
})

test('Orange County listings are available even when an exact ZIP has no match', () => {
  assert.ok(facilities.filter((item) => item.county === 'Orange').length > 0)
  assert.equal(facilities.filter((item) => item.zip === '92708').length, 0)
})
