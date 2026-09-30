import { Link } from "react-router-dom"
import { Fragment } from "react"
import type { Resource } from "../types"
import { phoneToTel, smsHref, textToSms } from "../lib/directory"
import { focusRing } from "../lib/ui"
import { useLocale } from "../i18n/LocaleProvider"
import { callLabel, resourceView, smsLabel } from "../i18n/translate"
import { DirectoryTable } from "./DirectoryTable"

export function ResourceTable({ resources }: { resources: Resource[] }) {
  const { locale, s, t, to } = useLocale()
  const linkClass = `inline-flex min-h-11 items-center rounded text-teal-800 underline ${focusRing}`
  return <DirectoryTable label={s.home.directoryHeading} kind="resource" columns={[
    { key: "name", label: s.table.name }, { key: "service", label: s.table.type },
    { key: "contact", label: s.table.contact }, { key: "details", label: s.card.details },
  ]} rows={resources.map(resource => {
    const copy = resourceView(locale, resource)
    const sms = resource.text ? textToSms(resource.text) : null
    return { id: resource.id, cells: [
      <Fragment key="name"><h3 className="text-sm font-semibold">{resource.name}</h3><p className="mt-1 text-xs font-normal text-stone-600">{t(resource.region)}{resource.free ? ` · ${s.common.free}` : ""}</p></Fragment>,
      <Fragment key="service"><p className="font-medium">{t(resource.category)}</p><p className="mt-1 min-w-64 max-w-md text-stone-600">{copy.description}</p><p className="mt-1 text-xs text-stone-600">{resource.audience.map(t).join(" · ")}; {resource.issues.map(t).join(" · ")}</p><p className="mt-1 text-xs text-stone-600">{s.common.hoursLabel} {copy.hours}</p></Fragment>,
      <div key="contact" className="min-w-36">{resource.phone && !['tel:988', 'tel:211'].includes(phoneToTel(resource.phone)) && <a className={linkClass} href={phoneToTel(resource.phone)}>{callLabel(locale, resource)}</a>}{sms && smsHref(sms) !== 'sms:988' && <a className={linkClass} href={smsHref(sms)}>{smsLabel(locale, resource.text!)}</a>}{resource.phone && ['tel:988', 'tel:211'].includes(phoneToTel(resource.phone)) && <p className="py-2">{resource.phone}</p>}{!resource.phone && !sms && <span>—</span>}</div>,
      <Link key="details" aria-label={`${s.card.details}: ${resource.name}`} className={linkClass} to={to(`/resource/${resource.id}`)}>{s.card.details}</Link>,
    ] }
  })} />
}
