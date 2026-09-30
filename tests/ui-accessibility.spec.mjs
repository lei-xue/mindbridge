import { expect, test } from "@playwright/test"

test("county support link skips to the non-crisis search without displacing 988", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("link", { name: "Call or text 988 now" })).toBeVisible()
  await page.getByRole("link", { name: "Find in-person support by county" }).click()
  await expect(page.locator("#local-support-heading")).toBeFocused()
  await expect(page.getByLabel("California county")).toBeVisible()
})

test("Browse all resources stays on the home page and reveals the directory", async ({ page }) => {
  await page.goto("/")

  await page.getByRole("link", { name: "Browse all resources" }).click()

  await expect(page.getByRole("heading", { name: "Browse resources" })).toBeVisible()
  await expect(page.getByText("Showing 23 of 23 resources")).toBeVisible()
})

test("local support search offers the County directory and explains location privacy", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByRole("heading", { name: "Looking for in-person support?" })).toBeVisible()
  const localSupport = page.locator('section[aria-labelledby="local-support-heading"]')
  await expect(localSupport.getByRole("link", { name: "Call 211" })).toHaveAttribute("href", "tel:211")
  await expect(localSupport.getByRole("link", { name: "Find your local 211 directory" })).toHaveAttribute(
    "href",
    "https://www.211.org/about-us/your-local-211",
  )
  await expect(localSupport.getByRole("link", { name: "Los Angeles County DMH Provider Directory" })).toHaveCount(0)
  await expect(localSupport.getByRole("heading", { name: "Find in-person mental-health support in California" })).toHaveCount(0)
  await expect(localSupport.getByRole('group', { name: 'Search by' })).toBeVisible()
  await expect(localSupport.locator('form')).toHaveCount(1)
  await localSupport.getByText("Search coverage and privacy").click()
  await expect(localSupport.getByText(/Device coordinates stay in your browser/)).toBeVisible()
  await expect(localSupport.getByText(/Submitting a ZIP mapped only to LA sends the ZIP through Cloudflare/)).toBeVisible()
  await expect(localSupport.getByRole("button", { name: "Use current location" })).toBeVisible()
})

test("LA County city/ZIP search uses POST, keeps the query out of the URL, and discloses partial results", async ({ page }) => {
  const requests = []
  await page.route("**/api/la-county/locations", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}")
    requests.push(body)
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        results: [{
          id: "sample-1",
          name: "First directory listing",
          address: { lines: ["100 Test St"], city: "LOS ANGELES", state: "CA", postalCode: "90012" },
          phones: ["(555) 010-0000"], websites: [], hours: [], languages: ["English"], populations: [], accessibility: [], lastUpdated: null,
        }],
        hasMore: true,
      }),
    })
  })

  await page.goto("/")
  await page.getByRole("button", { name: "ZIP code", exact: true }).click()
  await page.getByRole("textbox", { name: /^California (city|ZIP code)$/ }).fill("9001")
  await page.getByRole("button", { name: "Find support options" }).click()
  await expect(page.getByRole("alert")).toHaveText("Enter a 5-digit California ZIP code.")
  expect(requests).toHaveLength(0)

  await page.getByRole("textbox", { name: /^California (city|ZIP code)$/ }).fill("90012")
  await page.getByRole("button", { name: "Find support options" }).click()
  await expect(page.getByRole("heading", { name: "1 directory listing for ZIP 90012" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "First directory listing" })).toBeVisible()
  await expect(page.getByText(/Languages listed:/)).toBeHidden()
  await page.getByText(/Listed hours, languages & accessibility/).click()
  await expect(page.getByText(/Languages listed:/)).toBeVisible()
  await expect(page.getByText(/0 statewide licensed-facility listings for zip 90012/)).toHaveCount(0)
  await expect(page.getByText(/No listed facilities in that exact ZIP/)).toHaveCount(0)
  await expect(page.getByText(/additional matches beyond this result page/)).toBeVisible()
  await expect(page.getByRole("button", { name: "Load more listings" })).toHaveCount(0)
  expect(requests).toEqual([{ searchType: "zip", value: "90012" }])
  await expect(page).not.toHaveURL(/90012/)
})

test("city search only sends location to LA after a separate click", async ({ page }) => {
  const requests = []
  await page.route("**/api/la-county/locations", async (route) => {
    requests.push(JSON.parse(route.request().postData() || "{}"))
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ results: [], hasMore: false }) })
  })
  await page.goto("/")
  await page.getByRole("button", { name: "City", exact: true }).click()
  await page.getByRole("textbox", { name: /^California (city|ZIP code)$/ }).fill("Pasadena")
  await page.getByRole("button", { name: "Find support options" }).click()
  await expect(page.getByRole("button", { name: "Search live LA County directory" })).toBeVisible()
  expect(requests).toEqual([])
  await page.getByRole("button", { name: "Search live LA County directory" }).click()
  await expect(page.getByRole("heading", { name: "0 directory listings for city Pasadena" })).toBeVisible()
  expect(requests).toEqual([{ searchType: "city", value: "Pasadena" }])
  await page.getByRole("textbox", { name: /^California (city|ZIP code)$/ }).fill("Santa Ana")
  await page.getByRole("button", { name: "Find support options" }).click()
  await expect(page.getByText(/Orange County BHP provider sites for city Santa Ana/)).toBeVisible()
  await expect(page.getByRole("heading", { name: "Live LA County DMH directory" })).toHaveCount(0)
  expect(requests).toHaveLength(1)
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
  await expect(page.getByText("Showing 20 of 23 resources")).toBeVisible()
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
  await page.getByRole("button", { name: "Include crisis lines here" }).click()
  const resourceLink = page.getByRole("link", { name: "988 Suicide & Crisis Lifeline", exact: true })
  await resourceLink.focus()
  await page.keyboard.press("Enter")

  await expect(page.getByRole("heading", { name: "988 Suicide & Crisis Lifeline", level: 1 })).toBeVisible()
  await expect(page.getByRole("link", { name: "← All resources" })).toBeVisible()
})
