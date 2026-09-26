const API_ORIGIN = "https://hidex.dmh.lacounty.gov"
const API_PATH = "/provider/Location"
const SEARCH_PATH = "/api/la-county/locations"
const SOURCE_URL = "https://dmh.lacounty.gov/pd/"
const MAX_REQUEST_BYTES = 2048
const REQUEST_TIMEOUT_MS = 12000
const CITY_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'-]{0,59}$/u

function corsOrigin(request, env) {
  const origin = request.headers.get("Origin")
  if (!origin) return null

  try {
    if (new URL(origin).origin !== origin) return null
  } catch {
    return null
  }

  const requestOrigin = new URL(request.url).origin
  const allowed = new Set(
    (env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  )
  return origin === requestOrigin || allowed.has(origin) ? origin : null
}

function makeHeaders(origin, extra = {}) {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
    ...extra,
  })
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin)
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS")
    headers.set("Access-Control-Allow-Headers", "Content-Type")
    headers.set("Access-Control-Max-Age", "600")
  }
  return headers
}

function json(body, status, origin, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: makeHeaders(origin, extraHeaders),
  })
}

function validateInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null
  if (Object.keys(body).some((key) => key !== "searchType" && key !== "value")) return null
  const searchType = body.searchType
  if (searchType !== "city" && searchType !== "zip") return null
  if (typeof body.value !== "string") return null

  const value = body.value.normalize("NFC").trim().replace(/\s+/g, " ")
  if (value.length < 2 || (searchType === "zip" ? !/^\d{5}$/.test(value) : !CITY_PATTERN.test(value))) return null

  return { searchType, value }
}

function makeUpstreamUrl({ searchType, value }) {
  const url = new URL(API_PATH, API_ORIGIN)
  url.searchParams.set(searchType, value)
  return url
}

function hasMoreResults(bundle, input) {
  const next = bundle?.link?.find((link) => link?.relation === "next")?.url
  if (typeof next !== "string") return false

  try {
    const url = new URL(next, API_ORIGIN)
    if (url.origin !== API_ORIGIN || url.pathname !== API_PATH) return false
    const params = url.searchParams
    const queryValue = input.searchType === "city"
      ? params.get("city") ?? params.get("address-city")
      : params.get("zip") ?? params.get("address-postalcode")
    return queryValue?.trim().toLocaleLowerCase("en-US") === input.value.toLocaleLowerCase("en-US")
  } catch {
    return false
  }
}

function asStrings(values) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))]
}

function extensionValues(extension) {
  const concept = extension?.valueCodeableConcept
  const coding = Array.isArray(concept?.coding) ? concept.coding.map((item) => item?.display) : []
  const raw = [concept?.text, ...coding, extension?.valueString]
  return asStrings(raw.flatMap((value) => typeof value === "string" ? value.split(/[;,]/) : []))
}

function normalizeWebsite(value) {
  try {
    const text = String(value ?? "").trim()
    if (!text || text.length > 300) return null
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
    if (url.protocol !== "https:" || !url.hostname.includes(".")) return null
    return { label: url.hostname, url: url.href }
  } catch {
    return null
  }
}

function normalizeLocation(resource) {
  const address = resource?.address ?? {}
  const telecom = Array.isArray(resource?.telecom) ? resource.telecom : []
  const extensions = Array.isArray(resource?.extension) ? resource.extension : []
  const hoursOfOperation = Array.isArray(resource?.hoursOfOperation) ? resource.hoursOfOperation : []
  const addressLines = asStrings(Array.isArray(address.line) ? address.line : [])
  const languages = asStrings(extensions
    .filter((item) => /languageSpokenAtLocation/i.test(item?.url ?? ""))
    .flatMap(extensionValues))
  const populations = asStrings(extensions
    .filter((item) => /specialPopulationServed/i.test(item?.url ?? ""))
    .flatMap(extensionValues))
  const accessibility = asStrings([resource?.physicalType?.text])
  const phones = asStrings(telecom
    .filter((item) => item?.system === "phone")
    .map((item) => item?.value))
  const websites = [...new Map(telecom
    .filter((item) => item?.system === "url")
    .map((item) => normalizeWebsite(item?.value))
    .filter(Boolean)
    .map((site) => [site.url, site])).values()]
  const hours = hoursOfOperation.map((item) => ({
    days: asStrings(Array.isArray(item?.daysOfWeek) ? item.daysOfWeek : []),
    opens: typeof item?.openingTime === "string" ? item.openingTime : null,
    closes: typeof item?.closingTime === "string" ? item.closingTime : null,
  })).filter((item) => item.days.length || item.opens || item.closes)

  return {
    id: String(resource?.id ?? ""),
    name: String(resource?.name ?? "Unnamed directory listing").trim(),
    address: {
      lines: addressLines,
      city: String(address.city ?? "").trim(),
      state: String(address.state ?? "").trim(),
      postalCode: String(address.postalCode ?? "").trim(),
    },
    phones,
    websites,
    hours,
    languages,
    populations,
    accessibility,
    lastUpdated: typeof resource?.meta?.lastUpdated === "string" ? resource.meta.lastUpdated : null,
  }
}

function normalizeBundle(bundle) {
  if (!bundle || bundle.resourceType !== "Bundle" || !Array.isArray(bundle.entry)) return null
  return bundle.entry
    .map((entry) => entry?.resource)
    .filter((resource) => resource?.resourceType === "Location" && resource.status === "active")
    .map(normalizeLocation)
    .filter((location) => location.address.city && location.address.postalCode)
}

async function handleRequest(request, env = {}) {
  const url = new URL(request.url)
  if (url.pathname === "/health" && request.method === "GET") {
    return json({ ok: true }, 200, null)
  }
  if (url.pathname !== SEARCH_PATH) return json({ error: "Not found" }, 404, null)

  const origin = corsOrigin(request, env)
  if (!origin) return json({ error: "Origin is not allowed." }, 403, null)

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: makeHeaders(origin) })
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405, origin, { Allow: "POST, OPTIONS" })
  }
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "Send a JSON search request." }, 415, origin)
  }
  const declaredLength = Number(request.headers.get("Content-Length") ?? "0")
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return json({ error: "Search request is too large." }, 413, origin)
  }

  let bodyText
  try {
    bodyText = await request.text()
  } catch {
    return json({ error: "Could not read the search request." }, 400, origin)
  }
  if (new TextEncoder().encode(bodyText).byteLength > MAX_REQUEST_BYTES) {
    return json({ error: "Search request is too large." }, 413, origin)
  }

  let body
  try {
    body = JSON.parse(bodyText)
  } catch {
    return json({ error: "Invalid JSON search request." }, 400, origin)
  }
  const input = validateInput(body)
  if (!input) {
    return json({ error: "Enter a valid LA County city name or 5-digit ZIP code." }, 400, origin)
  }

  let upstream
  try {
    upstream = await fetch(makeUpstreamUrl(input), {
      headers: {
        Accept: "application/fhir+json, application/json",
        "Cache-Control": "no-cache",
        "User-Agent": "MindBridge LA County directory lookup",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    return json({ error: "The LA County directory could not be reached. Please try again." }, 502, origin)
  }

  if (upstream.status === 404) {
    return json({ results: [], hasMore: false, source: SOURCE_URL }, 200, origin)
  }
  if (upstream.status === 429) {
    const retryAfter = upstream.headers.get("Retry-After")
    const extra = retryAfter && /^\d{1,5}$/.test(retryAfter) ? { "Retry-After": retryAfter } : {}
    return json({ error: "The LA County directory is limiting requests. Please wait and try again." }, 429, origin, extra)
  }
  if (!upstream.ok) {
    return json({ error: "The LA County directory returned an error. Please use the official directory or try again later." }, 502, origin)
  }

  let bundle
  try {
    bundle = await upstream.json()
  } catch {
    return json({ error: "The LA County directory returned an unreadable response." }, 502, origin)
  }
  const results = normalizeBundle(bundle)
  if (!results) {
    return json({ error: "The LA County directory returned an unexpected response." }, 502, origin)
  }

  return json({
    results,
    hasMore: hasMoreResults(bundle, input),
    source: SOURCE_URL,
  }, 200, origin)
}

export { handleRequest, hasMoreResults, makeUpstreamUrl, normalizeBundle, normalizeLocation, validateInput }

export default { fetch: handleRequest }
