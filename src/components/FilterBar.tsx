import {
  AUDIENCE_OPTIONS,
  CATEGORY_OPTIONS,
  ISSUE_OPTIONS,
  REGION_OPTIONS,
  type Filters,
} from "../lib/directory"
import { btnSecondary, focusRing } from "../lib/ui"

const controlClass = `min-h-11 w-full rounded-lg border border-sage-300 bg-white px-3 py-2.5 text-base text-stone-800 ${focusRing}`

type Props = {
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  onClear: () => void
}

export function FilterBar({ filters, onChange, onClear }: Props) {
  const hasFilters =
    filters.q.trim() !== "" ||
    filters.audience !== "" ||
    filters.issue !== "" ||
    filters.category !== "" ||
    filters.region !== ""

  return (
    <div className="rounded-xl border border-sage-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="filter-q" className="mb-1 block text-sm font-semibold text-stone-700">
            Search
          </label>
          <input
            id="filter-q"
            type="search"
            placeholder="Name or description…"
            className={controlClass}
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="filter-audience" className="mb-1 block text-sm font-semibold text-stone-700">
            Audience
          </label>
          <select
            id="filter-audience"
            className={controlClass}
            value={filters.audience}
            onChange={(e) => onChange({ audience: e.target.value })}
          >
            <option value="">All audiences</option>
            {AUDIENCE_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-issue" className="mb-1 block text-sm font-semibold text-stone-700">
            Issue
          </label>
          <select
            id="filter-issue"
            className={controlClass}
            value={filters.issue}
            onChange={(e) => onChange({ issue: e.target.value })}
          >
            <option value="">All issues</option>
            {ISSUE_OPTIONS.map((issue) => (
              <option key={issue} value={issue}>
                {issue}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-category" className="mb-1 block text-sm font-semibold text-stone-700">
            Category
          </label>
          <select
            id="filter-category"
            className={controlClass}
            value={filters.category}
            onChange={(e) => onChange({ category: e.target.value })}
          >
            <option value="">All categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-region" className="mb-1 block text-sm font-semibold text-stone-700">
            Region
          </label>
          <select
            id="filter-region"
            className={controlClass}
            value={filters.region}
            onChange={(e) => onChange({ region: e.target.value })}
          >
            <option value="">All regions</option>
            {REGION_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>
      {hasFilters && (
        <div className="mt-4">
          <button type="button" onClick={onClear} className={btnSecondary}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
