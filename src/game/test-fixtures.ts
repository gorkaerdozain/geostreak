import type { Country, Position } from "./types"

/** Builds a small square country around a [lng, lat] center. */
export function makeCountry(
  code: string,
  [lng, lat]: Position,
  overrides: Partial<Country> = {}
): Country {
  const d = 0.5
  return {
    code,
    iso2: code.slice(0, 2),
    name: code,
    nameEs: code,
    flag: "🏳️",
    capital: null,
    continent: "Test",
    subregion: "Test",
    population: 0,
    area: 0,
    languages: [],
    currencies: [],
    borders: [],
    latlng: [lat, lng],
    playable: true,
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [lng - d, lat - d],
          [lng + d, lat - d],
          [lng + d, lat + d],
          [lng - d, lat + d],
          [lng - d, lat - d],
        ],
      ],
    },
    ...overrides,
  }
}
