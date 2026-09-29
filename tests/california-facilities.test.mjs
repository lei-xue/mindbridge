import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const facilities = JSON.parse(readFileSync(new URL('../src/data/california-facilities.json', import.meta.url)))

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
