#!/usr/bin/env node
// Refresh the 58 official county plan access lines and local-only ZIP-to-county hints.
// Usage: node scripts/build_california_county_access.mjs PATH_TO_CENSUS_RELATIONSHIP_FILE
// Census source: https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt
// DHCS source: https://www.dhcs.ca.gov/individuals/county-mental-health-plan-information/
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'

const censusPath = process.argv[2]
if (!censusPath) throw new Error('Pass the downloaded Census 2020 ZCTA-to-county relationship file')
const censusText = readFileSync(censusPath, 'utf8')
const [header, ...lines] = censusText.trim().split(/\r?\n/)
const fields = header.split('|')
const zipIndex = fields.indexOf('GEOID_ZCTA5_20')
const fipsIndex = fields.indexOf('GEOID_COUNTY_20')
const countyIndex = fields.indexOf('NAMELSAD_COUNTY_20')
if ([zipIndex, fipsIndex, countyIndex].includes(-1)) throw new Error('Unexpected Census relationship columns')

const zipSets = new Map()
const officialCounties = new Set()
for (const line of lines) {
  const cells = line.split('|')
  if (!cells[fipsIndex]?.startsWith('06')) continue
  const county = cells[countyIndex]?.replace(/ County$/, '')
  const zip = cells[zipIndex]
  if (!county) continue
  officialCounties.add(county)
  if (!/^\d{5}$/.test(zip)) continue
  if (!zipSets.has(zip)) zipSets.set(zip, new Set())
  zipSets.get(zip).add(county)
}
if (officialCounties.size !== 58) throw new Error(`Expected 58 California counties, got ${officialCounties.size}`)

// Address-based CDPH observations fill ZIPs that the Census ZCTA approximation does not cover.
// They never erase an ambiguous Census relationship or override a conflicting county.
const observed = JSON.parse(readFileSync(new URL('../src/data/california-zip-counties.json', import.meta.url)))
for (const [zip, county] of Object.entries(observed)) {
  if (officialCounties.has(county) && !zipSets.has(zip)) zipSets.set(zip, new Set([county]))
}

const url = 'https://www.dhcs.ca.gov/individuals/county-mental-health-plan-information/'
const browser = await chromium.launch({ headless: true })
let rows
try {
  const page = await browser.newPage()
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 35000 })
  if (response?.status() !== 200) throw new Error(`DHCS returned ${response?.status()}`)
  rows = await page.locator('main table tr').evaluateAll((items) => items.slice(1).map((row) => [...row.cells].map((cell) => cell.innerText.replace(/\s+/g, ' ').trim())))
} finally {
  await browser.close()
}
if (rows.length < 55) throw new Error(`Incomplete DHCS contact table: ${rows.length} rows`)
const countyPlans = rows.flatMap(([label, phone]) => {
  const names = label === 'Sutter/Yuba' ? ['Sutter', 'Yuba'] : [label.replace(/ \(and City of Berkeley\)$/, '').replace(/ – Tri City$/, '')]
  return names.map((name) => ({ name, phone }))
}).sort((a, b) => a.name.localeCompare(b.name, 'en-US'))
if (countyPlans.length !== 58 || countyPlans.some((plan) => !officialCounties.has(plan.name) || !/\d{3}/.test(plan.phone)) || new Set(countyPlans.map((p) => p.name)).size !== 58) {
  throw new Error('DHCS county plan table does not match all 58 official counties')
}
const zipCounties = Object.fromEntries([...zipSets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([zip, counties]) => [zip, [...counties].sort((a, b) => a.localeCompare(b, 'en-US'))]))
const output = resolve(import.meta.dirname, '../src/data/california-county-access.json')
writeFileSync(output, JSON.stringify({
  source: url,
  zipSource: 'https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt',
  retrievedAt: new Date().toISOString().slice(0, 10),
  countyPlans,
  zipCounties,
}) + '\n')
console.log(`Wrote ${countyPlans.length} official county plan contacts and ${Object.keys(zipCounties).length} ZIP county hints to ${output}`)
