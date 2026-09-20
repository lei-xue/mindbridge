import { Link, useSearchParams } from "react-router-dom"
import { CrisisResourceCard } from "../components/CrisisResourceCard"
import { FilterBar } from "../components/FilterBar"
import { ResourceCard } from "../components/ResourceCard"
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

  const filters: Filters = {
    q: searchParams.get("q") ?? "",
    audience: searchParams.get("audience") ?? "",
    issue: searchParams.get("issue") ?? "",
    category: searchParams.get("category") ?? "",
    region: searchParams.get("region") ?? "",
  }

  const onChange = (patch: Partial<Filters>) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(patch)) {
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
    }
    setSearchParams(next, { replace: true })
  }

  const onClear = () => setSearchParams({}, { replace: true })

  const results = filterResources(filters)
  const crisisEntries = getResourcesByIds(CRISIS_ENTRY_IDS)

  return (
    <>
      <section className="border-b border-sage-200 bg-sage-50">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            You are not alone.
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-stone-700 sm:text-xl">
            Find free, confidential mental health support.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="tel:988" className={btnCall}>
              Call or text 988 now
            </a>
            <a href="#directory" className={btnSecondary}>
              Browse all resources
            </a>
          </div>
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

      <section id="directory" aria-labelledby="directory-heading" className="scroll-mt-16">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <h2 id="directory-heading" className="text-xl font-bold text-stone-900 sm:text-2xl">
            Browse resources
          </h2>
          <p className="mt-1 text-stone-700">
            Filter by who you are, what you're going through, or the kind of support you need.
          </p>
          <div className="mt-5">
            <FilterBar filters={filters} onChange={onChange} onClear={onClear} />
          </div>
          <p className="mt-4 text-sm font-semibold text-stone-700" aria-live="polite">
            Showing {results.length} of {RESOURCES.length} resources
          </p>
          {results.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-sage-300 bg-white p-8 text-center">
              <p className="text-stone-700">
                No resources match your filters. Try broadening your search.
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
