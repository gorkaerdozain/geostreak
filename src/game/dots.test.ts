import { describe, expect, it } from "vite-plus/test"

import { countryDots, fibonacciPoint } from "./dots"
import { makeCountry } from "./test-fixtures"
import type { Country } from "./types"

function box(code: string, [lng, lat]: [number, number], half: number) {
  const ring: [number, number][] = [
    [lng - half, lat - half],
    [lng + half, lat - half],
    [lng + half, lat + half],
    [lng - half, lat + half],
    [lng - half, lat - half],
  ]
  return {
    ring,
    country: makeCountry(code, [lng, lat], {
      geometry: { type: "Polygon", coordinates: [ring] },
    }),
  }
}

const inside = (c: Country, [lat, lng]: [number, number]) => {
  const [[minLng, minLat], , [maxLng, maxLat]] =
    c.geometry.type === "Polygon"
      ? c.geometry.coordinates[0]
      : c.geometry.coordinates[0][0]
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng
}

describe("fibonacciPoint (same layout as cobe's map dots)", () => {
  it("starts at the north pole and crosses the equator halfway", () => {
    expect(fibonacciPoint(0, 1000)[0]).toBeCloseTo(90)
    expect(fibonacciPoint(500, 1000)[0]).toBeCloseTo(0)
  })

  it("turns by the golden angle westwards", () => {
    const [lat, lng] = fibonacciPoint(1, 100)
    expect(lat).toBeCloseTo(78.52, 1)
    expect(lng).toBeCloseTo(137.51, 1)
  })
})

describe("countryDots", () => {
  it("returns the map dots that fall inside the country", () => {
    const { country } = box("BIG", [0, 0], 10)
    const dots = countryDots(country, 20000)
    expect(dots.length).toBeGreaterThan(150)
    expect(dots.length).toBeLessThan(250)
    expect(dots.every((d) => inside(country, d))).toBe(true)
  })

  it("skips dots inside holes", () => {
    const { ring: outer } = box("OUT", [0, 0], 10)
    const { ring: hole } = box("HOL", [0, 0], 5)
    const country = makeCountry("RNG", [0, 0], {
      geometry: { type: "Polygon", coordinates: [outer, hole] },
    })
    const dots = countryDots(country, 20000)
    expect(
      dots.some(([lat, lng]) => Math.abs(lat) < 5 && Math.abs(lng) < 5)
    ).toBe(false)
    expect(dots.length).toBeGreaterThan(100)
  })

  it("falls back to the country position when it is smaller than a dot", () => {
    const country = makeCountry("TNY", [12.3, 45.6])
    expect(countryDots(country, 2000)).toEqual([[45.6, 12.3]])
  })
})
