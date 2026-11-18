export const CORRECT_COLOR = "hsl(142 70% 42%)"

/** Distances at or beyond this value get the coldest color. */
export const MAX_DISTANCE_KM = 15000

/** Hot (red, near) to cold (pale yellow, far) color for a guess. */
export function distanceColor(distanceKm: number, isTarget: boolean) {
  if (isTarget) return CORRECT_COLOR
  const t = Math.min(distanceKm, MAX_DISTANCE_KM) / MAX_DISTANCE_KM
  const eased = Math.sqrt(t)
  const hue = Math.round(eased * 55)
  const lightness = Math.round(42 + eased * 43)
  return `hsl(${hue} 90% ${lightness}%)`
}
