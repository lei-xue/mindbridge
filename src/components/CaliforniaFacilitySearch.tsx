import { Fragment, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react"
import { Link } from "react-router-dom"
import type { LaSearchState, SearchType } from "./LaCountyDirectorySearch"
import { searchLaCounty } from "../lib/laCountySearch"
import facilities from "../data/california-facilities.json"
import countyAccess from "../data/california-county-access.json"
import countySites from "../data/california-county-sites.json"
import orange from "../data/orange-provider-sites.json"
import sanDiego from "../data/san-diego-adult-clinics.json"
import butte from "../data/butte-adult-clinics.json"
import primaryCare from "../data/california-primary-care.json"
import { btnCall, btnSecondary, focusRing } from "../lib/ui"
import { AddressLink } from "./AddressLink"
import { DirectoryTable, type TableRow } from "./DirectoryTable"
import { GentleSprout } from "./GentleSprout"
import { useLocale } from "../i18n/LocaleProvider"

type SearchField = "county" | "zip"
type Listing = { id: string; name: string; city: string; address: string; zip: string; phone: string; category: string; source: string; sourceLabel: string; date: string; extra?: ReactNode }
const licenseSources = {
  CDPH: "https://data.chhs.ca.gov/dataset/licensed-healthcare-facility-listing",
  DHCS: "https://data.chhs.ca.gov/dataset/licensed-mental-health-rehabilitation-centers-mhrc-and-psychiatric-health-facilities-phf",
}
const ocDirectory = "https://bhpproviderdirectory.ochca.com/"
const sdDirectory = "https://www.optumsandiego.com/content/SanDiego/sandiego/en/community-resources/providerdirectory1.html"
const laDirectory = "https://dmh.lacounty.gov/pd/"

function ListedPhone({ phone }: { phone: string }) {
  const dial = phone.match(/^(?:\+?1[ .-]*)?(\(?\d{3}\)?[ .-]*\d{3}[ .-]*\d{4})(?:\s*(?:ext\.?|x|#)\s*(\d{1,6}))?$/i)
  return dial ? <a href={`tel:+1${dial[1].replace(/\D/g, "")}${dial[2] ? `;ext=${dial[2]}` : ""}`} className={`inline-flex min-h-11 items-center rounded font-semibold text-teal-800 underline ${focusRing}`}>{phone}</a> : <span>{phone || "—"}</span>
}

export function CaliforniaFacilitySearch() {
  const { s, t, to, locale } = useLocale()
  const [field, setField] = useState<SearchField>("county")
  const [value, setValue] = useState("")
  const [searched, setSearched] = useState<{ field: SearchField; value: string; source?: "location" } | null>(null)
  const [error, setError] = useState("")
  const [manualCounty, setManualCounty] = useState("")
  const [browseCity, setBrowseCity] = useState("*")
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState("")
  const countySelect = useRef<HTMLSelectElement>(null)
  const focusCountyAfterSwitch = useRef(false)
  useEffect(() => {
    if (field === "county" && focusCountyAfterSwitch.current) {
      countySelect.current?.focus()
      focusCountyAfterSwitch.current = false
    }
  }, [field])
  const locationRequest = useRef(0)
  const locationTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [laSearch, setLaSearch] = useState<LaSearchState | null>(null)
  const laAbort = useRef<AbortController | null>(null)
  useEffect(() => () => { locationRequest.current++; clearTimeout(locationTimer.current); laAbort.current?.abort() }, [])
  const cancelLocation = () => { locationRequest.current++; clearTimeout(locationTimer.current); setLocating(false); setLocationMessage("") }
  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setLocationMessage(s.ca.locationUnavailable); return }
    laAbort.current?.abort()
    if (laSearch?.isLoading) setLaSearch(null)
    const request = ++locationRequest.current
    const deadline = Date.now() + 8000
    setLocating(true)
    setLocationMessage("")
    clearTimeout(locationTimer.current)
    const fail = (code: number) => {
      if (request !== locationRequest.current) return
      locationRequest.current++
      clearTimeout(locationTimer.current)
      setLocating(false)
      setLocationMessage(code === 1 ? s.ca.locationDenied : code === 3 ? s.ca.locationTimeout : s.ca.locationFailed)
    }
    // Browser timeout does not reliably cover permission prompts or the lazy boundary download.
    locationTimer.current = setTimeout(() => fail(3), 8000)
    try { navigator.geolocation.getCurrentPosition(async position => {
      if (request !== locationRequest.current) return
      if (Date.now() >= deadline) { fail(3); return }
      let county: string | null
      try {
        const { suggestCounty } = await import("../lib/countyLocation")
        if (request !== locationRequest.current) return
        if (Date.now() >= deadline) { fail(3); return }
        county = suggestCounty(position.coords.latitude, position.coords.longitude, position.coords.accuracy)
      } catch {
        if (request !== locationRequest.current) return
        locationRequest.current++; clearTimeout(locationTimer.current)
        setLocating(false); setLocationMessage(s.ca.boundaryLoadFailed); return
      }
      locationRequest.current++; clearTimeout(locationTimer.current)
      setLocating(false)
      if (!county) { setLocationMessage(s.ca.noCountySuggested); return }
      laAbort.current?.abort(); setLaSearch(null); setManualCounty(""); setBrowseCity("*")
      setSearched({ field: "county", value: county, source: "location" })
      setError(""); setValue(county); setField("county")
      setLocationMessage("")
    }, failure => fail(failure.code), { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }) }
    catch { fail(2) }
  }
  const runLaSearch = (searchType: SearchType, term: string) => {
    laAbort.current?.abort()
    const controller = new AbortController(); laAbort.current = controller
    setLaSearch({ query: term, searchType, results: [], hasMore: false, isLoading: true, error: "" })
    void searchLaCounty(searchType, term, controller.signal).then(payload => {
      if (!controller.signal.aborted) setLaSearch({ query: term, searchType, results: payload.results, hasMore: Boolean(payload.hasMore), isLoading: false, error: "" })
    }).catch((caught: unknown) => {
      if (!controller.signal.aborted) setLaSearch({ query: term, searchType, results: [], hasMore: false, isLoading: false, error: caught instanceof Error ? caught.message : "The directory search is temporarily unavailable." })
    })
  }
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); cancelLocation(); laAbort.current?.abort(); setLaSearch(null); setManualCounty(""); setBrowseCity("*")
    const term = value.trim().replace(/\s+/g, " ")
    if (field === "county" ? !countyAccess.countyPlans.some(plan => plan.name === term) : !/^\d{5}$/.test(term)) {
      setError(field === "county" ? s.ca.errorCounty : s.ca.errorZip); setSearched(null); return
    }
    setError(""); setSearched({ field, value: term })
    const counties = countyAccess.zipCounties[term as keyof typeof countyAccess.zipCounties]
    if (field === "zip" && counties?.length === 1 && counties[0] === "Los Angeles") runLaSearch("zip", term)
  }
  const same = (a: string, b: string) => a.toLocaleLowerCase("en-US") === b.toLocaleLowerCase("en-US")
  const zipCandidates = searched?.field === "zip" ? [...new Set([
    ...(countyAccess.zipCounties[searched.value as keyof typeof countyAccess.zipCounties] ?? []),
    ...primaryCare.clinics.filter(clinic => clinic.zip.slice(0, 5) === searched.value).map(clinic => clinic.county),
  ])] : []
  const countyCandidates = searched?.field === "zip" ? zipCandidates : searched ? [searched.value] : []
  const selectedCounty = manualCounty || (countyCandidates.length === 1 ? countyCandidates[0] : "")
  const matchesQuery = (city: string, zip: string, county: string) => Boolean(searched && (searched.field === "county" ? same(county, searched.value) : same(searched.field === "zip" ? zip.slice(0, 5) : city, searched.value)) && (!manualCounty || same(county, manualCounty)))
  const listings: Listing[] = searched ? [
    ...facilities.filter(f => matchesQuery(f.city, f.zip, f.county)).map(f => ({ id: `license-${f.id}`, name: f.name, city: f.city, address: f.address, zip: f.zip, phone: f.phone || "", category: f.category, source: licenseSources[f.source as keyof typeof licenseSources], sourceLabel: f.source, date: f.source === "CDPH" ? "2026-09-01" : "2026-09-11" })),
    ...orange.sites.filter(site => countyAccess.zipCounties[site.zip as keyof typeof countyAccess.zipCounties]?.includes("Orange") && matchesQuery(site.city, site.zip, "Orange") && (searched.field !== "zip" || selectedCounty === "Orange")).map(site => ({ id: `oc-${site.id}`, name: site.name, city: site.city, address: site.address, zip: site.zip, phone: site.phone || "", category: site.category, source: ocDirectory, sourceLabel: "OC BHP", date: orange.retrievedAt })),
    ...sanDiego.clinics.filter(clinic => matchesQuery(clinic.city, clinic.zip, "San Diego") && (searched.field !== "zip" || selectedCounty === "San Diego")).map(clinic => ({ id: `sd-${clinic.id}`, name: clinic.name, city: clinic.city, address: clinic.address, zip: clinic.zip, phone: clinic.phone, category: s.table.adults, source: sdDirectory, sourceLabel: "San Diego BHS", date: sanDiego.retrievedAt })),
    ...butte.clinics.filter(clinic => matchesQuery(clinic.city, clinic.zip, "Butte") && (searched.field !== "zip" || selectedCounty === "Butte")).map(clinic => ({ id: `butte-${clinic.id}`, name: clinic.name, city: clinic.city, address: clinic.address, zip: clinic.zip, phone: clinic.phone, category: s.table.adults, source: clinic.source, sourceLabel: s.ca.butteOfficial, date: butte.retrievedAt })),
    ...primaryCare.clinics.filter(clinic => matchesQuery(clinic.city, clinic.zip, clinic.county) && (searched.field !== "zip" || selectedCounty === clinic.county)).map(clinic => ({ id: `hcai-${clinic.id}`, name: clinic.name, city: clinic.city, address: clinic.address, zip: clinic.zip, phone: clinic.phone, category: s.table.primaryMental, source: primaryCare.source, sourceLabel: primaryCare.sourceLabel, date: primaryCare.sourceExtractedAt })),
    ...(laSearch?.results ?? []).map(result => ({ id: `la-${result.id}`, name: result.name, city: result.address.city, address: result.address.lines.join(" · "), zip: result.address.postalCode, phone: result.phones.join(" · "), category: "LA County DMH", source: laDirectory, sourceLabel: "LA DMH", date: result.lastUpdated || "", extra: <>
      {result.websites.map(site => <p key={site.url}><a href={site.url} target="_blank" rel="noopener noreferrer" className={`underline ${focusRing}`}>{site.label}</a></p>)}
      {result.hours.length > 0 && <p>{s.la.listedHours} {result.hours.map(h => `${h.days.join(", ")}: ${h.opens && h.closes ? `${h.opens}–${h.closes}` : s.la.hoursNotSpecified}`).join("; ")}</p>}
      {result.languages.length > 0 && <p>{s.la.languages} {result.languages.map(t).join(", ")}</p>}
      {result.populations.length > 0 && <p>{s.la.populations} {result.populations.map(t).join(", ")}</p>}
      {result.accessibility.length > 0 && <p>{s.la.accessibility} {result.accessibility.join("; ")}</p>}
    </> })),
  ] : []
  const cityOptions = [...new Map([...listings].reverse().map(row => [row.city.toLocaleLowerCase("en-US"), row.city])).values()].sort()
  const visibleListings = listings.filter(row => browseCity === "*" || same(row.city, browseCity))
  const plan = countyAccess.countyPlans.find(p => p.name === selectedCounty)
  const website = countySites.websites.find(p => p.name === selectedCounty)?.url
  const linkClass = `inline-flex min-h-11 items-center rounded text-teal-800 underline ${focusRing}`
  const rows: TableRow[] = visibleListings.map(row => ({ id: row.id, cells: [
    <h4 key="name" className="font-semibold">{row.name}</h4>, <div key="type"><span lang={row.category === s.table.adults || row.id.startsWith("hcai-") ? undefined : "en"}>{row.category}</span>{row.extra && <div className="mt-2 space-y-1 text-xs">{row.extra}</div>}</div>,
    row.address ? <AddressLink key="address" address={`${row.address} · ${row.city}, CA ${row.zip}`} /> : `${row.city}, CA ${row.zip}`,
    <div key="phone">{row.id.startsWith("la-") ? row.phone.split(" · ").filter(Boolean).map(phone => <ListedPhone key={phone} phone={phone} />) : <ListedPhone phone={row.phone} />}</div>,
    <Fragment key="source"><a className={linkClass} href={row.source} target="_blank" rel="noopener noreferrer">{row.sourceLabel}</a>{row.date && <p className="text-xs text-stone-500">{row.date}</p>}</Fragment>,
  ] }))
  if (plan) {
    const dial = plan.phone.match(/\(?\d{3}\)?[ .-]*\d{3}[ .-]*\d{4}/)?.[0].replace(/\D/g, "")
    rows.unshift({ id: `county-${plan.name}`, cells: [<h4 key="name" className="font-semibold">{s.ca.planName(plan.name)}</h4>, <Fragment key="type">{s.table.referral}<p className="mt-1 text-xs">{s.ca.planBrief}</p></Fragment>, s.ca.countyOption(plan.name), dial ? <a key="phone" aria-label={s.ca.planCallAria} className={linkClass} href={`tel:${dial}`}>{plan.phone}</a> : plan.phone, <a key="source" className={linkClass} href={plan.name === "Los Angeles" ? laDirectory : website || countyAccess.source} target="_blank" rel="noopener noreferrer">{plan.name === "Los Angeles" ? s.ca.planLaLink : website ? s.ca.planVisit(plan.name) : s.ca.planSource}</a>] })
  }
  const noMatches = listings.length === 0 && !laSearch?.isLoading && !laSearch?.error
  const setMode = (mode: SearchField) => { cancelLocation(); laAbort.current?.abort(); setLaSearch(null); setManualCounty(""); setBrowseCity("*"); setField(mode); setValue(""); setSearched(null); setError("") }
  const enterCounty = () => {
    if (field === "county") {
      cancelLocation()
      countySelect.current?.focus()
    } else {
      focusCountyAfterSwitch.current = true
      setMode("county")
    }
  }
  const changeCounty = (county: string) => { cancelLocation(); laAbort.current?.abort(); setLaSearch(null); setManualCounty(county); setBrowseCity("*") }
  const translatedError = laSearch ? t(laSearch.error) : ""
  return <div data-js-only className="mt-5 space-y-3">
    <div role="group" aria-label={s.ca.modesAria} className="grid grid-cols-2 gap-1 rounded-xl bg-sage-100 p-1">{(["county", "zip"] as const).map(mode => <button key={mode} type="button" aria-pressed={field === mode} onClick={() => setMode(mode)} className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${focusRing} ${field === mode ? "bg-white text-teal-800 shadow-sm" : "text-stone-700 hover:bg-sage-50"}`}>{mode === "zip" ? s.ca.modeZip : s.ca.modeCounty}</button>)}</div>
    <form onSubmit={onSubmit} className="grid gap-3">
      <div><label htmlFor="california-search-value" className="mb-1 block text-sm font-semibold text-stone-700">{field === "county" ? s.ca.countyLabel : s.ca.zipLabel}</label>
        {field === "county" ? <select ref={countySelect} id="california-search-value" value={value} onChange={event => { cancelLocation(); setValue(event.target.value) }} className={`min-h-11 w-full rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`}><option value="">{s.ca.chooseCountyOption}</option>{countyAccess.countyPlans.map(p => <option key={p.name} value={p.name}>{s.ca.countyOption(p.name)}</option>)}</select> : <input id="california-search-value" type="text" inputMode={field === "zip" ? "numeric" : "text"} autoComplete="off" maxLength={field === "zip" ? 5 : 60} placeholder={field === "zip" ? s.ca.zipPlaceholder : s.ca.cityPlaceholder} value={value} onChange={event => { cancelLocation(); setValue(event.target.value) }} className={`min-h-11 w-full rounded-lg border border-sage-300 bg-white px-3 text-base ${focusRing}`} />}
      </div>
      <div className="grid gap-2"><button type="submit" className={btnCall}>{s.ca.submit}</button><button type="button" disabled={locating} aria-busy={locating} className={`min-h-11 rounded px-3 text-sm text-teal-800 underline ${focusRing}`} onClick={useCurrentLocation}>{locating ? s.ca.locating : s.ca.useLocation}</button></div>
    </form>
    {locating && (
      <div role="status" className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={enterCounty} className={`min-h-11 rounded px-3 text-sm font-semibold text-teal-800 underline ${focusRing}`}>{s.ca.locationCancel}</button>
      </div>
    )}
    {locationMessage && <p role="status" className="text-sm text-stone-700">{locationMessage}</p>}
    <Link to={to("/about")} className={`inline-flex min-h-11 items-center rounded text-xs text-stone-600 underline ${focusRing}`}>{s.ca.coverage}</Link>
    {field === "zip" && countyAccess.zipCounties[value.trim() as keyof typeof countyAccess.zipCounties]?.length === 1 && countyAccess.zipCounties[value.trim() as keyof typeof countyAccess.zipCounties][0] === "Los Angeles" && <p className="text-xs text-stone-700">{s.ca.laZipNotice}</p>}
    {error && <p role="alert" className="text-sm font-semibold text-red-800">{error}</p>}
    {searched && <div className="mt-5" aria-live="polite">
      <h4 className="font-semibold text-stone-900">{s.ca.resultHeading(searched.field, searched.value)}</h4>
      {searched.field === "county" && listings.length > 0 && <p className="mt-1 text-xs text-stone-600">{s.table.countyScope}</p>}
      {searched.field !== "county" && listings.some(row => row.id.startsWith("license-")) && <p className="mt-1 text-xs text-stone-600">{s.ca.licensedFoldBody}</p>}
      {listings.length > 0 && <p className="mt-1 text-xs text-stone-600">{s.ca.confirmCall}</p>}
      {searched.field === "zip" && countyCandidates.length > 1 && <p className="mt-2 text-sm">{s.ca.zipCrosses}</p>}
      {countyCandidates.length > 1 && <div className="mt-3"><label htmlFor="choose-county" className="mb-1 block text-sm font-semibold">{s.ca.chooseYourCounty}</label><select id="choose-county" value={manualCounty} onChange={event => changeCounty(event.target.value)} className={`min-h-11 w-full max-w-sm rounded-lg border border-sage-300 px-3 ${focusRing}`}><option value="">{s.ca.selectCountyOption}</option>{countyCandidates.map(c => <option key={c} value={c}>{s.ca.countyOption(c)}</option>)}</select></div>}
      {searched.field === "county" && searched.source !== "location" && cityOptions.length > 1 && <div className="mt-3"><label htmlFor="local-city-filter" className="block text-sm font-semibold">{s.table.city}</label><select id="local-city-filter" value={browseCity} onChange={event => setBrowseCity(event.target.value)} className={`mt-1 min-h-11 w-full max-w-sm rounded-lg border border-sage-300 px-3 ${focusRing}`}><option value="*">{s.table.allCities}</option>{cityOptions.map(city => <option key={city} value={city}>{city}</option>)}</select></div>}
      {selectedCounty === "Los Angeles" && searched.field !== "county" && !laSearch && <div className="mt-3"><p className="text-sm">{s.ca.livePrompt(searched.field)}</p><button type="button" className={`${btnSecondary} mt-2`} onClick={() => runLaSearch(searched.field as SearchType, searched.value)}>{s.ca.liveSearch}</button></div>}
      {laSearch?.isLoading && <p role="status" className="mt-2 text-sm">{s.la.searching}</p>}
      {laSearch?.error && <p role="alert" className="mt-2 text-sm font-semibold text-red-800">{locale === "es" && translatedError === laSearch.error ? s.la.errorUnavailable : translatedError}</p>}
      {laSearch && !laSearch.isLoading && !laSearch.error && <h4 className="mt-2 text-sm font-semibold">{s.la.resultsHeading(laSearch.results.length, laSearch.searchType, laSearch.query)}</h4>}
      {rows.length > 0 && <DirectoryTable resetKey={searched} label={s.table.local} kind="provider" columns={[{ key: "name", label: s.table.name }, { key: "type", label: s.table.type }, { key: "location", label: s.table.location }, { key: "phone", label: s.table.contact }, { key: "source", label: s.table.source }]} rows={rows} />}
      {laSearch?.hasMore && <p className="mt-2 text-xs text-stone-600">{s.la.hasMore}</p>}
      {noMatches && searched.field !== "county" && countyCandidates.length <= 1 && <div className="mt-3 flex items-start gap-3">
        <GentleSprout small pose="hug" />
        <div className="min-w-0 flex-1">
          <p role="status" className="max-w-xl text-sm leading-relaxed text-stone-700">{s.ca.noResultsAreaLead(searched.field)} {s.ca.noResultsAreaHint}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {field !== "county" && <button type="button" onClick={enterCounty} className={btnSecondary}>{s.ca.searchByCountyCta}</button>}
            {!selectedCounty && <a href="tel:211" className={linkClass}>{s.home.call211}</a>}
          </div>
        </div>
      </div>}
    </div>}
  </div>
}
