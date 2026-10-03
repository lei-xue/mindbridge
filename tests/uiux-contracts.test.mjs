// UI/UX contracts for the Emil review round: visible version identity and
// reduced-motion safety. These read source/config files only; no server.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8")

test("package version is a semver string used by the visible footer build stamp", () => {
  const pkg = JSON.parse(read("package.json"))
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/, "package.json version must be semver")
  const lock = JSON.parse(read("package-lock.json"))
  assert.equal(lock.version, pkg.version, "lockfile root version must match package.json")
  assert.equal(lock.packages[""].version, pkg.version, "lockfile package entry must match package.json")
  const viteConfig = read("vite.config.ts")
  assert.ok(viteConfig.includes("package.json"), "vite.config.ts must read the package version")
  assert.ok(
    viteConfig.includes("__APP_BUILD_VERSION__") && viteConfig.includes("appVersion"),
    "vite.config.ts must inject the package version into __APP_BUILD_VERSION__",
  )
})

test("global smooth scrolling is disabled under prefers-reduced-motion", () => {
  const css = read("src/index.css")
  assert.match(css, /html\s*\{[^}]*scroll-behavior:\s*smooth/s, "baseline smooth scrolling should exist")
  assert.match(
    css,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[^@]*html\s*\{[^}]*scroll-behavior:\s*auto/s,
    "reduced-motion users must get instant (auto) scrolling",
  )
})

test("skip link keeps its own reduced-motion guard", () => {
  const app = read("src/App.tsx")
  assert.ok(
    app.includes('matchMedia("(prefers-reduced-motion: reduce)")'),
    "skip-link scrollIntoView must keep respecting reduced motion",
  )
})

test("crisis banner keeps 24/7 hours on one unbroken line", () => {
  const banner = read("src/components/CrisisBanner.tsx")
  assert.match(banner, /whitespace-nowrap[^"]*"[^>]*>\{s\.crisisBanner\.hours\}/, "hours text must not wrap mid-phrase")
})

test("desktop search actions are width-limited but stay stacked on separate rows", () => {
  const search = read("src/components/CaliforniaFacilitySearch.tsx")
  assert.match(search, /className="grid gap-2 sm:max-w-sm"/, "action group must be width-limited on desktop")
  assert.ok(
    !search.includes("grid gap-2 sm:max-w-sm sm:grid-cols-2"),
    "actions must not be combined side by side",
  )
})
