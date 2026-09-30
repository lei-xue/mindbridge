import checks from "../data/resource-checks.json"
import { focusRing } from "../lib/ui"

export function ResourceReview({ id, name }: { id: string; name: string }) {
  const check = checks[id as keyof typeof checks]
  const report = `mailto:hi@leixue.dev?subject=${encodeURIComponent(`MindBridge listing issue: ${name}`)}&body=${encodeURIComponent(`Listing: ${name}\nWhat seems incorrect or unavailable:\n\nPlease do not include personal health information or your location. This inbox is not monitored for crisis support; call or text 988 if you need help now.`)}`
  return <div className="text-xs text-stone-600">
    {check && <span>Source checked <time dateTime={check.checkedOn}>{check.checkedOn}</time>. </span>}
    <a href={report} aria-label={`Report an issue with ${name}`} className={`inline-flex min-h-11 items-center rounded text-teal-800 underline ${focusRing}`}>Report an issue</a>
  </div>
}
