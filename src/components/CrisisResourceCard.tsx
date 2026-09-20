import { phoneToTel, smsHref, textToSms } from "../lib/directory"
import { btnCall, btnText, chip } from "../lib/ui"
import type { Resource } from "../types"

export function CrisisResourceCard({ resource }: { resource: Resource }) {
  const sms = resource.text ? textToSms(resource.text) : null

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold text-stone-900">{resource.name}</h3>
        <span className={chip}>{resource.hours}</span>
      </div>
      <p className="text-sm leading-relaxed text-stone-600">{resource.description}</p>
      <div className="mt-auto flex flex-col gap-2">
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
      </div>
    </article>
  )
}
