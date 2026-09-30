import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const data = JSON.parse(readFileSync(new URL('../src/data/california-primary-care.json', import.meta.url)))
const access = JSON.parse(readFileSync(new URL('../src/data/california-county-access.json', import.meta.url)))

test('HCAI snapshot has accurate counts, documented historical selection and public clinic metadata only', () => {
  assert.equal(data.clinics.length, data.clinicCount)
  assert.equal(new Set(data.clinics.map(c => c.county)).size, data.countyCount)
  assert.equal(new Set(data.clinics.map(c => c.id)).size, data.clinicCount)
  assert.equal(data.clinicCount, 603)
  assert.equal(data.countyCount, 48)
  assert.equal(data.reportYear, 2025)
  assert.equal(data.sourceExtractedAt, '2026-05-04')
  assert.match(data.sha256, /^[a-f\d]{64}$/)
  assert.deepEqual(data.selection, { sheet: 'Page 1-8', HEALTH_SERV_MENTAL_HEALTH: 'X', FAC_OPERATED_THIS_YR: 'Yes', LICENSE_STATUS: 'Open' })
  assert.equal(data.source, 'https://data.chhs.ca.gov/dataset/primary-care-clinic-annual-utilization-data')
  for (const clinic of data.clinics) {
    assert.deepEqual(Object.keys(clinic).sort(), ['address', 'city', 'county', 'id', 'name', 'phone', 'zip'])
    assert.match(clinic.id, /^306\d{6}$/)
    assert.match(clinic.zip, /^\d{5}(?:-\d{4})?$/)
    assert.ok(access.countyPlans.some(plan => plan.name === clinic.county))
    for (const value of Object.values(clinic)) assert.equal(typeof value, 'string')
    assert.ok(clinic.name && clinic.address && clinic.city && clinic.phone)
  }
})
