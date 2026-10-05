import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import ts from "typescript"

const source = readFileSync(new URL("../src/lib/laCountyCache.ts", import.meta.url), "utf8")
  .replace(/^import type .*$/m, "")
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const { createLaCountyCache } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`)

const ENDPOINT = "https://worker.test/la-county"
const TTL = 1000

const makeResult = (id, name = "Center") => ({
  id,
  name,
  address: { lines: ["123 Synthetic St"], city: "Los Angeles", state: "CA", postalCode: "" },
  phones: [],
  websites: [],
  hours: [],
  languages: [],
  populations: [],
  accessibility: [],
  lastUpdated: null,
})

const makeCache = (overrides = {}) => {
  const state = { now: 10_000, calls: [] }
  const load = async (searchType, value) => {
    state.calls.push([searchType, value])
    return overrides.loadResults ?? { results: [makeResult(`r${state.calls.length}`)], hasMore: false }
  }
  const cache = createLaCountyCache({
    endpoint: ENDPOINT,
    load,
    now: () => state.now,
    ttlMs: TTL,
    maxEntries: 20,
    ...overrides.factory,
  })
  return { state, cache }
}

test("repeat search within TTL returns cached copy preserving original fetchedAt", async () => {
  const { state, cache } = makeCache()
  const first = await cache.search("city", "Los Angeles", new AbortController().signal)
  state.now += 500
  const second = await cache.search("city", "Los Angeles", new AbortController().signal)
  assert.equal(state.calls.length, 1)
  assert.equal(second.cacheHit, true)
  assert.equal(second.fetchedAt, first.fetchedAt)
  cache.clear()
})

test("force bypasses cache and refetches", async () => {
  const { state, cache } = makeCache()
  await cache.search("city", "Los Angeles", new AbortController().signal)
  const forced = await cache.search("city", "Los Angeles", new AbortController().signal, true)
  assert.equal(state.calls.length, 2)
  assert.equal(forced.cacheHit, false)
  cache.clear()
})

test("expired entries and backwards clock do not serve fresh hits", async () => {
  const { state, cache } = makeCache()
  await cache.search("city", "Pasadena", new AbortController().signal)
  state.now += TTL
  const expired = await cache.search("city", "Pasadena", new AbortController().signal)
  assert.equal(expired.cacheHit, false)
  assert.equal(state.calls.length, 2)
  const saved = state.now
  state.now -= 50
  const backwards = await cache.search("city", "Pasadena", new AbortController().signal)
  assert.equal(backwards.cacheHit, false)
  assert.equal(state.calls.length, 3)
  state.now = saved
  cache.clear()
})

test("LRU evicts least recently used beyond 20 entries", async () => {
  const { state, cache } = makeCache()
  for (let i = 0; i < 20; i += 1) {
    await cache.search("city", `City ${i}`, new AbortController().signal)
  }
  await cache.search("city", "City 0", new AbortController().signal)
  await cache.search("city", "City 20", new AbortController().signal)
  assert.equal(state.calls.length, 21)
  const evicted = await cache.search("city", "City 1", new AbortController().signal)
  assert.equal(evicted.cacheHit, false)
  const kept = await cache.search("city", "City 0", new AbortController().signal)
  assert.equal(kept.cacheHit, true)
  cache.clear()
})

test("cached results are deep copies isolated from caller mutation", async () => {
  const { state, cache } = makeCache()
  const first = await cache.search("city", "Los Angeles", new AbortController().signal)
  first.results[0].name = "MUTATED"
  first.results[0].address.lines.push("evil")
  const second = await cache.search("city", "Los Angeles", new AbortController().signal)
  assert.equal(state.calls.length, 1)
  assert.equal(second.results[0].name, "Center")
  assert.deepEqual(second.results[0].address.lines, ["123 Synthetic St"])
  cache.clear()
})

test("loader failures and malformed payloads are not cached", async () => {
  const bad = makeCache({ loadResults: { results: [{ id: "" }] } })
  await assert.rejects(bad.cache.search("city", "Los Angeles", new AbortController().signal), /unexpected response/)
  bad.state.calls.length = 0
  await assert.rejects(bad.cache.search("city", "Los Angeles", new AbortController().signal), /unexpected response/)
  assert.equal(bad.state.calls.length, 1)
  bad.cache.clear()

  const failing = makeCache({ factory: { load: async () => { throw new Error("boom") } } })
  await assert.rejects(failing.cache.search("zip", "ABCDE", new AbortController().signal), /boom/)
  await assert.rejects(failing.cache.search("zip", "ABCDE", new AbortController().signal), /boom/)
  failing.cache.clear()
})

test("genuine successful empty results are cached with hasMore normalized false", async () => {
  const { state, cache } = makeCache({ loadResults: { results: [] } })
  const first = await cache.search("zip", "ABCDE", new AbortController().signal)
  assert.equal(first.hasMore, false)
  const second = await cache.search("zip", "ABCDE", new AbortController().signal)
  assert.equal(second.cacheHit, true)
  assert.equal(state.calls.length, 1)
  cache.clear()
})

test("abort before lookup and ignored abort after load reject with AbortError", async () => {
  const { cache } = makeCache()
  const pre = new AbortController()
  pre.abort()
  await assert.rejects(
    cache.search("city", "Los Angeles", pre.signal),
    (err) => err.name === "AbortError",
  )
  cache.clear()

  const late = makeCache({
    factory: {
      load: async () => {
        await new Promise((resolve) => setTimeout(resolve, 5))
        return { results: [makeResult("x")] }
      },
    },
  })
  const ctrl = new AbortController()
  const promise = late.cache.search("city", "Los Angeles", ctrl.signal)
  ctrl.abort()
  await assert.rejects(promise, (err) => err.name === "AbortError")
  late.cache.clear()
})

test("key includes endpoint, searchType, and value exactly", async () => {
  const { state, cache } = makeCache()
  await cache.search("city", "Pasadena", new AbortController().signal)
  const otherType = await cache.search("zip", "Pasadena", new AbortController().signal)
  assert.equal(otherType.cacheHit, false)
  const otherEndpoint = createLaCountyCache({
    endpoint: "https://other.test/la-county",
    load: async () => ({ results: [makeResult("other")] }),
    now: () => state.now,
    ttlMs: TTL,
  })
  const other = await otherEndpoint.search("city", "Pasadena", new AbortController().signal)
  assert.equal(other.cacheHit, false)
  assert.equal(state.calls.length, 2)
  otherEndpoint.clear()
  cache.clear()
})

test("loader-owned payload mutations cannot contaminate stored snapshots", async () => {
  const payload = { results: [makeResult("write-isolation")], hasMore: true }
  const { cache } = makeCache({ loadResults: payload })
  await cache.search("city", "Los Angeles", new AbortController().signal)
  payload.results[0].address.lines.push("MUTATED SOURCE")
  payload.hasMore = false
  const hit = await cache.search("city", "Los Angeles", new AbortController().signal)
  assert.deepEqual(hit.results[0].address.lines, ["123 Synthetic St"])
  assert.equal(hit.hasMore, true)
  cache.clear()
})

test("a loader ignoring cancellation does not warm a later lookup", async () => {
  let release
  let calls = 0
  const payload = { results: [makeResult("late-source")] }
  const cache = createLaCountyCache({ endpoint: ENDPOINT, load: () => {
    calls += 1
    return calls === 1 ? new Promise(resolve => { release = resolve }) : payload
  } })
  const controller = new AbortController()
  const pending = cache.search("city", "Los Angeles", controller.signal)
  controller.abort()
  release(payload)
  await assert.rejects(pending, { name: "AbortError" })
  const next = await cache.search("city", "Los Angeles", new AbortController().signal)
  assert.equal(calls, 2)
  assert.equal(next.cacheHit, false)
  cache.clear()
})

test("scheduled expiry deletes even an otherwise inactive entry", async () => {
  const { cache, state } = makeCache({ factory: { ttlMs: 25 } })
  await cache.search("city", "Pasadena", new AbortController().signal)
  await new Promise(resolve => setTimeout(resolve, 60))
  const next = await cache.search("city", "Pasadena", new AbortController().signal)
  assert.equal(next.cacheHit, false)
  assert.equal(state.calls.length, 2)
  cache.clear()
})

for (const [label, mutate] of [
  ["address lines", row => { row.address.lines = null }],
  ["phone array", row => { row.phones = [null] }],
  ["website record", row => { row.websites = [{ label: "bad", url: null }] }],
  ["hours record", row => { row.hours = [{ days: null, opens: null, closes: null }] }],
  ["languages", row => { row.languages = null }],
  ["source date", row => { row.lastUpdated = {} }],
]) {
  test(`malformed nested ${label} never becomes a cached success`, async () => {
    const row = makeResult("malformed")
    mutate(row)
    const { cache, state } = makeCache({ loadResults: { results: [row] } })
    for (let i = 0; i < 2; i++) await assert.rejects(cache.search("city", "Los Angeles", new AbortController().signal), /unexpected response/)
    assert.equal(state.calls.length, 2)
    cache.clear()
  })
}

test("an error envelope with empty rows is not genuine empty success", async () => {
  const { cache, state } = makeCache({ loadResults: { results: [], error: "SYNTHETIC failure" } })
  for (let i = 0; i < 2; i++) await assert.rejects(cache.search("city", "Los Angeles", new AbortController().signal), /unexpected response/)
  assert.equal(state.calls.length, 2)
  cache.clear()
})

test("literal value case and interior spacing stay distinct", async () => {
  const { cache, state } = makeCache()
  for (const value of ["Los Angeles", "los angeles", "Los  Angeles"]) {
    assert.equal((await cache.search("city", value, new AbortController().signal)).cacheHit, false)
  }
  assert.equal(state.calls.length, 3)
  cache.clear()
})
