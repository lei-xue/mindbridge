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
import { useLocale } from "../i18n/LocaleProvider"

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
  const { s } = useLocale()
  const source = sources[facility.source]
  return (
    <article className="rounded-xl border border-sage-200 bg-white p-5 shadow-sm">
      <h4 className="font-bold text-stone-900">{facility.name}</h4>

      <p className="mt-2 text-sm text-stone-700">
        {facility.address ? <AddressLink address={[facility.address, `${facility.city}, CA ${facility.zip}`, `${facility.county} County`].join(" · ")} /> : `${facility.city}, CA ${facility.zip} · ${facility.county} County`}
      </p>
      {facility.phone && <p className="mt-2 text-sm text-stone-700"><ListedPhone phone={facility.phone} /></p>}
      <details className="mt-2 text-xs text-stone-600">
        <summary className={`min-h-11 cursor-pointer content-center rounded font-semibold ${focusRing}`}>{s.ca.sourceDetails}</summary>
        <p lang="en" className="mt-1 text-sm text-stone-700">{facility.category}</p>
        <p className="mt-2">{s.ca.sourcePrefix}<a lang="en" href={source.url} target="_blank" rel="noopener noreferrer" className={`rounded underline ${focusRing}`}>{source.name}</a> {s.ca.snapshot(source.date)}.</p>
      </details>
    </article>
  )
}

function OrangeSiteCard({ site }: { site: (typeof orangeSnapshot.sites)[number] }) {
  const { s } = useLocale()
  return (
    <article className="py-5">
      <h5 className="text-base font-bold text-stone-900">{site.name}</h5>
      {site.phone && <p className="mt-1 text-base [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center"><ListedPhone phone={site.phone} /></p>}
      <p className="mt-1 text-sm text-stone-600"><AddressLink address={`${site.address} · ${site.city}, CA ${site.zip}`} /></p>
      <details className="text-xs text-stone-600">
        <summary className={`min-h-11 cursor-pointer content-center rounded ${focusRing}`}>{s.ca.providerDetails}</summary>
        <p lang="en" className="mt-1 text-sm text-stone-700">{site.category}</p>
      </details>
    </article>
  )
}

function SanDiegoClinicCard({ clinic }: { clinic: (typeof sanDiegoSnapshot.clinics)[number] }) {
  return <article className="rounded-xl border border-sage-200 bg-white p-5 shadow-sm">
    <h5 className="font-bold text-stone-900">{clinic.name}</h5>
    <p className="mt-2 text-sm text-stone-700"><AddressLink address={`${clinic.address} · ${clinic.city}, CA ${clinic.zip}`} /></p>
    <p className="mt-2 text-sm text-stone-700"><ListedPhone phone={clinic.phone} /></p>
  </article>
}

function CountyPlanCard({ county, compact = false }: { county: string; compact?: boolean }) {
  const { s } = useLocale()
  const plan = countyAccess.countyPlans.find((entry) => entry.name === county)
  if (!plan) return null
  const website = countySites.websites.find((entry) => entry.name === county)?.url
  const dial = plan.phone.match(/\(?\d{3}\)?[ .-]*\d{3}[ .-]*\d{4}/)?.[0].replace(/\D/g, "")
  const info = <>
    <p className="mt-2 text-sm text-stone-700">{s.ca.planBody}</p>
    {website && <p className="mt-2 text-sm text-stone-700"><a href={website} target="_blank" rel="noopener noreferrer" className={`rounded font-semibold text-teal-800 underline ${focusRing}`}>{s.ca.planVisit(county)}</a> <span className="text-xs">{s.ca.planVisitNote}</span></p>}
    {county === "Los Angeles" && <p className="mt-2 text-sm text-stone-700">{s.ca.planLaLead}<a href="https://dmh.lacounty.gov/pd/" target="_blank" rel="noopener noreferrer" className={`rounded font-semibold text-teal-800 underline ${focusRing}`}>{s.ca.planLaLink}</a>{s.ca.planLaTail}</p>}
    <a href={countyAccess.source} target="_blank" rel="noopener noreferrer" className={`mt-2 inline-block rounded text-sm font-semibold underline ${focusRing}`}>{s.ca.planSource}</a>
  </>
  const content = <section aria-label={s.ca.planAria} className="mt-4 space-y-2 bg-white py-4">
    <h5 className="font-semibold text-stone-900">{compact ? s.ca.planAccessLine(county) : s.ca.planName(county)}</h5>
    <p className="text-xs text-stone-600">{s.ca.planBrief}</p>
    <p>{dial ? <a href={`tel:${dial}`} aria-label={s.ca.planCallAria} className={btnCall}>{plan.phone}</a> : plan.phone}</p>
    {compact ? info : <details className="text-sm text-stone-600"><summary className={`min-h-11 cursor-pointer content-center rounded ${focusRing}`}>{s.ca.sourceDetails}</summary>{info}</details>}
  </section>
  return compact ? <details key={county} className="mt-3 text-sm text-stone-700">
    <summary className={`min-h-11 cursor-pointer content-center rounded font-semibold ${focusRing}`}>{s.ca.referral(county)}</summary>
    {content}
  </details> : content
}

export function CaliforniaFacilitySearch() {
  const { s } = useLocale()
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
      setLocationMessage(s.ca.locationUnavailable)
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
        setLocationMessage(s.ca.boundaryLoadFailed)
        return
      }
      setLocating(false)
      setPreciseRetry(false)
      if (!county) {
        setLocationMessage(s.ca.noCountySuggested)
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
      setLocationMessage(s.ca.showingCounty(county))
    }, (failure) => {
      if (request !== locationRequest.current) return
      setLocating(false)
      setPreciseRetry(failure.code === 2 || failure.code === 3)
      setLocationMessage(failure.code === 1
        ? s.ca.locationDenied
        : failure.code === 3
          ? s.ca.locationTimeout
          : s.ca.locationFailed)
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
      setError(field === "county" ? s.ca.errorCounty : field === "zip" ? s.ca.errorZip : s.ca.errorCity)
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


  const onCountyChange = (county: string) => {
    cancelLocation()
    laAbort.current?.abort()
    setLaSearch(null)
    setManualCounty(county)
    setBrowseCity("")
  }

  return (
    <div data-js-only className="mt-5 space-y-3">
      <div role="group" aria-label={s.ca.modesAria} className="grid grid-cols-3 gap-1 rounded-xl bg-sage-100 p-1">
        {(["county", "city", "zip"] as const).map((mode) => <button key={mode} type="button" aria-pressed={field === mode} onClick={() => { cancelLocation(); laAbort.current?.abort(); setLaSearch(null); setManualCounty(""); setBrowseCity(""); setField(mode); setValue(""); setSearched(null); setError("") }} className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${focusRing} ${field === mode ? "bg-white text-teal-800 shadow-sm" : "text-stone-700 hover:bg-sage-50"}`}>{mode === "zip" ? s.ca.modeZip : mode === "county" ? s.ca.modeCounty : s.ca.modeCity}</button>)}
      </div>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3">
        <div>
          {field === "county" ? <>
            <label htmlFor="california-search-value" className="mb-1 block text-sm font-semibold text-stone-700">{s.ca.countyLabel}</label>
            <select id="california-search-value" className={`min-h-11 w-full rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`} value={value} onChange={(event) => { cancelLocation(); setValue(event.target.value) }}>
              <option value="">{s.ca.chooseCountyOption}</option>
              {countyAccess.countyPlans.map((plan) => <option key={plan.name} value={plan.name}>{s.ca.countyOption(plan.name)}</option>)}
            </select>
          </> : <>
            <label htmlFor="california-search-value" className="mb-1 block text-sm font-semibold text-stone-700">{field === "zip" ? s.ca.zipLabel : s.ca.cityLabel}</label>
            <input id="california-search-value" type="text" inputMode={field === "zip" ? "numeric" : "text"} autoComplete="off" maxLength={field === "zip" ? 5 : 60} placeholder={field === "zip" ? s.ca.zipPlaceholder : s.ca.cityPlaceholder} className={`min-h-11 w-full rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`} value={value} onChange={(event) => { cancelLocation(); setValue(event.target.value) }} />
          </>}
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <button type="submit" className={btnCall}>{s.ca.submit}</button>
          <button type="button" disabled={locating} className={`min-h-11 rounded px-3 text-sm text-teal-800 underline ${focusRing}`} onClick={useCurrentLocation}>{locating ? s.ca.locating : preciseRetry ? s.ca.precise : s.ca.useLocation}</button>
        </div>
      </form>
      {locationMessage && <p role="status" className="mt-2 text-sm text-stone-700">{locationMessage}</p>}

      <details className="mt-3 text-xs text-stone-600"><summary className="cursor-pointer font-semibold">{s.ca.coverage}</summary><p className="mt-2">{s.ca.coverageBody}</p></details>
      {field === "zip" && countyAccess.zipCounties[value.trim() as keyof typeof countyAccess.zipCounties]?.length === 1 && countyAccess.zipCounties[value.trim() as keyof typeof countyAccess.zipCounties][0] === "Los Angeles" && <p className="mt-2 text-xs text-stone-700">{s.ca.laZipNotice}</p>}
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-800">{error}</p>}
      {searched && <div className="mt-5" aria-live="polite">
        {searched.field !== "county" && <h4 className="font-semibold text-stone-900">{s.ca.resultHeading(searched.field, searched.value)}</h4>}
        {hasExactResults && <p className="mt-2 text-xs text-stone-600">{s.ca.confirmCall}</p>}
        {searched.field === "zip" && countyCandidates.length > 1 && <p className="mt-2 text-sm text-stone-700">{s.ca.zipCrosses}</p>}

        {countyCandidates.length === 1 && searched.field !== "county" && <details className="mt-2 text-sm text-stone-700"><summary className="cursor-pointer font-semibold text-teal-800">{s.ca.changeCounty}</summary><p className="mt-1">{s.ca.changeCountyBody}</p>
          <div className="mt-2"><label htmlFor="choose-county" className="mb-1 block font-semibold">{s.ca.chooseYourCounty}</label>
          <select id="choose-county" value={selectedCounty} onChange={(event) => onCountyChange(event.target.value)} className={`min-h-11 w-full max-w-sm rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`}>
            {countyAccess.countyPlans.map((plan) => <option key={plan.name} value={plan.name}>{s.ca.countyOption(plan.name)}</option>)}
          </select></div></details>}
        {countyCandidates.length > 1 && <div className="mt-3">
          <label htmlFor="choose-county" className="mb-1 block text-sm font-semibold text-stone-700">{s.ca.chooseYourCounty}</label>
          <select id="choose-county" value={manualCounty} onChange={(event) => onCountyChange(event.target.value)} className={`min-h-11 w-full max-w-sm rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`}>
            <option value="">{s.ca.selectCountyOption}</option>
            {countyCandidates.map((county) => <option key={county} value={county}>{s.ca.countyOption(county)}</option>)}
          </select>
        </div>}

        {selectedCounty && (searched.field === "county" || !hasExactResults) && <CountyPlanCard county={selectedCounty} />}
        {selectedCounty === "Los Angeles" && searched.field !== "county" && !laSearch && <div className="mt-4 rounded-lg border border-teal-300 bg-white p-4"><p className="text-sm text-stone-700">{s.ca.livePrompt(searched.field)}</p><button type="button" className={`${btnSecondary} mt-2`} onClick={() => runLaSearch(searched.field as SearchType, searched.value)}>{s.ca.liveSearch}</button></div>}
        {laSearch && <LaCountyDirectoryResults state={laSearch} />}
        {orangeMatches.length > 0 && (
          <section aria-label={s.ca.orangeAria} className="mt-6 bg-white">
            <h5 className="font-semibold text-stone-900">{searched.field === "county" ? s.ca.orangeBrowse : s.ca.orangeCount(orangeMatches.length, orangeCity)}</h5>
            {searched.field === "county" && <><label htmlFor="orange-county-city" className="mt-3 block text-sm font-semibold text-stone-700">{s.ca.orangeFilter}</label>
              <select id="orange-county-city" value={browseCity} onChange={(event) => setBrowseCity(event.target.value)} className={`mt-1 min-h-11 w-full max-w-sm rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`}>
                <option value="">{s.ca.orangeChooseCity}</option>
                <option value="*">{s.ca.orangeAll}</option>
                {[...new Set(orangeMatches.map((site) => site.city))].sort().map((city) => <option key={city} value={city}>{city}</option>)}
              </select></>}
            <div className="mt-2 divide-y divide-sage-100">{orangeMatches.filter((site) => searched.field !== "county" || (browseCity !== "" && (browseCity === "*" || site.city === browseCity))).slice(0, 3).map((site) => <OrangeSiteCard key={site.id} site={site} />)}</div>
            {orangeMatches.filter((site) => searched.field !== "county" || (browseCity !== "" && (browseCity === "*" || site.city === browseCity))).length > 3 && <p className="text-xs text-stone-600">{s.ca.orangePreview}</p>}
            <a href="https://bhpproviderdirectory.ochca.com/" target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center rounded text-sm text-teal-800 underline ${focusRing}`}>{s.ca.orangeDirectory}</a>
            <details className="mt-2 text-xs text-stone-600">
              <summary className={`min-h-11 cursor-pointer content-center rounded font-semibold ${focusRing}`}>{s.ca.sourceDetails}</summary>
              <p className="mt-2">{s.ca.orangeSourceNow(orangeSnapshot.retrievedAt)}</p>
              <p className="mt-2">{s.ca.callBefore}</p>

            </details>
          </section>
        )}
        {sanDiegoMatches.length > 0 && <section aria-label={s.ca.sdAria} className="mt-4 rounded-lg border border-teal-300 bg-white p-4">
          <h5 className="font-semibold text-stone-900">{searched.field === "county" ? s.ca.sdCountyHeading(sanDiegoMatches.length) : s.ca.sdAreaHeading(sanDiegoMatches.length, searched.field, searched.value)}</h5>
          <p className="mt-1 text-xs text-stone-600">{s.ca.adultsOnly}</p>
          {searched.field === "county" && <><label htmlFor="san-diego-county-city" className="mt-3 block text-sm font-semibold text-stone-700">{s.ca.sdFilter}</label>
            <select id="san-diego-county-city" value={browseCity} onChange={(event) => setBrowseCity(event.target.value)} className={`mt-1 min-h-11 w-full max-w-sm rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`}>
              <option value="">{s.ca.sdChooseCity}</option>
              <option value="*">{s.ca.sdAll}</option>
              {[...new Set(sanDiegoMatches.map((clinic) => clinic.city))].sort().map((city) => <option key={city} value={city}>{city}</option>)}
            </select>{browseCity && browseCity !== "*" && <p className="mt-2 text-sm text-stone-700">{s.ca.clinicsInCity(sanDiegoMatches.filter((clinic) => clinic.city === browseCity).length, browseCity)}</p>}</>}
          <div className="mt-3 grid gap-3 lg:grid-cols-2">{sanDiegoMatches.filter((clinic) => searched.field !== "county" || (browseCity !== "" && (browseCity === "*" || clinic.city === browseCity))).map((clinic) => <SanDiegoClinicCard key={clinic.id} clinic={clinic} />)}</div>
          <details className="mt-2 text-xs text-stone-600"><summary className={`min-h-11 cursor-pointer content-center rounded font-semibold ${focusRing}`}>{s.ca.sourceDetails}</summary>
            <p className="mt-2">{s.ca.sdSource(sanDiegoSnapshot.retrievedAt)}</p>
            <a href={sanDiegoDirectoryUrl} target="_blank" rel="noopener noreferrer" className={`mt-2 inline-block rounded font-semibold underline ${focusRing}`}>{s.ca.sdDirectory}</a>
          </details>
        </section>}
        {hasButteClinics && <section aria-label={s.ca.butteAria} className="mt-4 rounded-lg border border-teal-300 bg-white p-4">
          <h5 className="font-semibold text-stone-900">{s.ca.butteHeading(butteSnapshot.clinics.length)}</h5>
          <p className="mt-1 text-xs text-stone-600">{s.ca.adultsOnly}</p>
          <label htmlFor="butte-clinic-city" className="mt-3 block text-sm font-semibold text-stone-700">{s.ca.butteFilter}</label>
          <select id="butte-clinic-city" value={browseCity} onChange={(event) => setBrowseCity(event.target.value)} className={`mt-1 min-h-11 w-full max-w-sm rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`}>
            <option value="">{s.ca.butteAllCities}</option><option value="*">{s.ca.butteAll}</option>
            {[...new Set(butteSnapshot.clinics.map((clinic) => clinic.city))].sort().map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">{butteSnapshot.clinics.filter((clinic) => !browseCity || browseCity === "*" || clinic.city === browseCity).map((clinic) => <article key={clinic.id} className="rounded-xl border border-sage-200 bg-white p-5 shadow-sm">
            <h5 className="font-bold text-stone-900">{clinic.name}</h5>
            <p className="mt-2 text-sm text-stone-700"><AddressLink address={`${clinic.address} · ${clinic.city}, CA ${clinic.zip}`} /></p>
            <p className="mt-2 text-sm text-stone-700"><ListedPhone phone={clinic.phone} /></p>
            <a href={clinic.source} target="_blank" rel="noopener noreferrer" className={`mt-2 inline-block rounded text-sm text-teal-800 underline ${focusRing}`}>{s.ca.butteOfficial}</a>
          </article>)}</div>
          <details className="mt-2 text-xs text-stone-600"><summary className={`min-h-11 cursor-pointer content-center rounded font-semibold ${focusRing}`}>{s.ca.sourceDetails}</summary>
            <p className="mt-2">{s.ca.butteSource(butteSnapshot.retrievedAt)}</p>
            <a href={butteSnapshot.directoryUrl} target="_blank" rel="noopener noreferrer" className={`mt-2 inline-block rounded font-semibold underline ${focusRing}`}>{s.ca.butteDirectory}</a>
          </details>
        </section>}
        {matches.length > 0 && (searched.field === "county" ? <details aria-label={s.ca.licensedAria} className="mt-4 rounded-lg border border-sage-300 bg-white p-4">
          <summary className="cursor-pointer font-semibold text-stone-900">{s.ca.licensedFoldHeading(matches.length, searched.value)}</summary>
          <p className="mt-2 text-xs text-stone-600">{s.ca.licensedFoldBody}</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">{matches.map((facility) => <FacilityCard key={facility.id} facility={facility} />)}</div>
        </details> : <section aria-label={s.ca.licensedAria} className="mt-4 rounded-lg border border-sage-300 bg-white p-4">
          <h5 className="font-semibold text-stone-900">{s.ca.licensedHeading(matches.length, searched.field, searched.value)}</h5>
          <p className="mt-1 text-xs text-stone-600">{s.ca.licensedSubheading}</p>
          <details className="mt-2 text-xs text-stone-600"><summary className={`min-h-11 cursor-pointer content-center rounded font-semibold ${focusRing}`}>{s.ca.licensedAbout}</summary><p className="mt-2">{s.ca.licensedAboutBody}</p></details>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">{matches.map((facility) => <FacilityCard key={facility.id} facility={facility} />)}</div>
        </section>)}
        {selectedCounty && hasExactResults && searched.field !== "county" && <CountyPlanCard county={selectedCounty} compact />}
        {noExactResults && searched.field !== "county" && countyCandidates.length <= 1 && <div className="mt-4">
          <p role="status" className="text-sm text-stone-700">{s.ca.noResultsAreaLead(searched.field)}</p>
          {!selectedCounty && <a href="tel:211" className={`inline-flex min-h-11 items-center rounded text-sm font-semibold text-teal-800 underline ${focusRing}`}>{s.home.call211}</a>}
        </div>}
      </div>}
    </div>
  )
}
