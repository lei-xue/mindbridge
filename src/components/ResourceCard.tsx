
import { Link } from "react-router-dom"
import { phoneToTel, smsHref, textToSms } from "../lib/directory"
import { badgeFree, btnCall, btnText, focusRing } from "../lib/ui"
import type { Resource } from "../types"
import { useLocale } from "../i18n/LocaleProvider"
import { callLabel, resourceView, smsLabel } from "../i18n/translate"
export function ResourceCard({ resource, omitSharedContacts = false }: { resource: Resource; omitSharedContacts?: boolean }) {
  const { locale, s, to } = useLocale()
  const copy = resourceView(locale, resource)
  const sms = resource.text ? textToSms(resource.text) : null
  return <article className="flex flex-col gap-3 border-b border-sage-200 bg-white pb-6">
    <div className="flex items-start justify-between gap-2">
      <h3 className="text-lg font-bold text-stone-900">{resource.name}</h3>
      {resource.free && <span className={badgeFree}>{s.common.free}</span>}
    </div>

    <p className="text-sm leading-relaxed text-stone-600">{copy.description}</p>

    <div className="mt-auto flex flex-wrap gap-2 pt-1">
      {resource.phone && !(omitSharedContacts && ['tel:988', 'tel:211'].includes(phoneToTel(resource.phone))) && <a className={btnCall} href={phoneToTel(resource.phone)}>{callLabel(locale, resource)}</a>}
      {sms && !(omitSharedContacts && smsHref(sms) === 'sms:988') && <a className={btnText} href={smsHref(sms)}>{smsLabel(locale, resource.text!)}</a>}
      <Link aria-label={`${s.card.details}: ${resource.name}`} className={`inline-flex min-h-11 items-center rounded px-2 text-sm font-semibold text-teal-800 underline ${focusRing}`} to={to(`/resource/${resource.id}`)}>{s.card.details}</Link>
    </div>

  </article>
}
