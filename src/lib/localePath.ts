// Locale is a property of the URL, never of the browser or of stored state.
// Every helper here is a pure function so the same rules run during SSR,
// during prerendering, and in the browser.
export type Locale = "en" | "es"

export const DEFAULT_LOCALE: Locale = "en"

/** `/es/` and `/es` describe the same page; the router already ignores the extra slash. */
export function normalizePath(pathname: string): string {
  const trimmed = (pathname || "/").replace(/\/+$/, "")
  return trimmed === "" ? "/" : trimmed
}

export function localeFromPath(pathname: string): Locale {
  const path = normalizePath(pathname)
  return path === "/es" || path.startsWith("/es/") ? "es" : "en"
}

/** The locale-independent route path, e.g. `/es/about` -> `/about`. */
export function routePathFromPath(pathname: string): string {
  const path = normalizePath(pathname)
  if (path === "/es") return "/"
  if (path.startsWith("/es/")) return path.slice("/es".length)
  return path
}

/** Builds a URL path for a locale-independent route path. */
export function localizePath(locale: Locale, routePath: string): string {
  const path = normalizePath(routePath.startsWith("/") ? routePath : `/${routePath}`)
  if (locale === "es") return path === "/" ? "/es" : `/es${path}`
  return path
}

export function alternateLocale(locale: Locale): Locale {
  return locale === "es" ? "en" : "es"
}

/** Same page, other language. Used by the header language control. */
export function switchLocalePath(locale: Locale, pathname: string): string {
  return localizePath(alternateLocale(locale), routePathFromPath(pathname))
}

export function localePaths(routePath: string): { en: string; es: string } {
  return { en: localizePath("en", routePath), es: localizePath("es", routePath) }
}

// Search keywords and entered locations never belong in the address bar.
const SENSITIVE_PARAMS = ["q", "query", "keyword", "location", "zip", "city", "address"]

/** Keeps shareable filter state and drops anything that could carry search input. */
export function safeSearch(search: string): string {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
  for (const key of SENSITIVE_PARAMS) params.delete(key)
  const value = params.toString()
  return value ? `?${value}` : ""
}
