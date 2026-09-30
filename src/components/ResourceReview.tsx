import checks from "../data/resource-checks.json"
import { focusRing } from "../lib/ui"
import { useLocale } from "../i18n/LocaleProvider"
export function ResourceReview({ id, name }: { id: string; name: string }) {
  const { s } = useLocale()
  const check = checks[id as keyof typeof checks]
  const report = `mailto:hi@leixue.dev?subject=${encodeURIComponent(s.review.reportSubject(name))}&body=${encodeURIComponent(s.review.reportBody(name))}`
  return <div className="text-xs text-stone-600">
    {check && <span>{s.review.sourceChecked} <time dateTime={check.checkedOn}>{check.checkedOn}</time>. </span>}
    <a href={report} aria-label={s.review.reportAria(name)} className={`inline-flex min-h-11 items-center rounded text-teal-800 underline ${focusRing}`}>{s.review.report}</a>
  </div>
}
