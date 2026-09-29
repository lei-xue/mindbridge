import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const facilities = JSON.parse(readFileSync(new URL('../src/data/california-facilities.json', import.meta.url)))
const zipCounties = JSON.parse(readFileSync(new URL('../src/data/california-zip-counties.json', import.meta.url)))
const orangeSnapshot = JSON.parse(readFileSync(new URL('../src/data/orange-provider-sites.json', import.meta.url)))
const orangeSites = orangeSnapshot.sites

test('official Orange County MHP sites include real entries for ZIP 92706 without personal provider data', () => {
  assert.ok(orangeSites.length >= 50)
  assert.equal(new Set(orangeSites.map((site) => site.id)).size, orangeSites.length)
  const sites = orangeSites.filter((site) => site.zip === '92706')
  assert.equal(sites.length, 2)
  assert.ok(sites.every((site) => site.city === 'Santa Ana'))
  assert.ok(orangeSites.every((site) => !('providers' in site) && site.name && site.zip && site.city))
})

test('ZIP fallback is based on unambiguous official California facility counties', () => {
  assert.equal(zipCounties['92706'], 'Orange')
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
  assert.equal(facilities.filter((item) => item.zip === '92706').length, 0)
})
