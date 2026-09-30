import { ResourceReview } from "./ResourceReview"
import { phoneToTel, smsHref, textToSms } from "../lib/directory"
import { btnCall, btnText, chip } from "../lib/ui"
import type { Resource } from "../types"
import { useLocale } from "../i18n/LocaleProvider"
import { callLabel, resourceView, smsLabel } from "../i18n/translate"
export function CrisisResourceCard({ resource }: { resource: Resource }) {
  const { locale } = useLocale()
  const copy = resourceView(locale, resource)
  const sms = resource.text ? textToSms(resource.text) : null
  return <article className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-2"><h3 className="text-lg font-bold text-stone-900">{resource.name}</h3><span className={chip}>{copy.hours}</span></div>
    <p className="text-sm leading-relaxed text-stone-600">{copy.description}</p>
    <div className="mt-auto flex flex-col gap-2">
      {resource.phone && <a className={btnCall} href={phoneToTel(resource.phone)}>{callLabel(locale, resource)}</a>}
      {sms && <a className={btnText} href={smsHref(sms)}>{smsLabel(locale, resource.text!)}</a>}
    </div>
    <ResourceReview id={resource.id} name={resource.name} />
  </article>
}
