import boundaries from '../data/california-county-boundaries.json'

type Point = number[]
function insideRing(x: number, y: number, ring: Point[]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

// Fail closed near simplified edges or when device accuracy is poor. Coordinates
// stay in this function/browser; no reverse-geocoding service or URL is used.
export function suggestCounty(latitude: number, longitude: number, accuracy: number): string | null {
  if (![latitude, longitude, accuracy].every(Number.isFinite) || accuracy < 0 || accuracy > 10000 || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  const sx = 111320 * Math.cos(latitude * Math.PI / 180), sy = 111320
  const margin = accuracy + 400 // conservative simplification and shoreline buffer
  const candidates: string[] = []
  for (const county of boundaries.counties) {
    const polygons = county.geometry.type === 'Polygon' ? [county.geometry.coordinates as Point[][]] : county.geometry.coordinates as Point[][][]
    for (const rings of polygons) {
      if (!insideRing(longitude, latitude, rings[0]) || rings.slice(1).some(r => insideRing(longitude, latitude, r))) continue
      for (const ring of rings) {
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i], b = ring[(i + 1) % ring.length]
          const ax = (a[0] - longitude) * sx, ay = (a[1] - latitude) * sy
          const dx = (b[0] - a[0]) * sx, dy = (b[1] - a[1]) * sy
          const length = dx * dx + dy * dy
          const t = length ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / length)) : 0
          if (Math.hypot(ax + t * dx, ay + t * dy) <= margin) return null
        }
      }
      candidates.push(county.name)
      break
    }
  }
  return candidates.length === 1 ? candidates[0] : null
}
