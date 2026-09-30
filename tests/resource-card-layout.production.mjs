import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
const resources = JSON.parse(readFileSync(new URL('../src/data/resources.json', import.meta.url)))
const spanish = JSON.parse(readFileSync(new URL('../src/data/resources-es.json', import.meta.url)))
for (const locale of ['en', 'es']) {
  for (const [width, columns] of [[320, 1], [390, 1], [768, 2], [1024, 3], [1440, 3], [1920, 3]]) {
    test(`${locale} resource card grid keeps complete content, aligned actions and no overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(locale === 'es' ? '/es' : '/')
      const cards = page.locator('#directory article')
      await expect(cards).toHaveCount(resources.length)
      await expect(page.locator('#directory table')).toHaveCount(0)
      const layout = await cards.first().evaluate(el => {
        const grid = getComputedStyle(el.parentElement)
        return { display: grid.display, columns: grid.gridTemplateColumns.split(' ').length, padding: parseFloat(getComputedStyle(el).paddingLeft) }
      })
      expect(layout).toEqual({ display: 'grid', columns, padding: 20 })
      const metrics = await cards.evaluateAll(nodes => nodes.map(el => {
        const box = el.getBoundingClientRect()
        const p = el.querySelector('p')
        return { x: box.x, right: box.right, y: box.y, height: box.height, unclipped: p.scrollHeight <= p.clientHeight + 1, clamp: getComputedStyle(p).webkitLineClamp, overflow: getComputedStyle(p).overflow, links: Array.from(el.querySelectorAll('a')).map(a => a.getBoundingClientRect().height) }
      }))
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
      for (const metric of metrics) {
        expect(metric.x).toBeGreaterThanOrEqual(0)
        expect(metric.right).toBeLessThanOrEqual(width)
        expect(metric.unclipped).toBe(true)
        expect(['none', '']).toContain(metric.clamp)
        expect(metric.overflow).toBe('visible')
        for (const height of metric.links) expect(height).toBeGreaterThanOrEqual(44)
      }
      for (let i = 0; i < resources.length; i++) {
        await expect(cards.nth(i).locator('h3')).toHaveText(resources[i].name)
        await expect(cards.nth(i).locator('p')).toHaveText(locale === 'es' ? spanish[resources[i].id]?.description ?? resources[i].description : resources[i].description)
        await expect(cards.nth(i).locator('a[href*="/resource/"]')).toHaveCount(1)
      }
      for (let i = 1; i < columns; i++) {
        expect(metrics[i].y).toBe(metrics[0].y)
        expect(metrics[i].height).toBe(metrics[0].height)
      }
      if (width >= 1024) {
        const keyword = await page.locator('#filter-q').boundingBox()
        const select = await page.locator('#filter-region').boundingBox()
        expect(keyword.width).toBeGreaterThan(select.width * 1.8)
      }
    })
  }
}
