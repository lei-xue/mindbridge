import { useEffect, useRef, useState, type FormEvent } from "react"
import { LaCountyDirectoryResults, type LaSearchState, type SearchType } from "./LaCountyDirectorySearch"
import { searchLaCounty } from "../lib/laCountySearch"
import facilitiesJson from "../data/california-facilities.json"
import countyAccess from "../data/california-county-access.json"
import countySites from "../data/california-county-sites.json"
import orangeSnapshot from "../data/orange-provider-sites.json"
import sanDiegoSnapshot from "../data/san-diego-adult-clinics.json"
import butteSnapshot from "../data/butte-adult-clinics.json"
import { btnCall, btnSecondary, focusRing } from "../lib/ui"
import { AddressLink } from "./AddressLink"

const sanDiegoDirectoryUrl = "https://www.optumsandiego.com/content/SanDiego/sandiego/en/community-resources/providerdirectory1.html"

type Facility = (typeof facilitiesJson)[number]
type SearchField = "zip" | "city" | "county"

function ListedPhone({ phone }: { phone: string }) {
  // Do not turn mixed numbers or extensions into a misleading one-number link.
  const dialable = /^\(?\d{3}\)?[ .-]*\d{3}[ .-]*\d{4}$/.test(phone)
  return dialable ? <a href={`tel:+1${phone.replace(/\D/g, "")}`} className={`rounded font-semibold text-teal-800 underline ${focusRing}`}>{phone}</a> : <>{phone}</>
}

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
        {facility.address ? <AddressLink address={[facility.address, `${facility.city}, CA ${facility.zip}`, `${facility.county} County`].join(" · ")} /> : `${facility.city}, CA ${facility.zip} · ${facility.county} County`}
      </p>
      {facility.phone && <p className="mt-2 text-sm text-stone-700">Listed phone: <ListedPhone phone={facility.phone} /></p>}
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
      <p className="mt-2 text-sm text-stone-700"><AddressLink address={`${site.address} · ${site.city}, CA ${site.zip}`} /></p>
      {site.phone && <p className="mt-2 text-sm text-stone-700">Listed phone: <ListedPhone phone={site.phone} /></p>}
    </article>
  )
}

function SanDiegoClinicCard({ clinic }: { clinic: (typeof sanDiegoSnapshot.clinics)[number] }) {
  return <article className="rounded-xl border border-sage-200 bg-white p-5 shadow-sm">
    <h5 className="font-bold text-stone-900">{clinic.name}</h5>
    <p className="mt-2 text-sm text-stone-700"><AddressLink address={`${clinic.address} · ${clinic.city}, CA ${clinic.zip}`} /></p>
    <p className="mt-2 text-sm text-stone-700">Listed phone: <ListedPhone phone={clinic.phone} /></p>
  </article>
}

function CountyPlanCard({ county, compact = false }: { county: string; compact?: boolean }) {
  const plan = countyAccess.countyPlans.find((entry) => entry.name === county)
  if (!plan) return null
  const website = countySites.websites.find((entry) => entry.name === county)?.url
  const dial = plan.phone.match(/\(?\d{3}\)?[ .-]*\d{3}[ .-]*\d{4}/)?.[0].replace(/\D/g, "")
  return <section aria-label="County mental health plan" className={`mt-4 rounded-lg border border-teal-300 bg-white ${compact ? "p-3" : "p-4"}`}>
    <h5 className="font-semibold text-stone-900">{compact ? `${county} County access line` : `${county} County Mental Health Plan`}</h5>
    {!compact && <p className="mt-1 text-sm text-stone-700">Official Medi-Cal specialty mental-health contact. Ask about current providers and eligibility; this is not a clinic or a promise of free care.</p>}
    <p className="mt-2 text-sm text-stone-700">{compact ? "Medi-Cal specialty mental-health plan (not another local clinic): " : "Listed access phone: "}{plan.phone} {dial && <a href={`tel:${dial}`} className={`ml-2 rounded font-semibold text-teal-800 underline ${focusRing}`}>Call county plan</a>}</p>
    {website && <p className="mt-2 text-sm text-stone-700"><a href={website} target="_blank" rel="noopener noreferrer" className={`rounded font-semibold text-teal-800 underline ${focusRing}`}>Visit {county} County plan website</a> <span className="text-xs">(linked by DHCS; not necessarily a provider directory)</span></p>}
    {county === "Los Angeles" && <p className="mt-2 text-sm text-stone-700">Browse the <a href="https://dmh.lacounty.gov/pd/" target="_blank" rel="noopener noreferrer" className={`rounded font-semibold text-teal-800 underline ${focusRing}`}>official LA County provider directory</a> without entering a ZIP here.</p>}
    <a href={countyAccess.source} target="_blank" rel="noopener noreferrer" className={`mt-2 inline-block rounded text-sm font-semibold text-teal-800 underline ${focusRing}`}>DHCS county mental health plans</a>
  </section>
}

export function CaliforniaFacilitySearch() {
  const [field, setField] = useState<SearchField>("county")
  const [value, setValue] = useState("")
  const [searched, setSearched] = useState<{ field: SearchField; value: string } | null>(null)
  const [error, setError] = useState("")
  const [manualCounty, setManualCounty] = useState("")
  const [browseCity, setBrowseCity] = useState("")
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState("")
  const [preciseRetry, setPreciseRetry] = useState(false)
  const locationRequest = useRef(0)
  const [laSearch, setLaSearch] = useState<LaSearchState | null>(null)
  const laAbort = useRef<AbortController | null>(null)
  useEffect(() => () => { locationRequest.current++; laAbort.current?.abort() }, [])
  const cancelLocation = () => {
    locationRequest.current++
    setLocating(false)
    setLocationMessage("")
    setPreciseRetry(false)
  }
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Location is unavailable. Choose your county manually.")
      return
    }
    const request = ++locationRequest.current
    setLocating(true)
    setLocationMessage("")
    navigator.geolocation.getCurrentPosition(async (position) => {
      if (request !== locationRequest.current) return
      let county: string | null
      try {
        const { suggestCounty } = await import("../lib/countyLocation")
        if (request !== locationRequest.current) return
        county = suggestCounty(position.coords.latitude, position.coords.longitude, position.coords.accuracy)
      } catch {
        if (request !== locationRequest.current) return
        setLocating(false)
        setLocationMessage("County boundary data could not load. Try again, or choose your county manually.")
        return
      }
      setLocating(false)
      setPreciseRetry(false)
      if (!county) {
        setLocationMessage("We could not safely suggest a California county. Choose it manually.")
        return
      }
      laAbort.current?.abort()
      setLaSearch(null)
      setManualCounty("")
      setBrowseCity("*")
      setSearched({ field: "county", value: county })
      setError("")
      setValue(county)
      setField("county")
      // Show local county records immediately, without calling an external API.
      setLocationMessage(`Showing ${county} County options. You can choose a different county above.`)
    }, (failure) => {
      if (request !== locationRequest.current) return
      setLocating(false)
      setPreciseRetry(failure.code === 2 || failure.code === 3)
      setLocationMessage(failure.code === 1
        ? "Location permission was not granted. You can choose your county manually."
        : failure.code === 3
          ? "Location timed out. Try precise location, or choose your county manually."
          : "Your device could not determine a location. Check device Location Services, try precise location, or choose your county manually.")
    }, { enableHighAccuracy: preciseRetry, timeout: 20000, maximumAge: 60000 })
  }
  const runLaSearch = (searchType: SearchType, term: string) => {
    laAbort.current?.abort()
    const controller = new AbortController()
    laAbort.current = controller
    setLaSearch({ query: term, searchType, results: [], hasMore: false, isLoading: true, error: "" })
    void searchLaCounty(searchType, term, controller.signal).then((payload) => {
      if (!controller.signal.aborted) setLaSearch({ query: term, searchType, results: payload.results, hasMore: Boolean(payload.hasMore), isLoading: false, error: "" })
    }).catch((caught: unknown) => {
      if (!controller.signal.aborted) setLaSearch({ query: term, searchType, results: [], hasMore: false, isLoading: false, error: caught instanceof Error ? caught.message : "The directory search is temporarily unavailable." })
    })
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    cancelLocation()
    laAbort.current?.abort()
    setLaSearch(null)
    setManualCounty("")
    setBrowseCity("")
    const term = value.trim().replace(/\s+/g, " ")
    if (field === "county" ? !countyAccess.countyPlans.some((plan) => plan.name === term) : field === "zip" ? !/^\d{5}$/.test(term) : !/^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,59}$/u.test(term)) {
      setError(field === "county" ? "Choose a California county." : field === "zip" ? "Enter a 5-digit California ZIP code." : "Enter a California city name.")
      setSearched(null)
      return
    }
    setError("")
    setSearched({ field, value: term })
    const isLaZip = field === "zip" && countyAccess.zipCounties[term as keyof typeof countyAccess.zipCounties]?.length === 1 && countyAccess.zipCounties[term as keyof typeof countyAccess.zipCounties][0] === "Los Angeles"
    // A city appearing only in LA's *partial* license snapshot is not proof that
    // every visitor searching that name is in LA. Require an explicit city search.
    if (isLaZip) runLaSearch("zip", term)
  }

  const rawMatches = searched ? facilitiesJson.filter((facility) => {
    const selected = searched.field === "zip" ? facility.zip : facility[searched.field]
    const query = searched.field === "county" ? searched.value.replace(/\s+county$/i, "") : searched.value
    return selected.toLocaleLowerCase("en-US") === query.toLocaleLowerCase("en-US")
  }) : []

  const zipCandidates = searched?.field === "zip" ? countyAccess.zipCounties[searched.value as keyof typeof countyAccess.zipCounties] ?? [] : []
  const countyCandidates = searched?.field === "zip" ? zipCandidates : searched?.field === "county"
    ? countyAccess.countyPlans.filter((plan) => plan.name.toLocaleLowerCase("en-US") === searched.value.replace(/\s+county$/i, "").toLocaleLowerCase("en-US")).map((plan) => plan.name)
    : searched?.field === "city" ? [...new Set([
      ...facilitiesJson.filter((facility) => facility.city.toLocaleLowerCase("en-US") === searched.value.toLocaleLowerCase("en-US")).map((facility) => facility.county),
      ...(orangeSnapshot.sites.some((site) => site.city.toLocaleLowerCase("en-US") === searched.value.toLocaleLowerCase("en-US") && countyAccess.zipCounties[site.zip as keyof typeof countyAccess.zipCounties]?.includes("Orange")) ? ["Orange"] : []),
      ...(sanDiegoSnapshot.clinics.some((clinic) => clinic.city.toLocaleLowerCase("en-US") === searched.value.toLocaleLowerCase("en-US")) ? ["San Diego"] : []),
    ])] : []
  const selectedCounty = manualCounty || (countyCandidates.length === 1 ? countyCandidates[0] : "")
  const matches = rawMatches.filter((facility) => !manualCounty || facility.county === manualCounty)
  const matchedCounty = searched?.field === "zip" ? selectedCounty : undefined
  const countyMatches = matchedCounty && matches.length === 0
    ? facilitiesJson.filter((facility) => facility.county === matchedCounty)
    : []
  const orangeMatches = searched && (
    (searched.field === "zip" && matchedCounty === "Orange") ||
    (searched.field === "city" && selectedCounty === "Orange") ||
    (searched.field === "county" && /^orange(?: county)?$/i.test(searched.value))
  ) ? orangeSnapshot.sites.filter((site) => {
    const location = searched.field === "county" ? "Orange" : site[searched.field]
    const query = searched.field === "county" ? "Orange" : searched.value
    return location.toLocaleLowerCase("en-US") === query.toLocaleLowerCase("en-US") && (searched.field === "zip" || countyAccess.zipCounties[site.zip as keyof typeof countyAccess.zipCounties]?.includes("Orange"))
  }) : []
  const orangeCities = new Set(orangeMatches.map((site) => site.city))
  const orangeCity = searched?.field === "zip" && orangeCities.size === 1 ? orangeMatches[0].city : null
  const sanDiegoMatches = searched && (
    (searched.field === "zip" && selectedCounty === "San Diego") ||
    (searched.field === "city" && (!manualCounty || manualCounty === "San Diego")) ||
    (searched.field === "county" && /^san diego(?: county)?$/i.test(searched.value))
  ) ? sanDiegoSnapshot.clinics.filter((clinic) => {
    if (searched.field === "county") return true
    return clinic[searched.field].toLocaleLowerCase("en-US") === searched.value.toLocaleLowerCase("en-US")
  }) : []
  const hasButteClinics = searched?.field === "county" && selectedCounty === "Butte"
  const hasExactResults = matches.length > 0 || orangeMatches.length > 0 || sanDiegoMatches.length > 0 || hasButteClinics || Boolean(laSearch?.results.length)
  const noExactResults = !hasExactResults && !laSearch?.isLoading && !laSearch?.error
  // These are county-wide browsing aids, never exact-ZIP or proximity matches.
  const orangeElsewhere = searched?.field === "zip" && selectedCounty === "Orange" && orangeMatches.length === 0
    ? orangeSnapshot.sites.filter((site) => countyAccess.zipCounties[site.zip as keyof typeof countyAccess.zipCounties]?.includes("Orange")).sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name)) : []
  const sanDiegoElsewhere = searched?.field === "zip" && selectedCounty === "San Diego" && sanDiegoMatches.length === 0
    ? [...sanDiegoSnapshot.clinics].sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name)) : []

  const onCountyChange = (county: string) => {
    cancelLocation()
    laAbort.current?.abort()
    setLaSearch(null)
    setManualCounty(county)
    setBrowseCity("")
  }

  return (
    <div data-js-only className="mt-5 rounded-xl border border-sage-200 bg-sage-50 p-4 sm:p-5">
      <div role="group" aria-label="Search by" className="grid grid-cols-3 gap-1 rounded-xl bg-sage-100 p-1">
        {(["county", "city", "zip"] as const).map((mode) => <button key={mode} type="button" aria-pressed={field === mode} onClick={() => { cancelLocation(); laAbort.current?.abort(); setLaSearch(null); setManualCounty(""); setBrowseCity(""); setField(mode); setValue(""); setSearched(null); setError("") }} className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${focusRing} ${field === mode ? "bg-white text-teal-800 shadow-sm" : "text-stone-700 hover:bg-sage-50"}`}>{mode === "zip" ? "ZIP code" : mode === "county" ? "County" : "City"}</button>)}
      </div>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3">
        <div>
          {field === "county" ? <>
            <label htmlFor="california-search-value" className="mb-1 block text-sm font-semibold text-stone-700">California county</label>
            <select id="california-search-value" className={`min-h-11 w-full rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`} value={value} onChange={(event) => { cancelLocation(); setValue(event.target.value) }}>
              <option value="">Choose a county</option>
              {countyAccess.countyPlans.map((plan) => <option key={plan.name} value={plan.name}>{plan.name} County</option>)}
            </select>
          </> : <>
            <label htmlFor="california-search-value" className="mb-1 block text-sm font-semibold text-stone-700">{field === "zip" ? "California ZIP code" : "California city"}</label>
            <input id="california-search-value" type="text" inputMode={field === "zip" ? "numeric" : "text"} autoComplete="off" maxLength={field === "zip" ? 5 : 60} placeholder={field === "zip" ? "e.g. 92868" : "e.g. Santa Ana"} className={`min-h-11 w-full rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`} value={value} onChange={(event) => { cancelLocation(); setValue(event.target.value) }} />
          </>}
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <button type="submit" className={btnCall}>Find support options</button>
          <button type="button" disabled={locating} className={btnSecondary} onClick={useCurrentLocation}>{locating ? "Finding your county…" : preciseRetry ? "Try precise location" : "Use current location"}</button>
        </div>
      </form>
      {locationMessage && <p role="status" className="mt-2 text-sm text-stone-700">{locationMessage}</p>}

      <details className="mt-3 text-xs text-stone-600"><summary className="cursor-pointer font-semibold">Search coverage and privacy</summary><p className="mt-2">Local snapshots are incomplete; ZIP-to-county matches are approximate. Device coordinates stay in your browser and are not saved; its location provider has its own policies. Submitting a ZIP mapped only to LA sends the ZIP through Cloudflare to LA County DMH. Other live LA searches require a separate click. LA County may log IP/browser details. Map links open Google Maps with the public address only. Search terms are not added to the page URL. More details are in About.</p></details>
      {field === "zip" && countyAccess.zipCounties[value.trim() as keyof typeof countyAccess.zipCounties]?.length === 1 && countyAccess.zipCounties[value.trim() as keyof typeof countyAccess.zipCounties][0] === "Los Angeles" && <p className="mt-2 text-xs text-stone-700">Search sends this ZIP via Cloudflare to LA County DMH, which may log IP/browser details.</p>}
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-800">{error}</p>}
      {searched && <div className="mt-5" aria-live="polite">
        <h4 className="font-semibold text-stone-900">Results for {searched.field === "zip" ? "ZIP" : searched.field} {searched.value}</h4>
        <p className="mt-2 text-xs text-stone-600">Call before visiting to confirm services, eligibility, cost, hours, and appointments. Listings do not guarantee free care or openings.</p>
        {searched.field === "zip" && countyCandidates.length === 1 && <p className="mt-2 text-sm text-stone-700">{orangeCity ? <>Listed sites: <strong>{orangeCity} · Orange County</strong>.</> : <>Suggested county: <strong>{countyCandidates[0]}</strong>.</>} The ZIP-to-county match is approximate; confirm your location.</p>}
        {searched.field === "zip" && countyCandidates.length > 1 && <p className="mt-2 text-sm text-stone-700">This ZIP may cross county boundaries. Choose your county below; the ZIP alone cannot identify your side of the boundary.</p>}
        {searched.field === "zip" && countyCandidates.length === 0 && <p className="mt-2 text-sm text-stone-700">We cannot confirm this ZIP belongs to California from the available ZIP-to-county crosswalk (newer and PO Box ZIPs may be missing). If you know your California county, choose it below for its official contact; otherwise verify the ZIP and county first.</p>}
        {countyCandidates.length === 1 && searched.field !== "county" && <details className="mt-2 text-sm text-stone-700"><summary className="cursor-pointer font-semibold text-teal-800">Change county</summary><p className="mt-1">The suggestion may not match your address. Choosing another county changes the county contact and hides location listings from the suggested county; it does not search a new provider directory.</p>
          <div className="mt-2"><label htmlFor="choose-county" className="mb-1 block font-semibold">Choose your county</label>
          <select id="choose-county" value={selectedCounty} onChange={(event) => onCountyChange(event.target.value)} className={`min-h-11 w-full max-w-sm rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`}>
            {countyAccess.countyPlans.map((plan) => <option key={plan.name} value={plan.name}>{plan.name} County</option>)}
          </select></div></details>}
        {countyCandidates.length !== 1 && <div className="mt-3">
          <label htmlFor="choose-county" className="mb-1 block text-sm font-semibold text-stone-700">Choose your county</label>
          <select id="choose-county" value={manualCounty} onChange={(event) => onCountyChange(event.target.value)} className={`min-h-11 w-full max-w-sm rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`}>
            <option value="">Select a county</option>
            {countyAccess.countyPlans.map((plan) => plan.name).map((county) => <option key={county} value={county}>{county} County</option>)}
          </select>
        </div>}
        {selectedCounty && searched.field !== "county" && <p className="mt-2 text-xs text-stone-600">County selection provides a referral phone, not a complete list of providers in that county. Only matching records from the connected sources are shown below.</p>}
        {selectedCounty && (searched.field === "county" || !hasExactResults) && <CountyPlanCard county={selectedCounty} />}
        {selectedCounty === "Los Angeles" && searched.field !== "county" && !laSearch && <div className="mt-4 rounded-lg border border-teal-300 bg-white p-4"><p className="text-sm text-stone-700">Want to search LA County's live provider directory for this {searched.field}? Clicking below sends the entered location through Cloudflare to LA County; they may log your IP/browser details.</p><button type="button" className={`${btnSecondary} mt-2`} onClick={() => runLaSearch(searched.field as SearchType, searched.value)}>Search live LA County directory</button></div>}
        {laSearch && <LaCountyDirectoryResults state={laSearch} />}
        {orangeMatches.length > 0 && (
          <section aria-label="Orange County Behavioral Health Plan sites" className="mt-4 rounded-lg border border-teal-300 bg-white p-4">
            <h5 className="font-semibold text-stone-900">{searched.field === "county" ? `${orangeMatches.length} provider sites in Orange County` : orangeCity ? `${orangeMatches.length} provider sites listed in ${orangeCity} · Orange County` : `${orangeMatches.length} Orange County BHP provider sites for ${searched.field === "zip" ? "ZIP" : searched.field} ${searched.value}`}</h5>
            <p className="mt-1 text-xs text-stone-600">Orange County Medi-Cal BHP provider-site subset · Retrieved {orangeSnapshot.retrievedAt}.</p>
            {searched.field === "county" && <><label htmlFor="orange-county-city" className="mt-3 block text-sm font-semibold text-stone-700">Filter Orange County sites by city</label>
              <select id="orange-county-city" value={browseCity} onChange={(event) => setBrowseCity(event.target.value)} className={`mt-1 min-h-11 w-full max-w-sm rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`}>
                <option value="">Choose a city to see sites</option>
                <option value="*">Show all sites (first 20)</option>
                {[...new Set(orangeMatches.map((site) => site.city))].sort().map((city) => <option key={city} value={city}>{city}</option>)}
              </select>{browseCity && browseCity !== "*" && <p className="mt-2 text-sm text-stone-700">{orangeMatches.filter((site) => site.city === browseCity).length} sites listed in {browseCity}.</p>}</>}
            <div className="mt-3 grid gap-3 lg:grid-cols-2">{orangeMatches.filter((site) => searched.field !== "county" || (browseCity !== "" && (browseCity === "*" || site.city === browseCity))).slice(0, 20).map((site) => <OrangeSiteCard key={site.id} site={site} />)}</div>
            {orangeMatches.filter((site) => searched.field !== "county" || (browseCity !== "" && (browseCity === "*" || site.city === browseCity))).length > 20 && <p className="mt-2 text-sm text-stone-700">Showing the first 20 sites. Choose a city or use the full official directory for the rest.</p>}
          </section>
        )}
        {sanDiegoMatches.length > 0 && <section aria-label="San Diego adult behavioral health clinics" className="mt-4 rounded-lg border border-teal-300 bg-white p-4">
          <h5 className="font-semibold text-stone-900">{searched.field === "county" ? `${sanDiegoMatches.length} adult clinic locations in San Diego County` : `${sanDiegoMatches.length} adult clinic listings for ${searched.field === "zip" ? "ZIP" : searched.field} ${searched.value} · San Diego County`}</h5>
          <p className="mt-1 text-xs text-stone-600">Adults 18+ · County outpatient-clinic subset · Snapshot {sanDiegoSnapshot.retrievedAt}, not a complete directory.</p>
          {searched.field === "county" && <><label htmlFor="san-diego-county-city" className="mt-3 block text-sm font-semibold text-stone-700">Filter San Diego adult clinics by city</label>
            <select id="san-diego-county-city" value={browseCity} onChange={(event) => setBrowseCity(event.target.value)} className={`mt-1 min-h-11 w-full max-w-sm rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`}>
              <option value="">Choose a city to see clinics</option>
              <option value="*">Show all 20 clinics</option>
              {[...new Set(sanDiegoMatches.map((clinic) => clinic.city))].sort().map((city) => <option key={city} value={city}>{city}</option>)}
            </select>{browseCity && browseCity !== "*" && <p className="mt-2 text-sm text-stone-700">{sanDiegoMatches.filter((clinic) => clinic.city === browseCity).length} clinics listed in {browseCity}.</p>}</>}
          <div className="mt-3 grid gap-3 lg:grid-cols-2">{sanDiegoMatches.filter((clinic) => searched.field !== "county" || (browseCity !== "" && (browseCity === "*" || clinic.city === browseCity))).map((clinic) => <SanDiegoClinicCard key={clinic.id} clinic={clinic} />)}</div>
        </section>}
        {hasButteClinics && <section aria-label="Butte adult outpatient centers" className="mt-4 rounded-lg border border-teal-300 bg-white p-4">
          <h5 className="font-semibold text-stone-900">{butteSnapshot.clinics.length} adult outpatient centers in Butte County</h5>
          <p className="mt-1 text-xs text-stone-600">Adults 18+ · County outpatient-center subset · Snapshot {butteSnapshot.retrievedAt}, not the full directory.</p>
          <label htmlFor="butte-clinic-city" className="mt-3 block text-sm font-semibold text-stone-700">Filter Butte adult centers by city</label>
          <select id="butte-clinic-city" value={browseCity} onChange={(event) => setBrowseCity(event.target.value)} className={`mt-1 min-h-11 w-full max-w-sm rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`}>
            <option value="">All cities</option><option value="*">Show all centers</option>
            {[...new Set(butteSnapshot.clinics.map((clinic) => clinic.city))].sort().map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">{butteSnapshot.clinics.filter((clinic) => !browseCity || browseCity === "*" || clinic.city === browseCity).map((clinic) => <article key={clinic.id} className="rounded-xl border border-sage-200 bg-white p-5 shadow-sm">
            <h5 className="font-bold text-stone-900">{clinic.name}</h5>
            <p className="mt-2 text-sm text-stone-700"><AddressLink address={`${clinic.address} · ${clinic.city}, CA ${clinic.zip}`} /></p>
            <p className="mt-2 text-sm text-stone-700">Listed phone: <ListedPhone phone={clinic.phone} /></p>
            <a href={clinic.source} target="_blank" rel="noopener noreferrer" className={`mt-2 inline-block rounded text-sm text-teal-800 underline ${focusRing}`}>Official center information</a>
          </article>)}</div>
          <a href={butteSnapshot.directoryUrl} target="_blank" rel="noopener noreferrer" className={`mt-3 inline-block rounded text-sm font-semibold text-teal-800 underline ${focusRing}`}>Full Butte County provider directory</a>
        </section>}
        {matches.length > 0 && (searched.field === "county" ? <details aria-label="Statewide licensed-facility snapshot" className="mt-4 rounded-lg border border-sage-300 bg-white p-4">
          <summary className="cursor-pointer font-semibold text-stone-900">{matches.length} statewide licensed-facility {matches.length === 1 ? "listing" : "listings"} for county {searched.value} (not an outpatient directory)</summary>
          <p className="mt-2 text-xs text-stone-600">Dated licensing snapshot, including hospitals and rehabilitation centers. A license does not establish current availability, walk-in access, or free care.</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">{matches.map((facility) => <FacilityCard key={facility.id} facility={facility} />)}</div>
        </details> : <section aria-label="Statewide licensed-facility snapshot" className="mt-4 rounded-lg border border-sage-300 bg-white p-4">
          <h5 className="font-semibold text-stone-900">{matches.length} statewide licensed-facility listings for {searched.field} {searched.value}</h5>
          <p className="mt-1 text-xs text-stone-600">Licensed-facility matches · Limited, dated licensing snapshot (including hospitals and rehabilitation centers), not a general outpatient directory. A license does not establish availability or walk-in access.</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">{matches.map((facility) => <FacilityCard key={facility.id} facility={facility} />)}</div>
        </section>)}
        {selectedCounty && hasExactResults && searched.field !== "county" && <CountyPlanCard county={selectedCounty} compact />}
        {noExactResults && <p role="status" className="mt-4 text-sm text-stone-700">{searched.field === "county" ? "No listings in our connected snapshots yet. That does not mean no care is available. Your county plan or local 211 can help you ask about current options." : <>No exact {searched.field === "zip" ? "ZIP" : "city"} listings were found in the connected sources{selectedCounty === "Los Angeles" && !laSearch ? " (LA live directory not yet searched)" : ""}. This does not mean there is no care nearby; ask your county plan for current providers or use local 211.</>}</p>}
        {orangeElsewhere.length > 0 && <details aria-label="Other Orange County provider sites" className="mt-4 rounded-lg border border-sage-300 bg-white p-4">
          <summary className="cursor-pointer font-semibold text-stone-900">{orangeElsewhere.length} provider sites elsewhere in Orange County (not exact-ZIP matches)</summary>
          <p className="mt-2 text-sm text-stone-700">These official Orange County BHP snapshot sites are not necessarily near this ZIP, available, or appropriate for your needs. Choose a city you recognize to browse its sites; this is not a distance search. Ask the county plan or use its full directory for current options.</p>
          <label htmlFor="orange-elsewhere-city" className="mt-3 block text-sm font-semibold text-stone-700">Show Orange County sites in city</label>
          <select id="orange-elsewhere-city" value={browseCity} onChange={(event) => setBrowseCity(event.target.value)} className={`mt-1 min-h-11 w-full max-w-sm rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`}>
            <option value="">All cities (first 10 by city, not distance)</option>
            {[...new Set(orangeElsewhere.map((site) => site.city))].sort().map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">{orangeElsewhere.filter((site) => !browseCity || site.city === browseCity).slice(0, 10).map((site) => <OrangeSiteCard key={site.id} site={site} />)}</div>
          {orangeElsewhere.filter((site) => !browseCity || site.city === browseCity).length > 10 && <p className="mt-2 text-sm text-stone-700">Showing the first 10 alphabetically by city and name. Use the full official directory for the rest.</p>}
        </details>}
        {sanDiegoElsewhere.length > 0 && <details aria-label="Other San Diego County adult clinics" className="mt-4 rounded-lg border border-sage-300 bg-white p-4">
          <summary className="cursor-pointer font-semibold text-stone-900">{sanDiegoElsewhere.length} adult clinics elsewhere in San Diego County (not exact-ZIP matches)</summary>
          <p className="mt-2 text-sm text-stone-700">These county-published outpatient clinics serve adults 18 and older. They are not necessarily near this ZIP or currently available. Choose a city you recognize; this is not a distance search. Confirm eligibility, cost, and appointments before visiting.</p>
          <label htmlFor="san-diego-elsewhere-city" className="mt-3 block text-sm font-semibold text-stone-700">Show San Diego adult clinics in city</label>
          <select id="san-diego-elsewhere-city" value={browseCity} onChange={(event) => setBrowseCity(event.target.value)} className={`mt-1 min-h-11 w-full max-w-sm rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`}>
            <option value="">All cities (first 10 by city, not distance)</option>
            {[...new Set(sanDiegoElsewhere.map((clinic) => clinic.city))].sort().map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">{sanDiegoElsewhere.filter((clinic) => !browseCity || clinic.city === browseCity).slice(0, 10).map((clinic) => <SanDiegoClinicCard key={clinic.id} clinic={clinic} />)}</div>
          {sanDiegoElsewhere.filter((clinic) => !browseCity || clinic.city === browseCity).length > 10 && <p className="mt-2 text-sm text-stone-700">Showing the first 10 alphabetically by city and name. Use the full official directory for the rest.</p>}
        </details>}
        {matchedCounty && countyMatches.length > 0 && !hasExactResults && !laSearch?.isLoading && (
          <details className="mt-4 rounded-lg border border-sage-300 bg-white p-4">
            <summary className="cursor-pointer font-semibold text-stone-900">Other licensed facilities elsewhere in {matchedCounty} County ({countyMatches.length}; not local matches)</summary>
            <p className="mt-2 text-sm text-stone-700">This ZIP has a suggested {matchedCounty} County match from an approximate ZIP-to-county crosswalk. These facilities may be far from your ZIP and may not offer the service you need, have openings, or accept walk-ins.</p>
            {countyMatches.length > 0 && <div className="mt-3 grid gap-3 lg:grid-cols-2">{countyMatches.map((facility) => <FacilityCard key={facility.id} facility={facility} />)}</div>}
          </details>
        )}
        {(matchedCounty === "Orange" || orangeMatches.length > 0) && <p className="mt-4 text-sm text-stone-700">For the full, more frequently updated list, use the official <a href="https://bhpproviderdirectory.ochca.com/" target="_blank" rel="noopener noreferrer" className={`rounded font-semibold text-teal-800 underline ${focusRing}`}>Orange County Behavioral Health Plan provider directory</a>.</p>}
        {(selectedCounty === "San Diego" || sanDiegoMatches.length > 0) && <p className="mt-4 text-sm text-stone-700">For other programs and current details, use the <a href={sanDiegoDirectoryUrl} target="_blank" rel="noopener noreferrer" className={`rounded font-semibold text-teal-800 underline ${focusRing}`}>Full San Diego County behavioral health provider directory</a> linked from the County BHS website.</p>}
      </div>}
    </div>
  )
}
