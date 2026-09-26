import { useState, type FormEvent } from "react"
import { btnSecondary, focusRing } from "../lib/ui"

type SearchType = "zip" | "city"
type DirectoryResult = {
  id: string
  name: string
  address: { lines: string[]; city: string; state: string; postalCode: string }
  phones: string[]
  websites: { label: string; url: string }[]
  hours: { days: string[]; opens: string | null; closes: string | null }[]
  languages: string[]
  populations: string[]
  accessibility: string[]
  lastUpdated: string | null
}
type SearchResponse = { results: DirectoryResult[]; hasMore?: boolean; source?: string; error?: string }

const API_URL = import.meta.env.VITE_LA_COUNTY_API_URL?.trim() || "/api/la-county/locations"
const controlClass = `min-h-11 w-full rounded-lg border border-sage-300 bg-white px-3 py-2.5 text-base text-stone-800 ${focusRing}`
const countyDirectoryUrl = "https://dmh.lacounty.gov/pd/"

function formatHours(hours: DirectoryResult["hours"]) {
  return hours.map((item) => {
    const days = item.days.map((day) => day.slice(0, 3)).join(", ")
    const times = item.opens && item.closes ? `${item.opens}–${item.closes}` : "hours not specified"
    return [days, times].filter(Boolean).join(": ")
  }).join("; ")
}

function formatRecordDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(date)
}

function ResultCard({ result }: { result: DirectoryResult }) {
  const address = [
    ...result.address.lines,
    [result.address.city, result.address.state, result.address.postalCode].filter(Boolean).join(", "),
  ].filter(Boolean).join(" · ")

  return (
    <article className="rounded-xl border border-sage-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-stone-900">{result.name}</h3>
      {address && <p className="mt-2 text-sm leading-relaxed text-stone-700">{address}</p>}
      {result.phones.length > 0 && (
        <p className="mt-2 text-sm text-stone-700">
          <span className="font-semibold">Phone:</span> {result.phones.join(" · ")}
        </p>
      )}
      {result.hours.length > 0 && (
        <p className="mt-2 text-sm text-stone-700">
          <span className="font-semibold">Listed hours:</span> {formatHours(result.hours)}
        </p>
      )}
      {result.languages.length > 0 && (
        <p className="mt-2 text-sm text-stone-700">
          <span className="font-semibold">Languages listed:</span> {result.languages.join(", ")}
        </p>
      )}
      {result.populations.length > 0 && (
        <p className="mt-2 text-sm text-stone-700">
          <span className="font-semibold">Populations listed:</span> {result.populations.join(", ")}
        </p>
      )}
      {result.accessibility.length > 0 && (
        <p className="mt-2 text-sm text-stone-700">
          <span className="font-semibold">Accessibility / location note:</span> {result.accessibility.join("; ")}
        </p>
      )}
      {result.websites.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={`Websites for ${result.name}`}>
          {result.websites.map((site) => (
            <li key={site.url}>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded font-semibold text-teal-800 underline ${focusRing}`}
              >
                {site.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      {result.lastUpdated && (
        <p className="mt-3 text-xs text-stone-500">
          Directory record last updated: {formatRecordDate(result.lastUpdated)}
        </p>
      )}
    </article>
  )
}

export function LaCountyDirectorySearch() {
  const [searchType, setSearchType] = useState<SearchType>("zip")
  const [value, setValue] = useState("")
  const [submittedValue, setSubmittedValue] = useState("")
  const [submittedType, setSubmittedType] = useState<SearchType>("zip")
  const [results, setResults] = useState<DirectoryResult[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const requestPage = async (type: SearchType, query: string) => {
    setIsLoading(true)
    setError("")
    setStatus("Searching the LA County directory…")
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchType: type, value: query }),
      })
      const payload = await response.json().catch(() => null) as SearchResponse | null
      if (!response.ok) throw new Error(payload?.error || "The directory search is temporarily unavailable.")
      if (!payload || !Array.isArray(payload.results)) throw new Error("The directory returned an unexpected response.")

      setResults(payload.results)
      setHasMore(Boolean(payload.hasMore))
      setStatus("")
    } catch (caught) {
      setStatus("")
      setError(caught instanceof Error ? caught.message : "The directory search is temporarily unavailable.")
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = value.trim().replace(/\s+/g, " ")
    if (searchType === "zip" && !/^\d{5}$/.test(query)) {
      setError("Enter a 5-digit ZIP code.")
      setStatus("")
      setResults([])
      setHasMore(false)
      return
    }
    if (searchType === "city" && (query.length < 2 || query.length > 60 || !/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(query))) {
      setError("Enter a city name using letters, spaces, apostrophes, periods, or hyphens.")
      setStatus("")
      setResults([])
      setHasMore(false)
      return
    }
    setSubmittedValue(query)
    setSubmittedType(searchType)
    setResults([])
    setHasMore(false)
    void requestPage(searchType, query)
  }

  const changeSearchType = (nextType: SearchType) => {
    setSearchType(nextType)
    setValue("")
    setSubmittedValue("")
    setResults([])
    setHasMore(false)
    setStatus("")
    setError("")
  }

  return (
    <div className="mt-5 rounded-xl border border-sage-200 bg-sage-50 p-4 sm:p-5">
      <h3 className="text-lg font-bold text-stone-900">Search LA County DMH directory</h3>
      <p className="mt-1 text-sm text-stone-700">
        Search official Department of Mental Health directory listings by city or ZIP. Results are not independently verified by MindBridge and may include provider locations or programs—not necessarily walk-in clinics.
      </p>
      <form className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] sm:items-end" onSubmit={onSubmit}>
        <div>
          <label htmlFor="la-directory-search-type" className="mb-1 block text-sm font-semibold text-stone-700">
            Search by
          </label>
          <select
            id="la-directory-search-type"
            className={controlClass}
            value={searchType}
            onChange={(event) => changeSearchType(event.target.value as SearchType)}
            disabled={isLoading}
          >
            <option value="zip">ZIP code</option>
            <option value="city">City</option>
          </select>
        </div>
        <div>
          <label htmlFor="la-directory-search-value" className="mb-1 block text-sm font-semibold text-stone-700">
            {searchType === "zip" ? "5-digit ZIP code" : "City name"}
          </label>
          <input
            id="la-directory-search-value"
            className={controlClass}
            type="text"
            inputMode={searchType === "zip" ? "numeric" : "text"}
            autoComplete="off"
            maxLength={searchType === "zip" ? 5 : 60}
            placeholder={searchType === "zip" ? "e.g. 90012" : "e.g. Pasadena"}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={isLoading}
          />
        </div>
        <button className={btnSecondary} type="submit" disabled={isLoading}>
          {isLoading ? "Searching…" : "Search"}
        </button>
      </form>

      <p className="mt-3 text-xs leading-relaxed text-stone-600">
        No GPS is used. Your manually entered city or ZIP is sent in a request body through Cloudflare to LA County; it is not put in the page URL or intentionally saved by MindBridge. Cloudflare processes the request, and LA County may log access information such as IP or browser details. See the{" "}
        <a className={`rounded font-semibold text-teal-800 underline ${focusRing}`} href={countyDirectoryUrl} target="_blank" rel="noopener noreferrer">official directory</a>.
      </p>

      {status && <p className="mt-4 text-sm text-stone-700" role="status" aria-live="polite">{status}</p>}
      {error && <p className="mt-4 text-sm font-semibold text-red-800" role="alert">{error}</p>}
      {submittedValue && !isLoading && !error && (
        <div className="mt-5" aria-live="polite">
          <h4 className="font-semibold text-stone-900">
            {results.length} directory listing{results.length === 1 ? "" : "s"} for {submittedType === "zip" ? "ZIP" : "city"} {submittedValue}
          </h4>
          {results.length > 0 ? (
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {results.map((result, index) => <ResultCard key={result.id || `${result.name}-${index}`} result={result} />)}
            </div>
          ) : (
            <p className="mt-2 text-sm text-stone-700">
              No active listings were returned for that area. Try another nearby city or ZIP, or search the full county directory.
            </p>
          )}
          {hasMore && (
            <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-stone-700">
              The County API indicates there are additional matches beyond this result page. For the complete list and County filters, use the official interactive provider directory below.
            </p>
          )}
          <p className="mt-4 text-xs leading-relaxed text-stone-600">
            Confirm directly with the provider whether it offers the service you need, accepts new clients, and has current in-person availability, eligibility, hours, and appointment requirements. If you need the County&apos;s full filters, use its{" "}
            <a className={`rounded font-semibold text-teal-800 underline ${focusRing}`} href={countyDirectoryUrl} target="_blank" rel="noopener noreferrer">interactive provider directory</a>.
          </p>
        </div>
      )}
    </div>
  )
}
