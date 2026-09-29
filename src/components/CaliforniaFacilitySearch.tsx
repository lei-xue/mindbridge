import { useEffect, useRef, useState, type FormEvent } from "react"
import { LaCountyDirectoryResults, type LaSearchState } from "./LaCountyDirectorySearch"
import { searchLaCounty } from "../lib/laCountySearch"
import facilitiesJson from "../data/california-facilities.json"
import orangeSnapshot from "../data/orange-provider-sites.json"
import zipCounties from "../data/california-zip-counties.json"
import { btnSecondary, focusRing } from "../lib/ui"

type Facility = (typeof facilitiesJson)[number]
type SearchField = "zip" | "city" | "county"
const sources: Record<Facility["source"], { name: string; url: string; date: string }> = {
  CDPH: {
    name: "California CDPH licensed healthcare facility listing",
    url: "https://data.chhs.ca.gov/dataset/licensed-healthcare-facility-listing",
    date: "Sep 1, 2026",
  },
  DHCS: {
    name: "California DHCS licensed MHRC and PHF listing",
    url: "https://data.chhs.ca.gov/dataset/licensed-mental-health-rehabilitation-centers-mhrc-and-psychiatric-health-facilities-phf",
    date: "Sep 11, 2026",
  },
}

function FacilityCard({ facility }: { facility: Facility }) {
  const source = sources[facility.source]
  return (
    <article className="rounded-xl border border-sage-200 bg-white p-5 shadow-sm">
      <h4 className="font-bold text-stone-900">{facility.name}</h4>
      <p className="mt-1 text-sm font-semibold text-stone-700">{facility.category}</p>
      <p className="mt-2 text-sm text-stone-700">
        {[facility.address, `${facility.city}, CA ${facility.zip}`, `${facility.county} County`].filter(Boolean).join(" · ")}
      </p>
      {facility.phone && <p className="mt-2 text-sm text-stone-700">Listed phone: {facility.phone}</p>}
      <p className="mt-3 text-xs text-stone-600">
        Source: <a href={source.url} target="_blank" rel="noopener noreferrer" className={`rounded underline ${focusRing}`}>{source.name}</a> (snapshot {source.date}).
      </p>
    </article>
  )
}

function OrangeSiteCard({ site }: { site: (typeof orangeSnapshot.sites)[number] }) {
  return (
    <article className="rounded-xl border border-sage-200 bg-white p-5 shadow-sm">
      <h5 className="font-bold text-stone-900">{site.name}</h5>
      <p className="mt-1 text-sm text-stone-700">{site.category}</p>
      <p className="mt-2 text-sm text-stone-700">{site.address} · {site.city}, CA {site.zip}</p>
      {site.phone && <p className="mt-2 text-sm text-stone-700">Listed phone: {site.phone}</p>}
    </article>
  )
}

export function CaliforniaFacilitySearch() {
  const [field, setField] = useState<SearchField>("zip")
  const [value, setValue] = useState("")
  const [searched, setSearched] = useState<{ field: SearchField; value: string } | null>(null)
  const [error, setError] = useState("")
  const [laSearch, setLaSearch] = useState<LaSearchState | null>(null)
  const laAbort = useRef<AbortController | null>(null)
  useEffect(() => () => laAbort.current?.abort(), [])

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    laAbort.current?.abort()
    setLaSearch(null)
    const term = value.trim().replace(/\s+/g, " ")
    if (field === "zip" ? !/^\d{5}$/.test(term) : !/^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,59}$/u.test(term)) {
      setError(field === "zip" ? "Enter a 5-digit California ZIP code." : "Enter a California city or county name.")
      setSearched(null)
      return
    }
    setError("")
    setSearched({ field, value: term })
    const isLaZip = field === "zip" && zipCounties[term as keyof typeof zipCounties] === "Los Angeles"
    const cityCounties = field === "city" ? new Set(facilitiesJson.filter((facility) => facility.city.toLocaleLowerCase("en-US") === term.toLocaleLowerCase("en-US")).map((facility) => facility.county)) : new Set<string>()
    const isLaCity = field === "city" && cityCounties.size === 1 && cityCounties.has("Los Angeles")
    if (isLaZip || isLaCity) {
      const searchType = field === "zip" ? "zip" : "city"
      const controller = new AbortController()
      laAbort.current = controller
      setLaSearch({ query: term, searchType, results: [], hasMore: false, isLoading: true, error: "" })
      void searchLaCounty(searchType, term, controller.signal).then((payload) => {
        if (!controller.signal.aborted) setLaSearch({ query: term, searchType, results: payload.results, hasMore: Boolean(payload.hasMore), isLoading: false, error: "" })
      }).catch((caught: unknown) => {
        if (!controller.signal.aborted) setLaSearch({ query: term, searchType, results: [], hasMore: false, isLoading: false, error: caught instanceof Error ? caught.message : "The directory search is temporarily unavailable." })
      })
    }
  }

  const matches = searched ? facilitiesJson.filter((facility) => {
    const selected = searched.field === "zip" ? facility.zip : facility[searched.field]
    const query = searched.field === "county" ? searched.value.replace(/\s+county$/i, "") : searched.value
    return selected.toLocaleLowerCase("en-US") === query.toLocaleLowerCase("en-US")
  }) : []

  const matchedCounty = searched?.field === "zip" ? zipCounties[searched.value as keyof typeof zipCounties] : undefined
  const countyMatches = matchedCounty && matches.length === 0
    ? facilitiesJson.filter((facility) => facility.county === matchedCounty)
    : []
  const orangeMatches = searched && (
    (searched.field === "zip" && matchedCounty === "Orange") ||
    searched.field === "city" ||
    (searched.field === "county" && /^orange(?: county)?$/i.test(searched.value))
  ) ? orangeSnapshot.sites.filter((site) => {
    const location = searched.field === "county" ? "Orange" : site[searched.field]
    const query = searched.field === "county" ? "Orange" : searched.value
    return location.toLocaleLowerCase("en-US") === query.toLocaleLowerCase("en-US")
  }) : []
  const hasExactResults = matches.length > 0 || orangeMatches.length > 0 || Boolean(laSearch?.results.length)
  const noExactResults = !hasExactResults && !laSearch?.isLoading && !laSearch?.error

  return (
    <div className="mt-5 rounded-xl border border-sage-200 bg-sage-50 p-4 sm:p-5">
      <h3 className="text-lg font-bold text-stone-900">Search California mental-health locations</h3>
      <p className="mt-1 text-sm text-stone-700">
        One search shows the limited statewide license snapshot and Orange County provider sites; for recognized LA County ZIPs or cities, it also searches the live LA County DMH directory. These sources are not a complete directory of care, free services, or walk-in options.
      </p>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] sm:items-end">
        <div>
          <label htmlFor="california-search-field" className="mb-1 block text-sm font-semibold text-stone-700">Search California facilities by</label>
          <select id="california-search-field" className={`min-h-11 w-full rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`} value={field} onChange={(event) => { laAbort.current?.abort(); setLaSearch(null); setField(event.target.value as SearchField); setValue(""); setSearched(null); setError("") }}>
            <option value="zip">ZIP code</option><option value="city">City</option><option value="county">County</option>
          </select>
        </div>
        <div>
          <label htmlFor="california-search-value" className="mb-1 block text-sm font-semibold text-stone-700">California city, county, or ZIP</label>
          <input id="california-search-value" type="text" inputMode={field === "zip" ? "numeric" : "text"} autoComplete="off" maxLength={field === "zip" ? 5 : 60} placeholder={field === "zip" ? "e.g. 92868" : field === "county" ? "e.g. Orange" : "e.g. Santa Ana"} className={`min-h-11 w-full rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`} value={value} onChange={(event) => setValue(event.target.value)} />
        </div>
        <button type="submit" className={btnSecondary}>Find California facilities</button>
      </form>
      <p className="mt-3 text-xs text-stone-600">Local California and Orange County snapshots are filtered in your browser. If your ZIP or city is recognized as LA County, submitting also sends that query in a request body through Cloudflare to the LA County DMH directory; Cloudflare processes it and LA County may log IP/browser details. No GPS is used, and MindBridge does not put the location in the URL or intentionally store it. ZIP/city recognition is incomplete; if no live results appear, use the official county directory.</p>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-800">{error}</p>}
      {searched && <div className="mt-5" aria-live="polite">
        <h4 className="font-semibold text-stone-900">Results for {searched.field === "zip" ? "ZIP" : searched.field} {searched.value}</h4>
        {laSearch && <LaCountyDirectoryResults state={laSearch} />}
        {orangeMatches.length > 0 && (
          <section aria-label="Orange County Behavioral Health Plan sites" className="mt-4 rounded-lg border border-teal-300 bg-white p-4">
            <h5 className="font-semibold text-stone-900">{orangeMatches.length} Orange County BHP provider sites for {searched.field === "zip" ? "ZIP" : searched.field} {searched.value}</h5>
            <p className="mt-1 text-xs text-stone-600">Official Orange County Medi-Cal Behavioral Health Plan site data, retrieved {orangeSnapshot.retrievedAt}; this snapshot is not live availability, an appointment guarantee, or a list of free services. Confirm eligibility and hours directly.</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">{orangeMatches.slice(0, 20).map((site) => <OrangeSiteCard key={site.id} site={site} />)}</div>
            {orangeMatches.length > 20 && <p className="mt-2 text-sm text-stone-700">Showing the first 20 sites. Use the full official directory for the rest.</p>}
          </section>
        )}
        {matches.length > 0 && <section aria-label="Statewide licensed-facility snapshot" className="mt-4 rounded-lg border border-sage-300 bg-white p-4">
          <h5 className="font-semibold text-stone-900">{matches.length} statewide licensed-facility listings for {searched.field} {searched.value}</h5>
          <p className="mt-1 text-xs text-stone-600">Limited licensing snapshot; a listed license does not establish availability or walk-in access.</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">{matches.map((facility) => <FacilityCard key={facility.id} facility={facility} />)}</div>
        </section>}
        {noExactResults && <p role="status" className="mt-4 text-sm text-stone-700">No exact {searched.field === "zip" ? "ZIP" : searched.field} listings were found in the connected sources. This does not mean there is no care nearby; try the official county directory or local 211.</p>}
        {matchedCounty && !hasExactResults && !laSearch?.isLoading && (
          <details className="mt-4 rounded-lg border border-sage-300 bg-white p-4">
            <summary className="cursor-pointer font-semibold text-stone-900">Other licensed facilities elsewhere in {matchedCounty} County ({countyMatches.length}; not local matches)</summary>
            <p className="mt-2 text-sm text-stone-700">This ZIP maps to {matchedCounty} County in a partial state healthcare-facility snapshot. These facilities may be far from your ZIP and may not offer the service you need, have openings, or accept walk-ins.</p>
            {countyMatches.length > 0 && <div className="mt-3 grid gap-3 lg:grid-cols-2">{countyMatches.map((facility) => <FacilityCard key={facility.id} facility={facility} />)}</div>}
          </details>
        )}
        {(matchedCounty === "Orange" || orangeMatches.length > 0) && <p className="mt-4 text-sm text-stone-700">For the full, more frequently updated list, use the official <a href="https://bhpproviderdirectory.ochca.com/" target="_blank" rel="noopener noreferrer" className={`rounded font-semibold text-teal-800 underline ${focusRing}`}>Orange County Behavioral Health Plan provider directory</a>.</p>}
        <p className="mt-4 text-xs text-stone-600">Confirm service type, eligibility, cost, and appointment requirements directly with each provider. Listings are not endorsements by MindBridge.</p>
      </div>}
    </div>
  )
}
