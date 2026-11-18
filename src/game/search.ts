import type { Country } from "./types"

export const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()

function rank(country: Country, query: string) {
  const names = [normalize(country.name), normalize(country.nameEs)]
  if (names.some((n) => n === query)) return 0
  if (names.some((n) => n.startsWith(query))) return 1
  if (names.some((n) => n.includes(query))) return 2
  return null
}

/** Accent-insensitive search over English and Spanish names. */
export function searchCountries(countries: Country[], rawQuery: string) {
  const query = normalize(rawQuery)
  return countries
    .map((country) => ({ country, rank: query ? rank(country, query) : 0 }))
    .filter(
      (entry): entry is { country: Country; rank: number } =>
        entry.rank !== null
    )
    .toSorted(
      (a, b) => a.rank - b.rank || a.country.name.localeCompare(b.country.name)
    )
    .map((entry) => entry.country)
}
