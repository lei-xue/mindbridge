import { ResourceReview } from "./ResourceReview"
import { Link } from "react-router-dom"
import { phoneToTel, smsHref, textToSms } from "../lib/directory"
import { badgeFree, btnCall, btnSecondary, btnText, chip, focusRing } from "../lib/ui"
import type { Resource } from "../types"
import { useLocale } from "../i18n/LocaleProvider"
import { callLabel, resourceView, smsLabel } from "../i18n/translate"
export function ResourceCard({ resource }: { resource: Resource }) {
  const { locale, s, t, to } = useLocale()
  const copy = resourceView(locale, resource)
  const sms = resource.text ? textToSms(resource.text) : null
  return <article className="flex flex-col gap-3 rounded-xl border border-sage-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <h3 className="text-lg font-bold text-stone-900"><Link to={to(`/resource/${resource.id}`)} className={`rounded hover:text-teal-800 hover:underline ${focusRing}`}>{resource.name}</Link></h3>
      {resource.free && <span className={badgeFree}>{s.common.free}</span>}
    </div>
    <p><span className={chip}>{t(resource.category)}</span></p>
    <p className="text-sm leading-relaxed text-stone-600">{copy.description}</p>
    <p className="text-sm text-stone-600"><span className="font-semibold text-stone-700">{s.card.hours}</span> {copy.hours}</p>
    <ul className="flex flex-wrap gap-1.5" aria-label={s.card.relatedIssues}>{resource.tags.map(tag => <li key={tag} className={chip}>{t(tag)}</li>)}</ul>
    <div className="mt-auto flex flex-wrap gap-2 pt-1">
      {resource.phone && <a className={btnCall} href={phoneToTel(resource.phone)}>{callLabel(locale, resource)}</a>}
      {sms && <a className={btnText} href={smsHref(sms)}>{smsLabel(locale, resource.text!)}</a>}
      <Link className={btnSecondary} to={to(`/resource/${resource.id}`)}>{s.card.details}</Link>
    </div>
    <ResourceReview id={resource.id} name={resource.name} />
  </article>
}
