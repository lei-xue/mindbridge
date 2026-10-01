import { focusRing } from "../lib/ui"
import { useLocale } from "../i18n/LocaleProvider"
export function CrisisBanner() {
  const { s } = useLocale()
  return <div data-crisis-banner role="region" aria-label={s.crisisBanner.region} className="border-b border-amber-300 bg-amber-100">
    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-2 px-4 py-1 text-sm text-amber-950 sm:text-base">
      <span>{s.crisisBanner.label}</span>
      <a href="tel:988" className={`inline-flex min-h-11 items-center rounded px-2 font-extrabold underline underline-offset-2 ${focusRing}`}>{s.crisisBanner.call}</a>
      <a href="sms:988" className={`inline-flex min-h-11 items-center rounded px-2 font-extrabold underline underline-offset-2 ${focusRing}`}>{s.crisisBanner.text}</a>
      <span className="text-xs">{s.crisisBanner.hours}</span>
    </div>
  </div>
}
