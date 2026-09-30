import { en, es } from "./strings"
import originals from "../data/resources.json"
import spanish from "../data/resources-es.json"
import type { Locale } from "../lib/localePath"
import type { Resource } from "../types"

const messages = new Map<string, string>()
const normalize = (text: string) => text.replace(/\s+/g, " ").trim()
function collect(a: object, b: object) {
  for (const [key, value] of Object.entries(a)) {
    const translated = (b as Record<string, unknown>)[key]
    if (typeof value === "string" && typeof translated === "string") messages.set(normalize(value), translated)
    else if (value && typeof value === "object" && translated && typeof translated === "object") collect(value, translated)
  }
}
collect(en, es)
const labels: Record<string, string> = {
  Anxiety: "Ansiedad", Bipolar: "Trastorno bipolar", California: "California", "Child Abuse": "Abuso infantil", Children: "Niños y niñas", "Coming Out": "Compartir tu identidad", Crisis: "Crisis", "Crisis Hotline": "Línea de crisis", "Crisis Text": "Mensajes de crisis", "Dating Violence": "Violencia en el noviazgo", Depression: "Depresión", Directory: "Directorio", "Domestic Violence": "Violencia doméstica", "Families & Caregivers": "Familias y cuidadores", "Family Conflict": "Conflictos familiares", Food: "Alimentos", "General Public": "Público general", Housing: "Vivienda", "Information & Support": "Información y apoyo", International: "Internacional", "LGBTQ+": "LGBTQ+", "Local Resource Finder": "Buscador de recursos locales", "Local Services": "Servicios locales", Loneliness: "Soledad", National: "Estados Unidos", "Native American & Alaska Native": "Comunidades nativas americanas y de Alaska", "New & Expecting Parents": "Madres y padres recientes o futuros", "Older Adults": "Adultos mayores", PTSD: "Estrés postraumático", "Peer Support": "Apoyo entre pares", Postpartum: "Posparto", Relationships: "Relaciones", "Runaway & Homelessness": "Huida del hogar y falta de vivienda", Schizophrenia: "Esquizofrenia", "Sexual Assault": "Agresión sexual", Stress: "Estrés", "Substance Use": "Consumo de sustancias", "Suicidal Thoughts": "Pensamientos suicidas", "Teens & Young Adults": "Adolescentes y adultos jóvenes", Trauma: "Trauma", "Treatment Referral": "Derivación a tratamiento", Veterans: "Veteranos",
}
for (const [a, b] of Object.entries(labels)) messages.set(a, b)
for (const r of originals) {
  const translated = spanish[r.id as keyof typeof spanish]
  if (translated) { messages.set(normalize(r.description), translated.description); messages.set(normalize(r.hours), translated.hours) }
}
export function translate(locale: Locale, text: string): string {
  if (locale === "en") return text
  return messages.get(normalize(text)) ?? text
}
export function resourceView(locale: Locale, resource: Resource): Resource {
  if (locale === "en") return resource
  const copy = spanish[resource.id as keyof typeof spanish]
  return { ...resource, description: copy?.description ?? resource.description, hours: copy?.hours ?? resource.hours }
}
export function callLabel(locale: Locale, resource: Resource) {
  if (locale === "es" && resource.id === "veterans-crisis-line") return "Llamar al 988 y pulsar 1"
  return locale === "es" ? `Llamar al ${resource.phone}` : `Call ${resource.phone}`
}
export function smsLabel(locale: Locale, text: string) {
  if (locale === "en") return text
  return text.replace(/^Text (.+?) to (.+)$/, 'Enviar $1 al $2').replace(/^Text (.+)$/, 'Enviar mensaje al $1')
}
export function resourceSearchText(locale: Locale, resource: Resource) {
  const copy = resourceView(locale, resource)
  return [resource.name, resource.description, copy.description, ...[resource.category, resource.region, ...resource.audience, ...resource.issues, ...resource.tags].map(text => translate(locale, text))].join(" ")
}
