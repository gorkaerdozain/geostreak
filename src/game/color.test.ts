import { describe, expect, it } from "vite-plus/test"

import { CORRECT_COLOR, distanceColor } from "./color"

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
