import { focusRing } from "../lib/ui"

// Only publicly listed street addresses; never device coordinates or visitor input.
export function AddressLink({ address }: { address: string }) {
  return <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" aria-label={`Open in maps: ${address}`} className={`rounded text-teal-800 underline decoration-sage-300 underline-offset-4 hover:decoration-teal-800 ${focusRing}`}>{address}</a>
}
