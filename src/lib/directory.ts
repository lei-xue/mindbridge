import resourcesJson from "../data/resources.json"
import type { Resource } from "../types"

export const RESOURCES: Resource[] = resourcesJson

export const CRISIS_ENTRY_IDS = ["988-lifeline", "crisis-text-line", "trevor-project"]

export type Filters = {
  q: string
  audience: string
  issue: string
  category: string
  region: string
}

function uniqSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

export const AUDIENCE_OPTIONS = uniqSorted(RESOURCES.flatMap((r) => r.audience))
export const ISSUE_OPTIONS = uniqSorted(RESOURCES.flatMap((r) => [...r.issues, ...r.tags]))
export const CATEGORY_OPTIONS = uniqSorted(RESOURCES.map((r) => r.category))
export const REGION_OPTIONS = uniqSorted(RESOURCES.map((r) => r.region))

export function getResourceById(id: string): Resource | undefined {
  return RESOURCES.find((r) => r.id === id)
}

export function getResourcesByIds(ids: string[]): Resource[] {
  return ids
    .map((id) => getResourceById(id))
    .filter((r): r is Resource => r !== undefined)
}

export function filterResources(filters: Filters): Resource[] {
  const q = filters.q.trim().toLowerCase()
  return RESOURCES.filter((r) => {
    if (filters.audience && !r.audience.includes(filters.audience)) return false
    if (filters.issue && !r.issues.includes(filters.issue) && !r.tags.includes(filters.issue)) {
      return false
    }
    if (filters.category && r.category !== filters.category) return false
    if (filters.region && r.region !== filters.region) return false
    if (q && !`${r.name} ${r.description}`.toLowerCase().includes(q)) return false
    return true
  })
}

export function phoneToTel(phone: string): string {
  const numericRun = /^[0-9][0-9\-.\s()]*/.exec(phone)
  const digits = (numericRun ? numericRun[0] : phone).replace(/[^0-9]/g, "")
  return `tel:${digits}`
}

export type SmsLink = { to: string; body: string | null }

export function textToSms(text: string): SmsLink | null {
  const keywordMatch = /^Text\s+(.+?)\s+to\s+(\S+)$/.exec(text)
  if (keywordMatch) {
    return { to: keywordMatch[2].replace(/[^0-9]/g, ""), body: keywordMatch[1] }
  }
  const numberMatch = /^Text\s+(\S+)$/.exec(text)
  if (numberMatch) {
    return { to: numberMatch[1].replace(/[^0-9]/g, ""), body: null }
  }
  return null
}

export function smsHref(sms: SmsLink): string {
  return sms.body ? `sms:${sms.to}?body=${encodeURIComponent(sms.body)}` : `sms:${sms.to}`
}
