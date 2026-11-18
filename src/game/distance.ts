import type { Country, Position } from "./types"

const EARTH_RADIUS_KM = 6371

const toRad = (deg: number) => (deg * Math.PI) / 180

/** Great-circle distance between two [lng, lat] points, in km. */
export function haversineKm([lng1, lat1]: Position, [lng2, lat2]: Position) {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

function outerRings(country: Country): Position[][] {
  const { geometry } = country
  return geometry.type === "Polygon"
    ? [geometry.coordinates[0]]
    : geometry.coordinates.map((polygon) => polygon[0])
}

/**
 * Shortest border-to-border distance between two countries, in km.
 * Land neighbours are 0 km, even when the simplified shapes leave a gap.
 */
export function borderDistanceKm(a: Country, b: Country): number {
  if (a.code === b.code || a.borders.includes(b.code)) return 0

  let min = Infinity
  for (const ringA of outerRings(a)) {
    for (const ringB of outerRings(b)) {
      for (const pointA of ringA) {
        for (const pointB of ringB) {
          const km = haversineKm(pointA, pointB)
          if (km < min) min = km
        }
      }
    }
  }
  return min
}
