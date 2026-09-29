import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const data = JSON.parse(readFileSync(new URL('../src/data/butte-adult-clinics.json', import.meta.url)))
test('Butte subset preserves four adult outpatient addresses and adult-only Paradise phone', () => {
  assert.equal(data.clinics.length, 4)
  assert.equal(new Set(data.clinics.map(x => x.id)).size, 4)
  assert.deepEqual(data.clinics.map(x => x.city), ['Chico', 'Gridley', 'Oroville', 'Paradise'])
  assert.equal(data.clinics.find(x => x.city === 'Paradise').phone, '530-877-5845')
  assert.equal(data.clinics.find(x => x.city === 'Oroville').address, '82 Table Mountain Blvd')
  for (const clinic of data.clinics) {
    assert.match(clinic.zip, /^\d{5}$/)
    assert.match(clinic.phone, /^530-\d{3}-\d{4}$/)
    assert.ok(clinic.source.startsWith('https://www.buttecounty.net/'))
  }
})
