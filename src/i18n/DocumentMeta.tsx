import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { pageMetadata, siteSchema, siteOrigin } from "./meta"

type MetaAttribute = "name" | "property"

/**
 * Upserts a single managed meta tag and removes any duplicates, so client-side
 * route changes never leave stale or repeated tags behind.
 */
function setMeta(attribute: MetaAttribute, key: string, content: string) {
  const nodes = document.head.querySelectorAll<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  let node = nodes[0]
  if (!node) {
    node = document.createElement("meta")
    node.setAttribute(attribute, key)
    document.head.append(node)
  }
  nodes.forEach((existing, index) => { if (index > 0) existing.remove() })
  node.content = content
}

export function DocumentMeta() {
  const { pathname } = useLocation()
  useEffect(() => {
    const meta = pageMetadata(pathname)
    document.documentElement.lang = meta.locale
    document.title = meta.title

    setMeta("name", "description", meta.description)
    setMeta("name", "theme-color", meta.themeColor)

    setMeta("property", "og:type", meta.ogType)
    setMeta("property", "og:site_name", meta.siteName)
    setMeta("property", "og:title", meta.title)
    setMeta("property", "og:description", meta.description)
    setMeta("property", "og:url", meta.canonical)
    setMeta("property", "og:locale", `${meta.locale}_US`)
    setMeta("property", "og:locale:alternate", meta.localeAlternate)
    setMeta("property", "og:image", meta.image)
    setMeta("property", "og:image:type", meta.imageType)
    setMeta("property", "og:image:width", String(meta.imageWidth))
    setMeta("property", "og:image:height", String(meta.imageHeight))
    setMeta("property", "og:image:alt", meta.imageAlt)

    setMeta("name", "twitter:card", meta.twitterCard)
    setMeta("name", "twitter:title", meta.title)
    setMeta("name", "twitter:description", meta.description)
    setMeta("name", "twitter:image", meta.image)
    setMeta("name", "twitter:image:alt", meta.imageAlt)

    const canonicalNodes = document.head.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]')
    let canonical = canonicalNodes[0]
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.append(canonical) }
    canonicalNodes.forEach((node, index) => { if (index > 0) node.remove() })
    canonical.href = meta.canonical

    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(node => node.remove())
    for (const [language, path] of Object.entries({ ...meta.alternates, "x-default": meta.alternates.en })) {
      const node = document.createElement("link")
      node.rel = "alternate"
      node.hreflang = language
      node.href = siteOrigin + path
      document.head.append(node)
    }

    const schemaNodes = document.head.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')
    let schema = schemaNodes[0]
    if (!schema) { schema = document.createElement("script"); schema.type = "application/ld+json"; document.head.append(schema) }
    schemaNodes.forEach((node, index) => { if (index > 0) node.remove() })
    schema.textContent = JSON.stringify(siteSchema(meta))
  }, [pathname])
  return null
}
