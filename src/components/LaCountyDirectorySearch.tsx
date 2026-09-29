import { focusRing } from "../lib/ui"

export type SearchType = "zip" | "city"
export type DirectoryResult = {
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
export type LaSearchState = { query: string; searchType: SearchType; results: DirectoryResult[]; hasMore: boolean; isLoading: boolean; error: string }

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
      <h4 className="text-lg font-bold text-stone-900">{result.name}</h4>
      {address && <p className="mt-2 text-sm leading-relaxed text-stone-700">{address}</p>}
      {result.phones.length > 0 && <p className="mt-2 text-sm text-stone-700"><span className="font-semibold">Phones as listed:</span> {result.phones.join(" · ")}</p>}
      {result.websites.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={`Websites for ${result.name}`}>
          {result.websites.map((site) => <li key={site.url}><a href={site.url} target="_blank" rel="noopener noreferrer" className={`rounded font-semibold text-teal-800 underline ${focusRing}`}>{site.label}</a></li>)}
        </ul>
      )}
      {(result.hours.length > 0 || result.languages.length > 0 || result.populations.length > 0 || result.accessibility.length > 0 || result.lastUpdated) && <details className="mt-3 text-sm text-stone-700">
        <summary className="cursor-pointer font-semibold text-teal-800">Listed hours, languages &amp; accessibility (verify with provider)</summary>
        {result.hours.length > 0 && <p className="mt-2"><span className="font-semibold">Listed hours:</span> {formatHours(result.hours)}</p>}
        {result.languages.length > 0 && <p className="mt-2"><span className="font-semibold">Languages listed:</span> {result.languages.join(", ")}</p>}
        {result.populations.length > 0 && <p className="mt-2"><span className="font-semibold">Populations listed:</span> {result.populations.join(", ")}</p>}
        {result.accessibility.length > 0 && <p className="mt-2"><span className="font-semibold">Accessibility / location note:</span> {result.accessibility.join("; ")}</p>}
        {result.lastUpdated && <p className="mt-2 text-xs text-stone-500">Directory record last updated: {formatRecordDate(result.lastUpdated)}</p>}
      </details>}
    </article>
  )
}

export function LaCountyDirectoryResults({ state }: { state: LaSearchState }) {
  return (
    <section aria-label="LA County DMH directory listings" className="mt-4 rounded-lg border border-teal-300 bg-white p-4" aria-live="polite">
      <h4 className="font-semibold text-stone-900">Live LA County DMH directory</h4>
      {state.isLoading && <p role="status" className="mt-2 text-sm text-stone-700">Searching the LA County directory…</p>}
      {state.error && <p role="alert" className="mt-2 text-sm font-semibold text-red-800">{state.error}</p>}
      {!state.isLoading && !state.error && <>
        <h5 className="mt-2 font-semibold text-stone-900">{state.results.length} directory listing{state.results.length === 1 ? "" : "s"} for {state.searchType === "zip" ? "ZIP" : "city"} {state.query}</h5>
        {state.results.length > 0 ? <div className="mt-3 grid gap-3 lg:grid-cols-2">{state.results.map((result, index) => <ResultCard key={result.id || `${result.name}-${index}`} result={result} />)}</div> : <p className="mt-2 text-sm text-stone-700">No active listings were returned for that area. This does not mean there is no care nearby; try the full county directory or local 211.</p>}
        {state.hasMore && <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-stone-700">The County API indicates there are additional matches beyond this result page. For the complete list and County filters, use the official interactive provider directory below.</p>}
      </>}
      <p className="mt-4 text-xs leading-relaxed text-stone-600">Confirm directly with the provider whether it offers the service you need, accepts new clients, and has current in-person availability, eligibility, hours, and appointment requirements. For full filters, use the{" "}<a href={countyDirectoryUrl} target="_blank" rel="noopener noreferrer" className={`rounded font-semibold text-teal-800 underline ${focusRing}`}>official LA County provider directory</a>.</p>
    </section>
  )
}
