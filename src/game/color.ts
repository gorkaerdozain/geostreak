interface Hsl {
  h: number
  /** 0..1 */
  s: number
  /** 0..1 */
  l: number
}

const CORRECT_HSL: Hsl = { h: 142, s: 0.7, l: 0.42 }

const formatHsl = ({ h, s, l }: Hsl) =>
  `hsl(${h}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`

export const CORRECT_COLOR = formatHsl(CORRECT_HSL)

/** Distances at or beyond this value get the coldest color. */
export const MAX_DISTANCE_KM = 15000

function distanceHsl(distanceKm: number, isTarget: boolean): Hsl {
  if (isTarget) return CORRECT_HSL
  const t = Math.min(distanceKm, MAX_DISTANCE_KM) / MAX_DISTANCE_KM
  const eased = Math.sqrt(t)
  return {
    h: Math.round(eased * 55),
    s: 0.9,
    l: Math.round(42 + eased * 43) / 100,
  }
}

/** Hot (red, near) to cold (pale yellow, far) color for a guess. */
export function distanceColor(distanceKm: number, isTarget: boolean) {
  return formatHsl(distanceHsl(distanceKm, isTarget))
}

/** Same color as `distanceColor`, as WebGL rgb in 0..1. */
export function distanceRgb(
  distanceKm: number,
  isTarget: boolean
): [number, number, number] {
  const { h, s, l } = distanceHsl(distanceKm, isTarget)
  const a = s * Math.min(l, 1 - l)
  const channel = (n: number) => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return [channel(0), channel(8), channel(4)]
}
