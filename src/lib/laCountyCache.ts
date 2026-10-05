import type { DirectoryResult, SearchType } from "../components/LaCountyDirectorySearch"

export type LaCachedResponse = {
  results: DirectoryResult[]
  hasMore: boolean
  fetchedAt: number
  cacheHit: boolean
}

type Loader = (searchType: SearchType, value: string, signal: AbortSignal) => Promise<unknown> | unknown

type CacheOptions = {
  endpoint: string
  load: Loader
  now?: () => number
  ttlMs?: number
  maxEntries?: number
}

const DEFAULT_TTL_MS = 300_000
const DEFAULT_MAX_ENTRIES = 20

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string")

function isValidResult(value: unknown): value is DirectoryResult {
  if (!isRecord(value)) return false
  if (typeof value.id !== "string" || value.id.length === 0) return false
  if (typeof value.name !== "string" || value.name.length === 0) return false
  const address = value.address
  if (!isRecord(address)) return false
  if (!isStringArray(address.lines)) return false
  if (typeof address.city !== "string" || typeof address.state !== "string" || typeof address.postalCode !== "string") return false
  if (!isStringArray(value.phones)) return false
  if (!Array.isArray(value.websites) || !value.websites.every((item) => isRecord(item) && typeof item.label === "string" && typeof item.url === "string")) return false
  if (!Array.isArray(value.hours) || !value.hours.every((item) =>
    isRecord(item) && isStringArray(item.days) &&
    (item.opens === null || typeof item.opens === "string") &&
    (item.closes === null || typeof item.closes === "string"))) return false
  if (!isStringArray(value.languages) || !isStringArray(value.populations) || !isStringArray(value.accessibility)) return false
  if (value.lastUpdated !== null && typeof value.lastUpdated !== "string") return false
  return true
}

function isValidPayload(value: unknown): value is { results: DirectoryResult[]; hasMore?: boolean } {
  if (!isRecord(value)) return false
  if ("error" in value) return false
  if (!Array.isArray(value.results)) return false
  if ("hasMore" in value && typeof value.hasMore !== "boolean") return false
  return value.results.every(isValidResult)
}

const deepCopy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export function createLaCountyCache({ endpoint, load, now = () => Date.now(), ttlMs = DEFAULT_TTL_MS, maxEntries = DEFAULT_MAX_ENTRIES }: CacheOptions) {
  type Entry = { fetchedAt: number; results: DirectoryResult[]; hasMore: boolean; timer: ReturnType<typeof setTimeout> }
  const entries = new Map<string, Entry>()

  const remove = (key: string) => {
    const entry = entries.get(key)
    if (entry) clearTimeout(entry.timer)
    entries.delete(key)
  }

  const read = (key: string, at: number): Entry | null => {
    const entry = entries.get(key)
    if (!entry) return null
    if (!(entry.fetchedAt <= at) || at - entry.fetchedAt >= ttlMs) {
      remove(key)
      return null
    }
    entries.delete(key)
    entries.set(key, entry)
    return entry
  }

  return {
    async search(searchType: SearchType, value: string, signal: AbortSignal, force = false): Promise<LaCachedResponse> {
      const key = JSON.stringify([endpoint, searchType, value])
      const hitAt = now()
      if (signal.aborted) throw signal.reason ?? new DOMException("The operation was aborted.", "AbortError")
      if (!force) {
        const hit = read(key, hitAt)
        if (hit) return { results: deepCopy(hit.results), hasMore: hit.hasMore, fetchedAt: hit.fetchedAt, cacheHit: true }
      }
      const payload = await load(searchType, value, signal)
      if (signal.aborted) throw signal.reason ?? new DOMException("The operation was aborted.", "AbortError")
      if (!isValidPayload(payload)) throw new Error("The directory returned an unexpected response.")
      const timer = setTimeout(() => { entries.delete(key) }, ttlMs) as ReturnType<typeof setTimeout> & { unref?: () => void }
      if (typeof timer.unref === "function") timer.unref()
      const entry: Entry = {
        fetchedAt: now(),
        results: deepCopy(payload.results),
        hasMore: payload.hasMore === true,
        timer,
      }
      remove(key)
      entries.set(key, entry)
      while (entries.size > maxEntries) {
        const oldest = entries.keys().next().value as string
        remove(oldest)
      }
      return { results: deepCopy(entry.results), hasMore: entry.hasMore, fetchedAt: entry.fetchedAt, cacheHit: false }
    },
    clear(): void {
      for (const entry of entries.values()) clearTimeout(entry.timer)
      entries.clear()
    },
  }
}
