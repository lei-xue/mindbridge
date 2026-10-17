import { test, expect } from '@playwright/test'

test('legacy hash links still open their route', async ({ page }) => {
  await page.goto('/#/about')
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

for (const hash of ['#//example.com/x', '#/\\example.com/x']) {
  test(`cross-origin hash route ${hash} is ignored and the app still mounts`, async ({ page }) => {
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`/${hash}`)
    await expect(page.getByRole('button', { name: 'Use current location' })).toBeVisible()
    expect(new URL(page.url()).origin).toBe('http://127.0.0.1:4173')
    expect(errors).toEqual([])
  })
}
