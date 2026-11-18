import { describe, expect, it } from "vite-plus/test"

import { CORRECT_COLOR, distanceColor, distanceRgb } from "./color"

const hue = (color: string) => Number(/hsl\((\d+)/.exec(color)?.[1])

describe("distanceColor", () => {
  it("uses the correct color for the target itself", () => {
    expect(distanceColor(0, true)).toBe(CORRECT_COLOR)
  })

  it("is hottest for neighbours and colder far away", () => {
    const near = distanceColor(0, false)
    const mid = distanceColor(3000, false)
    const far = distanceColor(15000, false)
    expect(hue(near)).toBeLessThan(hue(mid))
    expect(hue(mid)).toBeLessThan(hue(far))
  })

  it("clamps distances beyond the scale", () => {
    expect(distanceColor(40000, false)).toBe(distanceColor(15000, false))
  })
})

describe("distanceRgb", () => {
  it("converts the distance color to WebGL rgb in 0..1", () => {
    const [r, g, b] = distanceRgb(0, false)
    expect(r).toBeCloseTo(0.798, 2)
    expect(g).toBeCloseTo(0.042, 2)
    expect(b).toBeCloseTo(0.042, 2)
  })

  it("uses the correct color for the target", () => {
    const [r, g, b] = distanceRgb(1234, true)
    expect(g).toBeGreaterThan(r)
    expect(g).toBeGreaterThan(b)
  })
})
