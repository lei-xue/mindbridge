import { expect, test } from "@playwright/test"

test("Browse all resources stays on the home page and reveals the directory", async ({ page }) => {
  await page.goto("/")

  await page.getByRole("link", { name: "Browse all resources" }).click()

  await expect(page.getByRole("heading", { name: "Browse resources" })).toBeVisible()
  await expect(page.getByText("Showing 23 of 23 resources")).toBeVisible()
})

test("local support callout offers official regional directories without requesting location", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByRole("heading", { name: "Looking for in-person support?" })).toBeVisible()
  const localSupport = page.locator('section[aria-labelledby="local-support-heading"]')
  await expect(localSupport.getByRole("link", { name: "Call 211" })).toHaveAttribute("href", "tel:211")
  await expect(localSupport.getByRole("link", { name: "Find your local 211 directory" })).toHaveAttribute(
    "href",
    "https://www.211.org/about-us/your-local-211",
  )
  const laDirectory = localSupport.getByRole("link", { name: "Los Angeles County DMH Provider Directory" })
  await expect(laDirectory).toHaveAttribute("href", "https://dmh.lacounty.gov/pd/")
  await expect(laDirectory).toHaveAttribute("target", "_blank")
  await expect(laDirectory).toHaveAttribute("rel", "noopener noreferrer")
  await expect(localSupport.getByText(/MindBridge does not request your GPS location/)).toBeVisible()
  await expect(localSupport.getByRole("button", { name: /location/i })).toHaveCount(0)
})

test("keyboard users can skip navigation and filter/clear results", async ({ page }) => {
  await page.goto("/")
  await page.keyboard.press("Tab")

  const skipLink = page.getByRole("link", { name: "Skip to main content" })
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeVisible()
  await page.keyboard.press("Enter")
  await expect(page.locator("#main-content")).toBeFocused()

  const search = page.getByRole("searchbox", { name: "Search" })
  let reachedSearch = false
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press("Tab")
    if (await search.evaluate((element) => element === document.activeElement)) {
      reachedSearch = true
      break
    }
  }
  expect(reachedSearch).toBe(true)
  await page.keyboard.type("no matching resource")
  await expect(search).toHaveValue("no matching resource")
  await expect(page.getByText("Showing 0 of 23 resources")).toBeVisible()
  await expect(page).not.toHaveURL(/q=/)

  const clearButton = page.getByRole("button", { name: "Clear filters" }).last()
  for (let i = 0; i < 6; i += 1) await page.keyboard.press("Tab")
  await expect(clearButton).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.getByText("Showing 23 of 23 resources")).toBeVisible()
})

test("keyboard navigation exposes a visible brand focus and opens About", async ({ page }) => {
  await page.goto("/")
  await page.keyboard.press("Tab")
  await page.keyboard.press("Tab")
  await page.keyboard.press("Tab")

  const brandLink = page.getByRole("link", { name: "MindBridge", exact: true })
  await expect(brandLink).toBeFocused()
  const outlineWidth = await brandLink.evaluate((element) => getComputedStyle(element).outlineWidth)
  expect(outlineWidth).toBe("2px")

  await page.keyboard.press("Tab")
  await page.keyboard.press("Tab")
  await expect(page.getByRole("link", { name: "About", exact: true })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("heading", { name: "About MindBridge", level: 1 })).toBeVisible()
})

test("non-sensitive region filters remain shareable while search text is not", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("searchbox", { name: "Search" }).fill("therapy")
  await page.getByLabel("Region").selectOption("California")

  await expect(page).toHaveURL(/region=California/)
  await expect(page).not.toHaveURL(/q=/)

  await page.getByRole("link", { name: "About", exact: true }).click()
  await expect(page.getByRole("heading", { name: "About MindBridge", level: 1 })).toBeVisible()
  await page.goBack()
  await expect(page.getByLabel("Region")).toHaveValue("California")
  await expect(page.getByRole("searchbox", { name: "Search" })).toHaveValue("")
})

test("mobile directory has no horizontal overflow and crisis actions remain visible", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/")

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)

  const crisisCard = page.locator("section[aria-labelledby='crisis-heading'] article").first()
  await expect(crisisCard.getByRole("link", { name: /Call 988/ })).toBeVisible()
  await expect(crisisCard.getByRole("link", { name: /Text 988/ })).toBeVisible()
})

test("keyboard activation opens resource details", async ({ page }) => {
  await page.goto("/")
  const resourceLink = page.getByRole("link", { name: "988 Suicide & Crisis Lifeline", exact: true })
  await resourceLink.focus()
  await page.keyboard.press("Enter")

  await expect(page.getByRole("heading", { name: "988 Suicide & Crisis Lifeline", level: 1 })).toBeVisible()
  await expect(page.getByRole("link", { name: "← All resources" })).toBeVisible()
})
