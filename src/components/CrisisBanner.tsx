import { focusRing } from "../lib/ui"

export function CrisisBanner() {
  return (
    <div
      role="region"
      aria-label="Crisis support"
      className="sticky top-0 z-50 border-b border-amber-300 bg-amber-100"
    >
      <p className="mx-auto max-w-5xl px-4 py-2.5 text-center text-sm text-amber-950 sm:text-base">
        In crisis? Call or text{" "}
        <a
          href="tel:988"
          className={`rounded font-extrabold underline underline-offset-2 hover:text-amber-700 ${focusRing}`}
        >
          988
        </a>{" "}
        now (Suicide &amp; Crisis Lifeline, 24/7, free)
      </p>
    </div>
  )
}
