#!/usr/bin/env node
// Minimize San Diego County's public adult outpatient behavioral health clinic
// tables. This is a subset of county clinics (ages 18+), not a full BHP roster.
// A contact-only row without a physical address is deliberately excluded.
// Source: https://www.sandiegocounty.gov/content/sdc/bhs/Outpatient_behavioral_health_centers.html
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const source = 'https://www.sandiegocounty.gov/content/sdc/bhs/Outpatient_behavioral_health_centers.html'
const browser = await chromium.launch({ headless: true })
let rows
try {
  const page = await browser.newPage()
  const response = await page.goto(source, { waitUntil: 'domcontentloaded', timeout: 35000 })
  if (response?.status() !== 200 || !(await page.getByText('Behavioral Health Clinic Locations for Adults').count())) {
    throw new Error('San Diego adult-clinic page is unavailable or changed')
  }
  rows = await page.locator('table').evaluateAll((tables) => tables.flatMap((table) => [...table.rows].slice(1).map((row) => ({
    name: row.cells[0]?.innerText.replace(/\s+/g, ' ').trim() || '',
    location: row.cells[1]?.innerText.replace(/\s+/g, ' ').trim() || '',
  }))))
} finally {
  await browser.close()
}

const cities = ['San Diego', 'Chula Vista', 'El Cajon', 'Escondido', 'Oceanside', 'Fallbrook', 'Ramona', 'Vista']
const addressPattern = new RegExp(`^(.+?),\\s*(${cities.join('|')})(?:,?\\s+CA)?[,]?[\\s]+(\\d{5})$`, 'i')
const clinics = []
const skipped = []
for (const row of rows) {
  if (!row.name || !row.location) throw new Error('Missing clinic name or location cell')
  const address = row.location.split(/\s+(?:Neighborhood:|Phone:)/)[0]
    .replace(/^HHSA Ramona Community Resource Center\s+/, '')
  const match = address.match(addressPattern)
  if (!match) {
    if (row.name === 'Survivors of Torture International' && address === 'Address: Contact Program') {
      skipped.push(row.name)
      continue
    }
    throw new Error(`Unparseable address for ${row.name}: ${address}`)
  }
  const phone = row.location.match(/\bPhone:\s*(\(\d{3}\)\s*\d{3}-\d{4})/)?.[1]
  if (!phone || !/^\d+\b/.test(match[1])) throw new Error(`Invalid phone or street for ${row.name}`)
  const [ , street, city, zip ] = match
  const key = `${row.name}|${street}|${zip}`.toLowerCase()
  clinics.push({
    id: `sd-${createHash('sha256').update(key).digest('hex').slice(0, 16)}`,
    name: row.name,
    address: street,
    city: cities.find((candidate) => candidate.toLowerCase() === city.toLowerCase()),
    zip,
    phone,
  })
}
clinics.sort((a, b) => (a.zip.localeCompare(b.zip) || a.name.localeCompare(b.name, 'en-US')))
if (rows.length !== 21 || clinics.length !== 20 || skipped.length !== 1 || new Set(clinics.map((clinic) => clinic.id)).size !== clinics.length) {
  throw new Error(`Unexpected San Diego county page structure: ${rows.length} rows, ${clinics.length} clinics, ${skipped.length} contact-only rows`)
}
const output = new URL('../src/data/san-diego-adult-clinics.json', import.meta.url)
writeFileSync(output, JSON.stringify({ source, retrievedAt: new Date().toISOString().slice(0, 10), clinics }) + '\n')
console.log(`Wrote ${clinics.length} address-verified San Diego County adult clinic sites; excluded ${skipped.length} contact-only row`)
