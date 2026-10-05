import { focusRing } from "../lib/ui"
import { AddressLink } from "./AddressLink"
import { useLocale } from "../i18n/LocaleProvider"
import type { Locale } from "../lib/localePath"

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
export type LaSearchState = { query: string; searchType: SearchType; results: DirectoryResult[]; hasMore: boolean; isLoading: boolean; error: string; fetchedAt: number | null; cacheHit: boolean; stale: boolean }
const formatLaFetchedAt = (fetchedAt: number, locale: Locale) => {
  const date = new Date(fetchedAt)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(date)
}
const countyDirectoryUrl = "https://dmh.lacounty.gov/pd/"
const spanishDays: Record<string, string> = { monday: "lun", tuesday: "mar", wednesday: "mié", thursday: "jue", friday: "vie", saturday: "sáb", sunday: "dom" }
function formatHours(hours: DirectoryResult["hours"], locale: Locale, unspecified: string) {
  return hours.map((item) => {
    const days = item.days.map(day => locale === "es" ? spanishDays[day.toLowerCase()] ?? day : day.slice(0, 3)).join(", ")
    const times = item.opens && item.closes ? `${item.opens}–${item.closes}` : unspecified
    return [days, times].filter(Boolean).join(": ")
  }).join("; ")
}
function formatRecordDate(value: string, locale: Locale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { dateStyle: "medium", timeZone: "UTC" }).format(date)
}
function ResultCard({ result }: { result: DirectoryResult }) {
  const { s, locale, t } = useLocale()
  const address = [...result.address.lines, [result.address.city, result.address.state, result.address.postalCode].filter(Boolean).join(", ")].filter(Boolean).join(" · ")
  return <article className="rounded-xl border border-sage-200 bg-white p-5 shadow-sm">
    <h4 className="text-lg font-bold text-stone-900">{result.name}</h4>
    {address && <p className="mt-2 text-sm leading-relaxed text-stone-700">{result.address.lines.some(line => line.trim()) ? <AddressLink address={address} /> : address}</p>}
    {result.phones.length > 0 && <p className="mt-2 text-sm text-stone-700"><span className="font-semibold">{s.la.phones}</span> {result.phones.join(" · ")}</p>}
    {result.websites.length > 0 && <ul className="mt-3 flex flex-wrap gap-2" aria-label={s.la.websitesAria(result.name)}>{result.websites.map(site => <li key={site.url}><a href={site.url} target="_blank" rel="noopener noreferrer" className={`rounded font-semibold text-teal-800 underline ${focusRing}`}>{site.label}</a></li>)}</ul>}
    {(result.hours.length > 0 || result.languages.length > 0 || result.populations.length > 0 || result.accessibility.length > 0 || result.lastUpdated) && <details className="mt-3 text-sm text-stone-700">
      <summary className="cursor-pointer font-semibold text-teal-800">{s.la.fold}</summary>
      {s.la.officialLanguageNote && <p className="mt-2 text-xs text-stone-600">{s.la.officialLanguageNote}</p>}
      {result.hours.length > 0 && <p className="mt-2"><span className="font-semibold">{s.la.listedHours}</span> {formatHours(result.hours, locale, s.la.hoursNotSpecified)}</p>}
      {result.languages.length > 0 && <p className="mt-2"><span className="font-semibold">{s.la.languages}</span> {result.languages.map(t).join(", ")}</p>}
      {result.populations.length > 0 && <p className="mt-2"><span className="font-semibold">{s.la.populations}</span> {result.populations.map(t).join(", ")}</p>}
      {result.accessibility.length > 0 && <p className="mt-2"><span className="font-semibold">{s.la.accessibility}</span> {result.accessibility.join("; ")}</p>}
      {result.lastUpdated && <p className="mt-2 text-xs text-stone-500">{s.la.recordUpdated(formatRecordDate(result.lastUpdated, locale))}</p>}
    </details>}
  </article>
}
export function LaCountyDirectoryResults({ state }: { state: LaSearchState }) {
  const { s, t, locale } = useLocale()
  const translatedError = t(state.error)
  const errorMessage = locale === "es" && translatedError === state.error ? s.la.errorUnavailable : translatedError
  return <section aria-label={s.la.sectionAria} className="mt-4 rounded-lg border border-teal-300 bg-white p-4" aria-live="polite">
    <h4 className="font-semibold text-stone-900">{s.la.heading}</h4>
    {state.isLoading && <p role="status" className="mt-2 text-sm text-stone-700">{s.la.searching}</p>}
    {state.error && <p role="alert" className="mt-2 text-sm font-semibold text-red-800">{errorMessage}</p>}
    {state.stale && <p role="status" className="mt-2 text-xs font-semibold text-amber-800">{s.la.staleResults}</p>}
    {state.fetchedAt !== null && <div className="mt-2 text-xs text-stone-600">
      <p>{s.la.fetchedAt} <time data-la-fetched-at={state.fetchedAt} dateTime={new Date(state.fetchedAt).toISOString()}>{formatLaFetchedAt(state.fetchedAt, locale)}</time></p>
      {state.cacheHit && !state.isLoading && !state.stale && <p>{s.la.memoryCache}</p>}
    </div>}
    {!state.isLoading && !state.error && state.fetchedAt !== null && <>
      <h5 className="mt-2 font-semibold text-stone-900">{s.la.resultsHeading(state.results.length, state.searchType, state.query)}</h5>
      {state.results.length > 0 ? <div className="mt-3 grid gap-3 lg:grid-cols-2">{state.results.map((result, index) => <ResultCard key={result.id || `${result.name}-${index}`} result={result} />)}</div> : <p className="mt-2 text-sm text-stone-700">{s.la.empty}</p>}
      {state.hasMore && <p className="mt-3 text-xs text-stone-600">{s.la.hasMore}</p>}
    </>}
    <details className="mt-3 text-xs text-stone-600"><summary className={`min-h-11 cursor-pointer content-center rounded ${focusRing}`}>{s.ca.sourceDetails}</summary><p>{s.la.disclaimerLead}<a href={countyDirectoryUrl} target="_blank" rel="noopener noreferrer" className={`rounded underline ${focusRing}`}>{s.la.disclaimerLink}</a>{s.la.disclaimerTail}</p></details>
  </section>
}
