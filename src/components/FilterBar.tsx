import {
  AUDIENCE_OPTIONS,
  CATEGORY_OPTIONS,
  ISSUE_OPTIONS,
  REGION_OPTIONS,
  type Filters,
} from "../lib/directory"
import { btnSecondary, focusRing } from "../lib/ui"
import { useLocale } from "../i18n/LocaleProvider"

const controlClass = `min-h-11 w-full rounded-lg border border-sage-300 bg-white px-3 py-2.5 text-base text-stone-800 ${focusRing}`

type Props = {
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  onClear: () => void
}

export function FilterBar({ filters, onChange, onClear }: Props) {
  const { s, t } = useLocale()
  const hasFilters =
    filters.q.trim() !== "" ||
    filters.audience !== "" ||
    filters.issue !== "" ||
    filters.category !== "" ||
    filters.region !== ""

  return (
    <div className="rounded-xl border border-sage-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2 lg:col-span-2">
          <label htmlFor="filter-q" className="mb-1 block text-sm font-semibold text-stone-700">
            {s.filters.search}
          </label>
          <input
            id="filter-q"
            type="search"
            placeholder={s.filters.searchPlaceholder}
            className={controlClass}
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="filter-audience" className="mb-1 block text-sm font-semibold text-stone-700">
            {s.filters.audience}
          </label>
          <select
            id="filter-audience"
            className={controlClass}
            value={filters.audience}
            onChange={(e) => onChange({ audience: e.target.value })}
          >
            <option value="">{s.filters.allAudiences}</option>
            {AUDIENCE_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {t(a)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-issue" className="mb-1 block text-sm font-semibold text-stone-700">
            {s.filters.issue}
          </label>
          <select
            id="filter-issue"
            className={controlClass}
            value={filters.issue}
            onChange={(e) => onChange({ issue: e.target.value })}
          >
            <option value="">{s.filters.allIssues}</option>
            {ISSUE_OPTIONS.map((issue) => (
              <option key={issue} value={issue}>
                {t(issue)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-category" className="mb-1 block text-sm font-semibold text-stone-700">
            {s.filters.category}
          </label>
          <select
            id="filter-category"
            className={controlClass}
            value={filters.category}
            onChange={(e) => onChange({ category: e.target.value })}
          >
            <option value="">{s.filters.allCategories}</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {t(c)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-region" className="mb-1 block text-sm font-semibold text-stone-700">
            {s.filters.region}
          </label>
          <select
            id="filter-region"
            className={controlClass}
            value={filters.region}
            onChange={(e) => onChange({ region: e.target.value })}
          >
            <option value="">{s.filters.allRegions}</option>
            {REGION_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {t(r)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {hasFilters && (
        <div className="mt-4">
          <button type="button" onClick={onClear} className={btnSecondary}>
            {s.filters.clear}
          </button>
        </div>
      )}
    </div>
  )
}
