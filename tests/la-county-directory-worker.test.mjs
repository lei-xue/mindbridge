import assert from "node:assert/strict"
import test from "node:test"
import worker, {
  makeUpstreamUrl,
  hasMoreResults,
  normalizeBundle,
  validateInput,
} from "../workers/la-county-directory/index.js"

const APP_ORIGIN = "http://localhost:5173"
const WORKER_URL = "http://127.0.0.1:8787/api/la-county/locations"
const env = { ALLOWED_ORIGINS: APP_ORIGIN }

function request(body, headers = {}) {
  return new Request(WORKER_URL, {
    method: "POST",
    headers: {
      Origin: APP_ORIGIN,
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

function sampleLocation(overrides = {}) {
  return {
    resourceType: "Location",
    id: "test-listing",
    status: "active",
    name: "Test directory listing",
    address: { line: ["123 Main St"], city: "Pasadena", state: "CA", postalCode: "91101" },
    telecom: [
      { system: "phone", value: "(555) 010-0000" },
      { system: "url", value: "example.org" },
      { system: "url", value: "http://insecure.example.org" },
    ],
    extension: [
      {
        url: "https://example.org/fhir/StructureDefinition/languageSpokenAtLocation",
        valueCodeableConcept: { coding: [{ display: "English" }], text: "English" },
      },
    ],
    hoursOfOperation: [{ daysOfWeek: ["mon", "tue"], openingTime: "09:00:00", closingTime: "17:00:00" }],
    meta: { lastUpdated: "2026-09-01T12:00:00Z" },
    ...overrides,
  }
}

function bundle(location = sampleLocation(), extra = {}) {
  return { resourceType: "Bundle", entry: [{ resource: location }], ...extra }
}

async function withMockFetch(t, mock) {
  const original = globalThis.fetch
  globalThis.fetch = mock
  t.after(() => { globalThis.fetch = original })
}

test("validates city and 5-digit ZIP inputs and rejects URL-like or overlong values", () => {
  assert.deepEqual(validateInput({ searchType: "city", value: "  La Cañada   Flintridge " }), {
    searchType: "city",
    value: "La Cañada Flintridge",
  })
  assert.equal(validateInput({ searchType: "zip", value: "90012" })?.value, "90012")
  assert.equal(validateInput({ searchType: "zip", value: "9001" }), null)
  assert.equal(validateInput({ searchType: "city", value: "Pasadena?zip=90012" }), null)
  assert.equal(validateInput({ searchType: "city", value: "A" }), null)
  assert.equal(validateInput({ searchType: "city", value: "x".repeat(61) }), null)
  assert.equal(validateInput({ searchType: "city", value: "Pasadena", cursor: "https://example.com" }), null)
})

test("builds only the bounded County city or ZIP search parameters", () => {
  const url = makeUpstreamUrl({ searchType: "city", value: "Pasadena" })
  assert.equal(url.origin, "https://hidex.dmh.lacounty.gov")
  assert.equal(url.pathname, "/provider/Location")
  assert.equal(url.searchParams.get("city"), "Pasadena")
  assert.equal([...url.searchParams.keys()].join(","), "city")
})

test("marks a valid County continuation as more results without exposing its token", () => {
  const nextBundle = bundle(sampleLocation(), {
    link: [{ relation: "next", url: "https://hidex.dmh.lacounty.gov/provider/Location?address-city=Pasadena&ct=private_cursor" }],
  })
  assert.equal(hasMoreResults(nextBundle, { searchType: "city", value: "Pasadena" }), true)
  assert.equal(hasMoreResults(nextBundle, { searchType: "city", value: "Alhambra" }), false)
  assert.equal(hasMoreResults(bundle(sampleLocation(), {
    link: [{ relation: "next", url: "https://example.org/provider/Location?city=Pasadena&ct=bad" }],
  }), { searchType: "city", value: "Pasadena" }), false)
})

test("normalizes active location data and filters unsafe website schemes", () => {
  const results = normalizeBundle(bundle())
  assert.equal(results.length, 1)
  assert.equal(results[0].name, "Test directory listing")
  assert.deepEqual(results[0].address.lines, ["123 Main St"])
  assert.deepEqual(results[0].languages, ["English"])
  assert.deepEqual(results[0].websites, [{ label: "example.org", url: "https://example.org/" }])
  assert.equal(results[0].lastUpdated, "2026-09-01T12:00:00Z")
  assert.deepEqual(normalizeBundle(bundle(sampleLocation({ status: "inactive" }))), [])
  assert.equal(normalizeBundle({ resourceType: "OperationOutcome" }), null)
})

test("proxies city search, reports an additional County page, and never forwards visitor IP headers", async (t) => {
  await withMockFetch(t, async (url, options) => {
    const upstreamUrl = new URL(url)
    assert.equal(upstreamUrl.origin, "https://hidex.dmh.lacounty.gov")
    assert.equal(upstreamUrl.pathname, "/provider/Location")
    assert.equal(upstreamUrl.searchParams.get("city"), "Pasadena")
    assert.equal(options.headers.Accept, "application/fhir+json, application/json")
    assert.equal(Object.hasOwn(options.headers, "CF-Connecting-IP"), false)
    return new Response(JSON.stringify(bundle(sampleLocation(), {
      link: [{ relation: "next", url: "https://hidex.dmh.lacounty.gov/provider/Location?address-city=Pasadena&ct=next_token_1" }],
    })), { status: 200, headers: { "Content-Type": "application/fhir+json" } })
  })

  const incoming = request({ searchType: "city", value: "Pasadena" }, { "CF-Connecting-IP": "203.0.113.10" })
  const response = await worker.fetch(incoming, env)
  const payload = await response.json()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), APP_ORIGIN)
  assert.equal(response.headers.get("Cache-Control"), "no-store")
  assert.equal(payload.results[0].name, "Test directory listing")
  assert.equal(payload.hasMore, true)
  assert.equal(Object.hasOwn(payload, "nextCursor"), false)
})

test("rejects an unapproved browser origin without making an upstream request", async (t) => {
  await withMockFetch(t, async () => { throw new Error("upstream must not be called") })
  const response = await worker.fetch(
    request({ searchType: "zip", value: "90012" }, { Origin: "https://not-allowed.example" }),
    env,
  )
  assert.equal(response.status, 403)
})

test("rejects malformed search bodies before contacting the County API", async (t) => {
  await withMockFetch(t, async () => { throw new Error("upstream must not be called") })
  const response = await worker.fetch(request({ searchType: "zip", value: "9001" }), env)
  assert.equal(response.status, 400)
  assert.match((await response.json()).error, /5-digit ZIP/)
})

test("rejects oversized request bodies before contacting the County API", async (t) => {
  await withMockFetch(t, async () => { throw new Error("upstream must not be called") })
  const oversized = new Request(WORKER_URL, {
    method: "POST",
    headers: {
      Origin: APP_ORIGIN,
      "Content-Type": "application/json",
      "Content-Length": "2049",
    },
    body: "x".repeat(2049),
  })
  const response = await worker.fetch(oversized, env)
  assert.equal(response.status, 413)
})

test("returns an empty result for an upstream no-match response", async (t) => {
  await withMockFetch(t, async () => new Response("", { status: 404 }))
  const response = await worker.fetch(request({ searchType: "zip", value: "90012" }), env)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    results: [],
    hasMore: false,
    source: "https://dmh.lacounty.gov/pd/",
  })
})

test("reports upstream rate limits without exposing the upstream body", async (t) => {
  await withMockFetch(t, async () => new Response("internal details", {
    status: 429,
    headers: { "Retry-After": "30" },
  }))
  const response = await worker.fetch(request({ searchType: "zip", value: "90012" }), env)
  assert.equal(response.status, 429)
  assert.equal(response.headers.get("Retry-After"), "30")
  assert.doesNotMatch(JSON.stringify(await response.json()), /internal details/)
})
