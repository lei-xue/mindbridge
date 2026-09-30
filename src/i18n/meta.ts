import { localeFromPath, localePaths, routePathFromPath, normalizePath } from "../lib/localePath"
import resources from "../data/resources.json"
import spanish from "../data/resources-es.json"
export const siteOrigin = "https://mindbridge.leixue.dev"
export function pageMetadata(pathname: string) {
  const path = normalizePath(pathname)
  const locale = localeFromPath(path)
  const route = routePathFromPath(path)
  const resource = resources.find(r => route === `/resource/${r.id}`)
  const title = resource ? `${resource.name} — MindBridge` : route === "/about" ? (locale === "es" ? "Acerca de MindBridge — Fuentes, privacidad y seguridad" : "About MindBridge — Sources, Privacy & Safety") : locale === "es" ? "MindBridge — Encuentra ayuda de salud mental, rápido" : "MindBridge — Find Mental Health Help, Fast"
  const description = resource ? (locale === "es" ? spanish[resource.id as keyof typeof spanish].description : resource.description) : locale === "es" ? "Directorio gratuito de líneas de crisis y recursos de salud mental en Estados Unidos. Llama o envía un mensaje al 988 para apoyo gratuito y confidencial, 24/7." : "MindBridge — a free directory of US mental health crisis hotlines and support resources. Find free, confidential help, fast."
  return { locale, title, description, canonical: siteOrigin + path, alternates: localePaths(route) }
}
