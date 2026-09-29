#!/usr/bin/env node
// Extract county-plan website links published by DHCS. These are plan landing
// pages, NOT provider listings or proof of current service availability.
// Only publish HTTPS pages that respond successfully at refresh time. A missing
// or inaccessible link leaves the county phone and DHCS source link unchanged.
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const source = 'https://www.dhcs.ca.gov/individuals/county-mental-health-plan-information/'
const browser = await chromium.launch({ headless: true })
let rows
try {
  const page = await browser.newPage()
  const response = await page.goto(source, { waitUntil: 'networkidle', timeout: 35000 })
  if (response?.status() !== 200) throw new Error(`DHCS returned ${response?.status()}`)
  rows = await page.locator('main table tr').evaluateAll((items) => items.slice(1).map((row) => ({
    label: row.cells[0]?.innerText.replace(/\s+/g, ' ').trim(),
    href: row.cells[0]?.querySelector('a')?.href || '',
  })))
} finally {
  await browser.close()
}
if (rows.length < 55) throw new Error(`Incomplete DHCS contact table: ${rows.length} rows`)

let index = 0
const websites = []
const skipped = []
await Promise.all(Array.from({ length: 5 }, async () => {
  while (index < rows.length) {
    const { label, href } = rows[index++]
    if (!href.startsWith('https://')) { skipped.push(label); continue }
    try {
      const response = await fetch(href, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000) })
      if (response.status !== 200 || !response.url.startsWith('https://')) { skipped.push(label); continue }
      const url = new URL(response.url)
      // Do not carry DHCS's old analytics parameters into visitor links.
      for (const key of [...url.searchParams.keys()]) if (key === '_gl' || key.startsWith('utm_')) url.searchParams.delete(key)
      if (url.toString() !== response.url) {
        const clean = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000) })
        if (clean.status !== 200 || !clean.url.startsWith('https://')) { skipped.push(label); continue }
      }
      const names = label === 'Sutter/Yuba' ? ['Sutter', 'Yuba'] : [label.replace(/ \(and City of Berkeley\)$/, '').replace(/ – Tri City$/, '')]
      for (const name of names) websites.push({ name, url: url.toString() })
    } catch { skipped.push(label) }
  }
}))
websites.sort((a, b) => a.name.localeCompare(b.name, 'en-US'))
if (websites.length < 15 || new Set(websites.map(({ name }) => name)).size !== websites.length) {
  throw new Error(`Too few usable unique county plan websites (${websites.length}); inspect DHCS before refreshing`)
}
const output = new URL('../src/data/california-county-sites.json', import.meta.url)
writeFileSync(output, JSON.stringify({ source, retrievedAt: new Date().toISOString().slice(0, 10), websites }) + '\n')
console.log(`Wrote ${websites.length} HTTPS county-plan landing pages; ${skipped.length} DHCS rows had no confirmed HTTPS destination. All 58 county phones remain separate.`)
