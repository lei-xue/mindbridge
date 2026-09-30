import { Link } from "react-router-dom"
import { DATA_LAST_REVIEWED } from "../data/meta"
import { focusRing } from "../lib/ui"
import orange from "../data/orange-provider-sites.json"
import sanDiego from "../data/san-diego-adult-clinics.json"
import butte from "../data/butte-adult-clinics.json"
import { SproutSpeech } from "../components/SproutSpeech"

export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <SproutSpeech pose="bloom"><h1 className="text-2xl font-extrabold text-stone-900 sm:text-3xl">About MindBridge</h1></SproutSpeech>

      <div className="mt-4 space-y-4 leading-relaxed text-stone-700">
        <p>
          MindBridge is a free directory of mental health crisis hotlines and support resources,
          focused on the United States. It exists to help you find the right kind of help quickly —
          whether you're in crisis, supporting someone you care about, or looking for ongoing
          support.
        </p>
        <p>
          Crisis and support resources are free to contact. California in-person listings are incomplete and may not be free or accepting new clients. Confirm eligibility, cost, hours, and appointments directly. Use the filters on the{" "}
          <Link to="/" className={`rounded font-semibold text-teal-800 underline ${focusRing}`}>
            home page
          </Link>{" "}
          to narrow the directory by audience, issue, or category.
        </p>

        <h2 className="pt-2 text-lg font-bold text-stone-900">Who made this</h2>
        <p>MindBridge is an independent project by <a href="https://leixue.dev/" className={`rounded text-teal-800 underline ${focusRing}`}>Lei Xue</a>, built to make public support resources easier to find. It is not operated by 988, a government agency, or a healthcare provider.</p>
        <h2 className="pt-2 text-lg font-bold text-stone-900">Privacy</h2>
        <p>MindBridge does not include advertising trackers, analytics scripts, or app-set cookies. Hosting providers still process normal web requests. Search text is not saved by the app or put into its URL. Live LA searches pass the submitted city or ZIP through Cloudflare to LA County DMH, which may log IP/browser details. Public map links open Google Maps only when clicked. External services have their own privacy policies.</p>
        <h2 className="pt-2 text-lg font-bold text-stone-900">Corrections and source checks</h2>
        <p>Use “Report an issue” on any resource to email a listing correction. Please do not include personal health information. This inbox is not monitored for crisis support. A “Source checked” date means the contact information was checked against an official web page, not that a test call was made or availability is guaranteed. When no date is shown, an individual source-check date has not been recorded; the directory-wide review date is not a substitute.</p>
        <h2 className="pt-2 text-lg font-bold text-stone-900">Where the data comes from</h2>
        <p>
          Listings are compiled from public information published by{" "}
          <a
            href="https://www.samhsa.gov"
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded font-semibold text-teal-800 underline ${focusRing}`}
          >
            SAMHSA
          </a>
          , the{" "}
          <a
            href="https://988lifeline.org"
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded font-semibold text-teal-800 underline ${focusRing}`}
          >
            988 Suicide &amp; Crisis Lifeline
          </a>
          , and each provider's official website. The directory was last reviewed in{" "}
          {DATA_LAST_REVIEWED}. Information may change — always confirm on the provider's official
          site.
        </p>

        <h2 className="pt-2 text-lg font-bold text-stone-900">California data coverage</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>Statewide licensing snapshots: CDPH Sep 1, 2026; DHCS Sep 11, 2026. Includes hospitals and rehabilitation centers, not a complete outpatient directory.</li>
          <li>Orange County Medi-Cal BHP provider-site subset: retrieved {orange.retrievedAt}.</li>
          <li>San Diego County adult outpatient-clinic subset (18+): retrieved {sanDiego.retrievedAt}.</li>
          <li>Butte County adult outpatient-center subset (18+): retrieved {butte.retrievedAt}.</li>
          <li>LA County DMH: live directory search, with location transfer disclosed before submission.</li>
          <li>All 58 counties: DHCS Medi-Cal mental-health plan contacts, not full provider directories.</li>
        </ul>
        <p className="text-sm">Snapshot dates are not a guarantee of current availability. Source links are included with search results.</p>
        <h2 className="pt-2 text-lg font-bold text-stone-900">Location privacy</h2>
        <p className="text-sm">Manual county selection is always available. Device location is optional and requested only after you click. Coordinates are matched to simplified Census county boundaries in your browser, not sent to MindBridge or saved. Your browser's location service may use its own provider. Near boundaries or with poor accuracy, choose a county manually. This is not a nearest-clinic search.</p>

        <h2 className="pt-2 text-lg font-bold text-stone-900">Important</h2>
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-stone-800">
          MindBridge is an information directory, not medical advice. It is <strong>not a substitute for professional
          care</strong> and it is <strong>not for emergencies</strong>. If you or someone else is in
          immediate danger, call <a href="tel:911" className={`rounded font-bold underline ${focusRing}`}>911</a>.
          For crisis support, call or text{" "}
          <a href="tel:988" className={`rounded font-bold underline ${focusRing}`}>988</a> (Suicide
          &amp; Crisis Lifeline, 24/7, free).
        </p>
      </div>
    </div>
  )
}
