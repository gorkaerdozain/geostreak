import type { Country, Position } from "./types"

/** 1 / golden ratio, the turn between two consecutive Fibonacci points. */
const INVERSE_PHI = (Math.sqrt(5) - 1) / 2
const DEG = 180 / Math.PI

type LatLng = [number, number]

/**
 * The i-th of `samples` points of a spherical Fibonacci lattice, as [lat, lng].
 * Mirrors cobe's shader, so markers placed here sit exactly on its map dots.
 */
export function fibonacciPoint(i: number, samples: number): LatLng {
  const lat = Math.asin(1 - (2 * i) / samples) * DEG
  const turn = (i * INVERSE_PHI) % 1
  const lng = -turn * 360
  return [lat, lng < -180 ? lng + 360 : lng]
}

function inRing([x, y]: Position, ring: Position[]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function polygonsOf(country: Country): Position[][][] {
  const { geometry } = country
  return geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.coordinates
}

function contains(polygons: Position[][][], point: Position) {
  return polygons.some(
    ([outer, ...holes]) =>
      inRing(point, outer) && !holes.some((hole) => inRing(point, hole))
  )
}

/**
 * The map dots inside a country, as [lat, lng]. Countries smaller than a dot
 * get a single dot at their position so they never disappear.
 */
export function countryDots(country: Country, samples: number): LatLng[] {
  const polygons = polygonsOf(country)
  const points = polygons.flatMap(([outer]) => outer)
  const lats = points.map(([, lat]) => lat)
  const lngs = points.map(([lng]) => lng)
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)]
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)]

  // Latitude falls monotonically with the index, so only scan that band.
  const toIndex = (lat: number) => ((1 - Math.sin(lat / DEG)) * samples) / 2
  const first = Math.max(0, Math.floor(toIndex(maxLat)))
  const last = Math.min(samples, Math.ceil(toIndex(minLat)))

  const dots: LatLng[] = []
  for (let i = first; i <= last; i++) {
    const [lat, lng] = fibonacciPoint(i, samples)
    if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) continue
    if (contains(polygons, [lng, lat])) dots.push([lat, lng])
  }
  return dots.length > 0 ? dots : [country.latlng]
}
