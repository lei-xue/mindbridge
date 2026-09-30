import { focusRing } from "../lib/ui"
import { useLocale } from "../i18n/LocaleProvider"

// Only publicly listed street addresses; never device coordinates or visitor input.
export function AddressLink({ address }: { address: string }) {
  const { s } = useLocale()
  return <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" aria-label={s.maps.openInMaps(address)} className={`rounded text-teal-800 underline decoration-sage-300 underline-offset-4 hover:decoration-teal-800 ${focusRing}`}>{address}</a>
}
