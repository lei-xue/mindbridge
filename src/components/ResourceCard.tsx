import { Link } from "react-router-dom"
import { phoneToTel, smsHref, textToSms } from "../lib/directory"
import { badgeFree, btnCall, btnSecondary, btnText, chip, focusRing } from "../lib/ui"
import type { Resource } from "../types"

export function ResourceCard({ resource }: { resource: Resource }) {
  const sms = resource.text ? textToSms(resource.text) : null

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-sage-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold text-stone-900">
          <Link
            to={`/resource/${resource.id}`}
            className={`rounded hover:text-teal-800 hover:underline ${focusRing}`}
          >
            {resource.name}
          </Link>
        </h3>
        {resource.free && <span className={badgeFree}>FREE</span>}
      </div>
      <p>
        <span className={chip}>{resource.category}</span>
      </p>
      <p className="text-sm leading-relaxed text-stone-600">{resource.description}</p>
      <p className="text-sm text-stone-600">
        <span className="font-semibold text-stone-700">Hours:</span> {resource.hours}
      </p>
      <ul className="flex flex-wrap gap-1.5" aria-label="Related issues">
        {resource.tags.map((tag) => (
          <li key={tag} className={chip}>
            {tag}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
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
        <Link className={btnSecondary} to={`/resource/${resource.id}`}>
          Details
        </Link>
      </div>
    </article>
  )
}
