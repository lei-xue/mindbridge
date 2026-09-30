import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { CaliforniaFacilitySearch } from "../components/CaliforniaFacilitySearch"

import { FilterBar } from "../components/FilterBar"
import { ResourceCard } from "../components/ResourceCard"
import { GentleSprout } from "../components/GentleSprout"
import { SproutSpeech } from "../components/SproutSpeech"
import { useLocale } from "../i18n/LocaleProvider"
import {
  filterResources,
  RESOURCES,
  type Filters,
} from "../lib/directory"
import { focusRing } from "../lib/ui"

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState("")

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

    setSearchParams({}, { replace: true })
  }

  const results = filterResources(filters, locale)

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


        </div>
      </section>

      <section id="directory" aria-labelledby="directory-heading" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-10">
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

          {results.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map(resource => <ResourceCard key={resource.id} resource={resource} omitSharedContacts />)}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-sage-300 bg-white p-8 text-center">
              <div className="mb-2 flex justify-center"><GentleSprout small pose="hug" /></div>
              <p className="text-stone-700">
                {s.home.noMatches}
              </p>

            </div>
          )}

        </div>
      </section>
    </>
  )
}
