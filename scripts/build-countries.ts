/**
 * Builds src/data/countries.json from Natural Earth 110m geometries
 * joined with world-countries metadata.
 *
 * Usage: bun scripts/build-countries.ts
 */
import { writeFileSync } from "node:fs"
import { resolve } from "node:path"
import worldCountries from "world-countries"

const NATURAL_EARTH_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"

// Natural Earth uses its own codes for a few territories.
const CODE_ALIASES: Record<string, string> = { KOS: "UNK" }

type Position = [number, number]
type Geometry =
  | { type: "Polygon"; coordinates: Position[][] }
  | { type: "MultiPolygon"; coordinates: Position[][][] }

interface NaturalEarthFeature {
  properties: {
    ISO_A3_EH: string
    ADM0_A3: string
    NAME_EN: string
    POP_EST: number
    CONTINENT: string
  }
  geometry: Geometry
}

const round = (value: number) => Math.round(value * 100) / 100

const roundRing = (points: Position[]) =>
  points.map(([lng, lat]) => [round(lng), round(lat)] as Position)

function roundGeometry(geometry: Geometry): Geometry {
  return geometry.type === "Polygon"
    ? { type: "Polygon", coordinates: geometry.coordinates.map(roundRing) }
    : {
        type: "MultiPolygon",
        coordinates: geometry.coordinates.map((polygon) =>
          polygon.map(roundRing)
        ),
      }
}

const response = await fetch(NATURAL_EARTH_URL)
if (!response.ok) throw new Error(`Download failed: ${response.status}`)
function isFeatureCollection(
  value: unknown
): value is { features: NaturalEarthFeature[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "features" in value &&
    Array.isArray(value.features)
  )
}

const body: unknown = await response.json()
if (!isFeatureCollection(body)) throw new Error("Unexpected GeoJSON shape")
const { features } = body

const metadataByCode = new Map(worldCountries.map((c) => [c.cca3, c]))

const countries = features
  .map(({ properties, geometry }) => {
    const rawCode =
      properties.ISO_A3_EH === "-99" ? properties.ADM0_A3 : properties.ISO_A3_EH
    const code = CODE_ALIASES[rawCode] ?? rawCode
    const meta = metadataByCode.get(code)
    if (!meta) return null
    return {
      code,
      iso2: meta.cca2,
      name: meta.name.common,
      nameEs: meta.translations.spa?.common ?? meta.name.common,
      flag: meta.flag,
      capital: meta.capital[0] ?? null,
      continent: properties.CONTINENT,
      subregion: meta.subregion,
      population: properties.POP_EST,
      area: meta.area,
      languages: Object.values(meta.languages),
      currencies: Object.values(meta.currencies).map((c) => c.name),
      borders: meta.borders,
      latlng: meta.latlng,
      playable: code !== "ATA" && code !== "ATF",
      geometry: roundGeometry(geometry),
    }
  })
  .filter((country) => country !== null)
  .toSorted((a, b) => a.name.localeCompare(b.name))

const target = resolve(import.meta.dirname, "../src/data/countries.json")
writeFileSync(target, JSON.stringify(countries))
console.log(
  `Wrote ${countries.length} countries (${countries.filter((c) => c.playable).length} playable) to ${target}`
)
