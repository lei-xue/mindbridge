import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { pageMetadata, siteOrigin } from "./meta"
export function DocumentMeta() {
  const { pathname } = useLocation()
  useEffect(() => {
    const meta = pageMetadata(pathname)
    document.documentElement.lang = meta.locale
    document.title = meta.title
    const setMeta = (attribute: string, key: string, content: string) => {
      let node = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
      if (!node) { node = document.createElement("meta"); node.setAttribute(attribute, key); document.head.append(node) }
      node.content = content
    }
    setMeta("name", "description", meta.description)
    for (const [key, value] of Object.entries({ title: meta.title, description: meta.description, url: meta.canonical, locale: `${meta.locale}_US` })) setMeta("property", `og:${key}`, value)
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.append(canonical) }
    canonical.href = meta.canonical
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(node => node.remove())
    for (const [language, path] of Object.entries({ ...meta.alternates, "x-default": meta.alternates.en })) {
      const node = document.createElement("link"); node.rel = "alternate"; node.hreflang = language; node.href = siteOrigin + path; document.head.append(node)
    }
    const schema = document.head.querySelector('script[type="application/ld+json"]')
    if (schema) schema.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "MindBridge", url: siteOrigin + (meta.locale === "es" ? "/es" : "/"), inLanguage: meta.locale, description: meta.description })
  }, [pathname])
  return null
}
