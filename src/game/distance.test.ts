import { describe, expect, it } from "vite-plus/test"

import { borderDistanceKm, haversineKm } from "./distance"
import { makeCountry } from "./test-fixtures"

describe("haversineKm", () => {
  it("returns 0 for the same point", () => {
    expect(haversineKm([2, 41], [2, 41])).toBe(0)
  })

  it("measures Madrid to Paris as roughly 1050 km", () => {
    const km = haversineKm([-3.7, 40.42], [2.35, 48.86])
    expect(km).toBeGreaterThan(1000)
    expect(km).toBeLessThan(1100)
  })
})

describe("borderDistanceKm", () => {
  it("is 0 for the same country", () => {
    const spain = makeCountry("ESP", [-4, 40])
    expect(borderDistanceKm(spain, spain)).toBe(0)
  })

  it("is 0 for land neighbours even if the simplified shapes do not touch", () => {
    const spain = makeCountry("ESP", [-4, 40], { borders: ["FRA"] })
    const france = makeCountry("FRA", [2, 46], { borders: ["ESP"] })
    expect(borderDistanceKm(spain, france)).toBe(0)
    expect(borderDistanceKm(france, spain)).toBe(0)
  })

  it("measures between the closest borders, not the centers", () => {
    const a = makeCountry("AAA", [0, 0])
    const b = makeCountry("BBB", [10, 0])
    const centers = haversineKm([0, 0], [10, 0])
    const borders = haversineKm([0.5, 0], [9.5, 0])
    expect(borderDistanceKm(a, b)).toBeCloseTo(borders, 0)
    expect(borderDistanceKm(a, b)).toBeLessThan(centers)
  })

  it("uses the closest polygon of a multipolygon country", () => {
    const far = makeCountry("FAR", [60, 0])
    const islands = makeCountry("ISL", [0, 0], {
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 0],
            ],
          ],
          [
            [
              [58, 0],
              [59, 0],
              [59, 1],
              [58, 0],
            ],
          ],
        ],
      },
    })
    // The far-away island sits ~80 km from FAR; the main island is ~6500 km away.
    expect(borderDistanceKm(islands, far)).toBeLessThan(100)
  })
})
