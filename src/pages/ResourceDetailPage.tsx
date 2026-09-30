import { ResourceReview } from "../components/ResourceReview"
import { Link, useParams } from "react-router-dom"
import { useLocale } from "../i18n/LocaleProvider"
import { callLabel, resourceView, smsLabel } from "../i18n/translate"
import { getResourceById, phoneToTel, smsHref, textToSms } from "../lib/directory"
import { badgeFree, btnCall, btnSecondary, btnText, chip, focusRing } from "../lib/ui"

export function ResourceDetailPage() {
  const { id } = useParams()
  const { locale, s, to, t } = useLocale()
  const resource = id ? getResourceById(id) : undefined

  if (!resource) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-stone-900">{s.detail.notFoundHeading}</h1>
        <p className="mt-3 text-stone-700">
          {s.detail.notFoundBody}{" "}
          <Link to={to("/")} className={`rounded font-semibold text-teal-800 underline ${focusRing}`}>
            {s.detail.backToAll}
          </Link>
        </p>
      </div>
    )
  }

  // Original phone/text feed the href parsers; only the visible labels are localized.
  const view = resourceView(locale, resource)
  const smsText = resource.text
  const sms = smsText ? textToSms(smsText) : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p>
        <Link
          to={to("/")}
          className={`rounded text-sm font-semibold text-teal-800 underline ${focusRing}`}
        >
          {s.detail.allResources}
        </Link>
      </p>

      <article className="mt-4 rounded-xl border border-sage-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-stone-900 sm:text-3xl">{resource.name}</h1>
            <p className="mt-2">
              <span className={chip}>{t(resource.category)}</span>{" "}
              <span className={chip}>{t(resource.region)}</span>{" "}
              {resource.free && <span className={badgeFree}>{s.common.free}</span>}
            </p>
          </div>
        </div>

        <p className="mt-4 leading-relaxed text-stone-700">{view.description}</p>

        <dl className="mt-5 space-y-2 rounded-lg bg-sage-50 p-4 text-sm text-stone-700">
          <div className="flex gap-2">
            <dt className="font-semibold text-stone-800">{s.detail.hours}</dt>
            <dd>{view.hours}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold text-stone-800">{s.detail.region}</dt>
            <dd>{t(resource.region)}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {resource.phone && (
            <a className={btnCall} href={phoneToTel(resource.phone)}>
              {callLabel(locale, resource)}
            </a>
          )}
          {sms && smsText && (
            <a className={btnText} href={smsHref(sms)}>
              {smsLabel(locale, smsText)}
            </a>
          )}
          <a
            className={btnSecondary}
            href={resource.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            {s.detail.visitSite}
          </a>
        </div>

        <section aria-labelledby="detail-audience" className="mt-8">
          <h2 id="detail-audience" className="text-sm font-bold uppercase tracking-wide text-stone-500">
            {s.detail.whoFor}
          </h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {resource.audience.map((a) => (
              <li key={a} className={chip}>
                {t(a)}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="detail-issues" className="mt-5">
          <h2 id="detail-issues" className="text-sm font-bold uppercase tracking-wide text-stone-500">
            {s.detail.issues}
          </h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {resource.issues.map((issue) => (
              <li key={issue} className={chip}>
                {t(issue)}
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-8 border-t border-sage-200 pt-4 text-sm text-stone-600">
          {s.detail.reviewNote}
        </p>
        <ResourceReview id={resource.id} name={resource.name} />
      </article>
    </div>
  )
}
