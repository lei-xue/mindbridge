import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { CaliforniaFacilitySearch } from "../components/CaliforniaFacilitySearch"
import { CrisisResourceCard } from "../components/CrisisResourceCard"
import { FilterBar } from "../components/FilterBar"
import { ResourceCard } from "../components/ResourceCard"
import { GentleSprout } from "../components/GentleSprout"
import { SproutSpeech } from "../components/SproutSpeech"
import { useLocale } from "../i18n/LocaleProvider"
import {
  CRISIS_ENTRY_IDS,
  filterResources,
  getResourcesByIds,
  RESOURCES,
  type Filters,
} from "../lib/directory"
import { btnCall, btnText, btnSecondary, focusRing } from "../lib/ui"

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState("")
  const [includeCrisis, setIncludeCrisis] = useState(false)
  const { locale, s } = useLocale()

  useEffect(() => {
    if (searchParams.has("q")) {
      const next = new URLSearchParams(searchParams)
      next.delete("q")
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const filters: Filters = {
    q: query,
    audience: searchParams.get("audience") ?? "",
    issue: searchParams.get("issue") ?? "",
    category: searchParams.get("category") ?? "",
    region: searchParams.get("region") ?? "",
  }

  const onChange = (patch: Partial<Filters>) => {
    if (Object.hasOwn(patch, "q")) setQuery(patch.q ?? "")

    const urlEntries = Object.entries(patch).filter(([key]) => key !== "q")
    if (urlEntries.length === 0) return

    const next = new URLSearchParams(searchParams)
    for (const [key, value] of urlEntries) {
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
    }
    setSearchParams(next, { replace: true })
  }

  const onClear = () => {
    setQuery("")
    setIncludeCrisis(false)
    setSearchParams({}, { replace: true })
  }

  const hasFilters = Object.values(filters).some(Boolean)
  const results = filterResources(filters, locale).filter((resource) => hasFilters || includeCrisis || !CRISIS_ENTRY_IDS.includes(resource.id))
  const crisisEntries = getResourcesByIds(CRISIS_ENTRY_IDS)

  return (
    <>
      <section className="border-b border-sage-200 bg-sage-50">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:py-16">
          <SproutSpeech pose="wave" hero>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            {s.home.heading}
          </h1>
          <p className="mt-3 text-lg text-stone-700 sm:text-xl">
            {s.home.lead}
          </p>
          </SproutSpeech>

          <a lang="es" href="https://988lifeline.org/es/" target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center rounded text-sm font-semibold text-teal-800 underline ${focusRing}`}>{s.home.spanishLink}</a>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="tel:988" className={btnCall}>
              {s.home.callNow}
            </a>
            <a href="sms:988" className={btnText}>{s.home.textNow}</a>
            <a
              href="#directory"
              className={`inline-flex min-h-11 items-center rounded px-2 text-sm text-teal-800 underline ${focusRing}`}
              onClick={(event) => {
                event.preventDefault()
                setIncludeCrisis(true)
                const heading = document.getElementById("directory-heading")
                heading?.focus()
                heading?.scrollIntoView({
                  behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                  block: "start",
                })
              }}
            >
              {s.home.browseAll}
            </a>
          </div>
          <p className="mt-4 text-sm text-stone-700">

            <a
              href="#local-support-heading"
              className={`rounded font-semibold text-teal-800 underline ${focusRing}`}
              onClick={(event) => {
                event.preventDefault()
                const heading = document.getElementById("local-support-heading")
                heading?.focus()
                heading?.scrollIntoView({
                  behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                  block: "start",
                })
              }}
            >{s.home.findInPerson}</a>.
          </p>
        </div>
      </section>

      <section aria-labelledby="crisis-heading" className="border-b border-sage-200 bg-amber-50">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <h2 id="crisis-heading" className="text-xl font-bold text-stone-900 sm:text-2xl">
            {s.home.crisisHeading}
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {crisisEntries.map((resource) => (
              <CrisisResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="local-support-heading" className="border-b border-sage-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
          <SproutSpeech pose="hug" small>
          <h2 id="local-support-heading" tabIndex={-1} className={`scroll-mt-16 rounded text-xl font-bold text-stone-900 ${focusRing} sm:text-2xl`}>
            {s.home.localHeading}
          </h2>
          </SproutSpeech>

          <CaliforniaFacilitySearch />
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="tel:211" className={`inline-flex min-h-11 items-center rounded px-2 font-semibold text-teal-800 underline ${focusRing}`}>
              {s.home.call211}
            </a>
            <a
              href="https://www.211.org/about-us/your-local-211"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex min-h-11 items-center rounded px-2 text-sm text-teal-800 underline ${focusRing}`}
            >
              {s.home.find211}
            </a>

          </div>

        </div>
      </section>

      <section id="directory" aria-labelledby="directory-heading" className="scroll-mt-16">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <SproutSpeech pose="read" small>
          <h2
            id="directory-heading"
            tabIndex={-1}
            className={`rounded text-xl font-bold text-stone-900 ${focusRing} sm:text-2xl`}
          >
            {s.home.directoryHeading}
          </h2>
          </SproutSpeech>

          <div data-js-only className="mt-5">
            <FilterBar filters={filters} onChange={onChange} onClear={onClear} />
          </div>
          <p className="mt-4 text-sm font-semibold text-stone-700" aria-live="polite">
            {s.home.showing(results.length, RESOURCES.length)}
          </p>
          {!hasFilters && !includeCrisis && <p data-js-only className="mt-1 text-sm text-stone-600">{s.home.crisisAbove}{" "}<button type="button" onClick={() => setIncludeCrisis(true)} className={`rounded text-teal-800 underline ${focusRing}`}>{s.home.includeCrisis}</button></p>}
          {results.length > 0 ? (
            <div className="mt-6 space-y-6">
              {results.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-sage-300 bg-white p-8 text-center">
              <div className="mb-2 flex justify-center"><GentleSprout small pose="hug" /></div>
              <p className="text-stone-700">
                {s.home.noMatches}
              </p>
              <button type="button" onClick={onClear} className={`${btnSecondary} mt-4`}>
                {s.home.clearFilters}
              </button>
            </div>
          )}

        </div>
      </section>
    </>
  )
}
