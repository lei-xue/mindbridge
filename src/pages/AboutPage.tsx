import { Link } from "react-router-dom"
import { DATA_LAST_REVIEWED } from "../data/meta"
import { focusRing } from "../lib/ui"

export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-extrabold text-stone-900 sm:text-3xl">About MindBridge</h1>

      <div className="mt-4 space-y-4 leading-relaxed text-stone-700">
        <p>
          MindBridge is a free directory of mental health crisis hotlines and support resources,
          focused on the United States. It exists to help you find the right kind of help quickly —
          whether you're in crisis, supporting someone you care about, or looking for ongoing
          support.
        </p>
        <p>
          Every resource listed is free to use, and every listing shows its hours and how to
          connect: by phone, by text, or through the provider's official website. Use the filters on
          the{" "}
          <Link to="/" className={`rounded font-semibold text-teal-800 underline ${focusRing}`}>
            home page
          </Link>{" "}
          to narrow the directory by audience, issue, or category.
        </p>

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

        <h2 className="pt-2 text-lg font-bold text-stone-900">Important</h2>
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-stone-800">
          MindBridge is an information directory. It is <strong>not a substitute for professional
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
