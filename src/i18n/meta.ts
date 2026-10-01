import { localeFromPath, localePaths, routePathFromPath, normalizePath, type Locale } from "../lib/localePath"
import resources from "../data/resources.json"
import spanish from "../data/resources-es.json"

export const siteOrigin = "https://mindbridge.leixue.dev"
export const siteName = "MindBridge"
// Brand colour from the existing favicon/sprout, not a third-party palette.
export const themeColor = "#506a56"
export const socialImageWidth = 1200
export const socialImageHeight = 630

/**
 * Social cards are original project PNGs generated from our own brand markup
 * (scripts/build-social-images.mjs). One localized card per locale, 1200x630.
 */
export function socialImagePath(locale: Locale) {
  return `/social/mindbridge-${locale}-1200x630.png`
}

const socialImageAlts: Record<Locale, string> = {
  en: "MindBridge card: a free directory of US mental health crisis lines and support resources, with 988 call and text options. A directory, not a medical provider.",
  es: "Tarjeta de MindBridge: un directorio gratuito de líneas de crisis y recursos de salud mental en EE. UU., con opciones de llamada y mensaje de texto al 988. Es un directorio, no un proveedor médico.",
}

// Site-level descriptions. "Free and confidential" is attributed to the crisis
// lines (988 et al.), never to every provider listed in the directory, and the
// directory is always described as a listing, not a medical provider.
const siteDescriptions: Record<Locale, { home: string; about: string }> = {
  en: {
    home: "MindBridge is a free, independent directory of US mental health crisis lines and support resources. Crisis lines such as 988 offer free, confidential help 24/7. A directory, not a medical provider.",
    about: "About MindBridge: an independent, free directory of US mental health crisis lines and support resources — where the data comes from, how privacy works, and how to report a correction. Not a medical provider.",
  },
  es: {
    home: "MindBridge es un directorio gratuito e independiente de líneas de crisis y recursos de salud mental en EE. UU. Líneas como el 988 ofrecen ayuda gratuita y confidencial, 24/7. Es un directorio, no un proveedor médico.",
    about: "Acerca de MindBridge: un directorio gratuito e independiente de líneas de crisis y recursos de salud mental en EE. UU. — de dónde vienen los datos, cómo se protege la privacidad y cómo reportar una corrección. No es un proveedor médico.",
  },
}

export function pageMetadata(pathname: string) {
  const path = normalizePath(pathname)
  const locale = localeFromPath(path)
  const route = routePathFromPath(path)
  const resource = resources.find(r => route === `/resource/${r.id}`)
  const title = resource ? `${resource.name} — ${siteName}` : route === "/about" ? (locale === "es" ? `Acerca de ${siteName} — Fuentes, privacidad y seguridad` : `About ${siteName} — Sources, Privacy & Safety`) : locale === "es" ? `${siteName} — Encuentra ayuda de salud mental, rápido` : `${siteName} — Find Mental Health Help, Fast`
  const description = resource ? (locale === "es" ? spanish[resource.id as keyof typeof spanish].description : resource.description) : siteDescriptions[locale][route === "/about" ? "about" : "home"]
  return {
    locale,
    title,
    description,
    canonical: siteOrigin + path,
    alternates: localePaths(route),
    ogType: "website",
    siteName,
    localeAlternate: `${locale === "es" ? "en" : "es"}_US`,
    image: siteOrigin + socialImagePath(locale),
    imageAlt: socialImageAlts[locale],
    imageWidth: socialImageWidth,
    imageHeight: socialImageHeight,
    imageType: "image/png",
    // A 1200x630 card is the large format; keep the card type honest.
    twitterCard: "summary_large_image",
    themeColor,
  }
}

/**
 * One truthful site-level JSON-LD entity. It declares what MindBridge is
 * (a website/directory) and never invents ratings, medical entities or offers.
 */
export function siteSchema(meta: { locale: Locale; description: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteOrigin + (meta.locale === "es" ? "/es" : "/"),
    inLanguage: meta.locale,
    description: meta.description,
  }
}
