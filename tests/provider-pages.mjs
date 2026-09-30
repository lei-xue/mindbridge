import { expect } from '@playwright/test'

// Inspect every page rather than weakening resource-retention assertions to a preview count.
export async function visitProviderPages(region, inspect = async () => {}) {
  const first = region.getByRole('button', { name: /^(Page|Página) 1$/ })
  if (await first.count()) await first.click()
  const entries = []
  for (;;) {
    const rows = region.locator('tr[data-provider]')
    const batch = await rows.evaluateAll(nodes => nodes.map(node => ({ id: node.getAttribute('data-provider'), text: node.textContent })))
    expect(batch.length).toBeLessThanOrEqual(5)
    expect(batch.length).toBeGreaterThan(0)
    await inspect(rows)
    entries.push(...batch)
    const next = region.getByRole('button', { name: /^(Next|Siguiente)$/ })
    if (!await next.count() || await next.isDisabled()) break
    const id = batch[0].id
    await next.click()
    await expect.poll(() => rows.first().getAttribute('data-provider')).not.toBe(id)
  }
  expect(new Set(entries.map(entry => entry.id)).size).toBe(entries.length)
  if (await first.count()) await first.click()
  return entries
}
