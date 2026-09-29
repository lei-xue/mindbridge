import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CaliforniaFacilitySearch } from "../components/CaliforniaFacilitySearch"
import { CrisisResourceCard } from "../components/CrisisResourceCard"
import { FilterBar } from "../components/FilterBar"
import { ResourceCard } from "../components/ResourceCard"
import { GentleSprout } from "../components/GentleSprout"
import { SproutSpeech } from "../components/SproutSpeech"
import {
  CRISIS_ENTRY_IDS,
  filterResources,
  getResourcesByIds,
  RESOURCES,
  type Filters,
} from "../lib/directory"
import { btnCall, btnSecondary, focusRing } from "../lib/ui"

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState("")
  const [includeCrisis, setIncludeCrisis] = useState(false)

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
  const results = filterResources(filters).filter((resource) => hasFilters || includeCrisis || !CRISIS_ENTRY_IDS.includes(resource.id))
  const crisisEntries = getResourcesByIds(CRISIS_ENTRY_IDS)

  return (
    <>
      <section className="border-b border-sage-200 bg-sage-50">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <SproutSpeech pose="wave">
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            You are not alone.
          </h1>
          </SproutSpeech>
          <p className="mt-3 max-w-2xl text-lg text-stone-700 sm:text-xl">
            Find free crisis and support resources, or explore in-person options whose cost and eligibility you must confirm.
          </p>
          <p className="mt-2 text-sm text-sage-700">Take your time. One small step is enough to begin.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="tel:988" className={btnCall}>
              Call or text 988 now
            </a>
            <a
              href="#directory"
              className={btnSecondary}
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
              Browse all resources
            </a>
          </div>
          <p className="mt-4 text-sm text-stone-700">
            Not in immediate crisis?{" "}
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
            >Find in-person support by county</a>.
          </p>
        </div>
      </section>

      <section aria-labelledby="crisis-heading" className="border-b border-sage-200 bg-amber-50">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <h2 id="crisis-heading" className="text-xl font-bold text-stone-900 sm:text-2xl">
            In crisis right now?
          </h2>
          <p className="mt-1 text-stone-700">
            These services are free, confidential, and available right away.
          </p>
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
            Looking for in-person support?
          </h2>
          </SproutSpeech>
          <p className="mt-2 max-w-3xl text-stone-700">
            Choose a county for its Medi-Cal mental-health contact and available listings. Coverage is incomplete.
          </p>
          <CaliforniaFacilitySearch />
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="tel:211" className={btnCall}>
              Call 211
            </a>
            <a
              href="https://www.211.org/about-us/your-local-211"
              target="_blank"
              rel="noopener noreferrer"
              className={btnSecondary}
            >
              Find your local 211 directory
            </a>

          </div>
          <details className="mt-3 text-xs text-stone-600"><summary className="cursor-pointer">External directory privacy</summary><p className="mt-2">External directories have their own privacy policies for information you enter there.</p></details>
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
            Browse resources
          </h2>
          </SproutSpeech>
          <p className="mt-1 text-stone-700">
            Filter by who you are, what you're going through, or the kind of support you need.
          </p>
          <div className="mt-5">
            <FilterBar filters={filters} onChange={onChange} onClear={onClear} />
          </div>
          <p className="mt-4 text-sm font-semibold text-stone-700" aria-live="polite">
            Showing {results.length} of {RESOURCES.length} resources
          </p>
          {!hasFilters && !includeCrisis && <p className="mt-1 text-sm text-stone-600">Crisis lines are above. <button type="button" onClick={() => setIncludeCrisis(true)} className={`rounded text-teal-800 underline ${focusRing}`}>Include crisis lines here</button></p>}
          {results.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-sage-300 bg-white p-8 text-center">
              <div className="mb-2 flex justify-center"><GentleSprout small pose="hug" /></div>
              <p className="text-stone-700">
                No matches this time. Try fewer filters, or browse all resources.
              </p>
              <button type="button" onClick={onClear} className={`${btnSecondary} mt-4`}>
                Clear filters
              </button>
            </div>
          )}
          <p className="mt-8 text-sm text-stone-600">
            Looking for something else?{" "}
            <Link to="/about" className={`rounded font-semibold text-teal-800 underline ${focusRing}`}>
              Learn how MindBridge works
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  )
}
