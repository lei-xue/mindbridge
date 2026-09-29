import type { DirectoryResult, SearchType } from "../components/LaCountyDirectorySearch"

type SearchResponse = { results: DirectoryResult[]; hasMore?: boolean; error?: string }
const API_URL = import.meta.env.VITE_LA_COUNTY_API_URL?.trim() || "/api/la-county/locations"

export async function searchLaCounty(searchType: SearchType, value: string, signal: AbortSignal): Promise<SearchResponse> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ searchType, value }),
    signal,
  })
  const payload = await response.json().catch(() => null) as SearchResponse | null
  if (!response.ok) throw new Error(payload?.error || "The directory search is temporarily unavailable.")
  if (!payload || !Array.isArray(payload.results)) throw new Error("The directory returned an unexpected response.")
  return payload
}
