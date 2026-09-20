import { Link, useParams } from "react-router-dom"
import { DATA_LAST_REVIEWED } from "../data/meta"
import { getResourceById, phoneToTel, smsHref, textToSms } from "../lib/directory"
import { badgeFree, btnCall, btnSecondary, btnText, chip, focusRing } from "../lib/ui"

export function ResourceDetailPage() {
  const { id } = useParams()
  const resource = id ? getResourceById(id) : undefined

  if (!resource) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-stone-900">Resource not found</h1>
        <p className="mt-3 text-stone-700">
          The resource you're looking for doesn't exist.{" "}
          <Link to="/" className={`rounded font-semibold text-teal-800 underline ${focusRing}`}>
            Back to all resources
          </Link>
        </p>
      </div>
    )
  }

  const sms = resource.text ? textToSms(resource.text) : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p>
        <Link
          to="/"
          className={`rounded text-sm font-semibold text-teal-800 underline ${focusRing}`}
        >
          ← All resources
        </Link>
      </p>

      <article className="mt-4 rounded-xl border border-sage-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-stone-900 sm:text-3xl">{resource.name}</h1>
            <p className="mt-2">
              <span className={chip}>{resource.category}</span>{" "}
              <span className={chip}>{resource.region}</span>{" "}
              {resource.free && <span className={badgeFree}>FREE</span>}
            </p>
          </div>
        </div>

        <p className="mt-4 leading-relaxed text-stone-700">{resource.description}</p>

        <dl className="mt-5 space-y-2 rounded-lg bg-sage-50 p-4 text-sm text-stone-700">
          <div className="flex gap-2">
            <dt className="font-semibold text-stone-800">Hours:</dt>
            <dd>{resource.hours}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold text-stone-800">Region:</dt>
            <dd>{resource.region}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {resource.phone && (
            <a className={btnCall} href={phoneToTel(resource.phone)}>
              Call {resource.phone}
            </a>
          )}
          {sms && (
            <a className={btnText} href={smsHref(sms)}>
              {resource.text}
            </a>
          )}
          <a
            className={btnSecondary}
            href={resource.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit official website
          </a>
        </div>

        <section aria-labelledby="detail-audience" className="mt-8">
          <h2 id="detail-audience" className="text-sm font-bold uppercase tracking-wide text-stone-500">
            Who it's for
          </h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {resource.audience.map((a) => (
              <li key={a} className={chip}>
                {a}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="detail-issues" className="mt-5">
          <h2 id="detail-issues" className="text-sm font-bold uppercase tracking-wide text-stone-500">
            Issues covered
          </h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {resource.issues.map((issue) => (
              <li key={issue} className={chip}>
                {issue}
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-8 border-t border-sage-200 pt-4 text-sm text-stone-600">
          Information last reviewed {DATA_LAST_REVIEWED}. Information may change — always confirm on
          the provider's official site. If you or someone else is in immediate danger, call 911.
        </p>
      </article>
    </div>
  )
}
