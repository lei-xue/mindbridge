import { Link } from "react-router-dom"
import { useLocale } from "../i18n/LocaleProvider"
import { DATA_LAST_REVIEWED } from "../data/meta"
import { focusRing } from "../lib/ui"
import orange from "../data/orange-provider-sites.json"
import sanDiego from "../data/san-diego-adult-clinics.json"
import butte from "../data/butte-adult-clinics.json"
import primaryCare from "../data/california-primary-care.json"
import { SproutSpeech } from "../components/SproutSpeech"

export function AboutPage() {
  const { s, to } = useLocale()
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <SproutSpeech pose="bloom"><h1 className="text-2xl font-extrabold text-stone-900 sm:text-3xl">{s.about.heading}</h1></SproutSpeech>

      <div className="mt-4 space-y-4 leading-relaxed text-stone-700">
        <p>
          {s.about.intro}
        </p>
        <p>
          {s.about.intro2Lead}
          <Link to={to("/")} className={`rounded font-semibold text-teal-800 underline ${focusRing}`}>
            {s.about.intro2Link}
          </Link>
          {s.about.intro2Tail}
        </p>

        <h2 className="pt-2 text-lg font-bold text-stone-900">{s.about.whoHeading}</h2>
        <p>{s.about.whoLead}<a href="https://leixue.dev/" className={`rounded text-teal-800 underline ${focusRing}`}>{s.about.whoLink}</a>{s.about.whoTail}</p>
        <h2 className="pt-2 text-lg font-bold text-stone-900">{s.about.privacyHeading}</h2>
        <p>{s.about.privacyLead}<a href="https://developers.cloudflare.com/web-analytics/" target="_blank" rel="noopener noreferrer" className={`rounded text-teal-800 underline ${focusRing}`}>{s.about.privacyLink}</a>{s.about.privacyTail}</p>
        <h2 className="pt-2 text-lg font-bold text-stone-900">{s.about.correctionsHeading}</h2>
        <p>{s.about.corrections}</p>
        <h2 className="pt-2 text-lg font-bold text-stone-900">{s.about.sourcesHeading}</h2>
        <p>
          {s.about.sourcesLead}
          <a
            href="https://www.samhsa.gov"
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded font-semibold text-teal-800 underline ${focusRing}`}
          >
            {s.about.sourcesSamhsa}
          </a>
          {s.about.sourcesJoin}
          <a
            href="https://988lifeline.org"
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded font-semibold text-teal-800 underline ${focusRing}`}
          >
            {s.about.sourcesLifeline}
          </a>
          {s.about.sourcesTail}
          {DATA_LAST_REVIEWED}
          {s.about.sourcesEnd}
        </p>

        <h2 className="pt-2 text-lg font-bold text-stone-900">{s.about.coverageHeading}</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>{s.about.coveragePrimaryCare(primaryCare.clinicCount, primaryCare.countyCount, primaryCare.retrievedAt)} <a href={primaryCare.source} target="_blank" rel="noopener noreferrer" className={`rounded text-teal-800 underline ${focusRing}`}>HCAI</a></li>
          <li>{s.about.coverageLicensing}</li>
          <li>{s.about.coverageOrange(orange.retrievedAt)}</li>
          <li>{s.about.coverageSanDiego(sanDiego.retrievedAt)}</li>
          <li>{s.about.coverageButte(butte.retrievedAt)}</li>
          <li>{s.about.coverageLa}</li>
          <li>{s.about.coverageCounties}</li>
        </ul>
        <p className="text-sm">{s.about.coverageNote}</p>
        <h2 className="pt-2 text-lg font-bold text-stone-900">{s.about.locationHeading}</h2>
        <p className="text-sm">{s.about.location}</p>

        <h2 className="pt-2 text-lg font-bold text-stone-900">{s.about.importantHeading}</h2>
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-stone-800">
          {s.about.importantLead}<strong>{s.about.importantCare}</strong>{s.about.importantMid}<strong>{s.about.importantEmergency}</strong>{s.about.importantAfterEmergency}<a href="tel:911" className={`rounded font-bold underline ${focusRing}`}>911</a>{s.about.importantAfter911}
          <a href="tel:988" className={`rounded font-bold underline ${focusRing}`}>988</a>{s.about.importantAfter988}
        </p>
      </div>
    </div>
  )
}
