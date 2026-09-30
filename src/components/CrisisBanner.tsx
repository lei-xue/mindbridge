import { focusRing } from "../lib/ui"

export function CrisisBanner() {
  return (
    <div role="region" aria-label="Crisis support" className="sticky top-0 z-50 border-b border-amber-300 bg-amber-100">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-2 px-4 py-1 text-sm text-amber-950 sm:text-base">
        <span>In crisis?</span>
        <a href="tel:988" className={`inline-flex min-h-11 items-center rounded px-2 font-extrabold underline underline-offset-2 ${focusRing}`}>Call 988</a>
        <a href="sms:988" className={`inline-flex min-h-11 items-center rounded px-2 font-extrabold underline underline-offset-2 ${focusRing}`}>Text 988</a>
        <span className="text-xs">24/7 · Free</span>
      </div>
    </div>
  )
}
