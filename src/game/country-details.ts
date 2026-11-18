/**
 * Extra country facts from open APIs (no key needed):
 * Wikidata SPARQL for numbers, Wikipedia REST for the summary.
 */
export interface CountryDetails {
  description: string | null
  extract: string | null
  wikipediaUrl: string | null
  hdi: number | null
  gdpPerCapita: number | null
  lifeExpectancy: number | null
  callingCode: string | null
  highestPoint: string | null
  drivingSide: string | null
  website: string | null
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql"
const SUMMARY_ENDPOINT = "https://en.wikipedia.org/api/rest_v1/page/summary/"

// Our dataset uses a few codes that Wikidata spells differently.
const WIKIDATA_CODES: Record<string, string> = { UNK: "XKX" }

export function wikidataQuery(code: string) {
  const iso3 = WIKIDATA_CODES[code] ?? code
  return `SELECT ?title ?hdi ?gdp ?life ?calling ?website ?highestLabel ?drivingLabel WHERE {
  ?country wdt:P298 "${iso3}" .
  OPTIONAL { ?article schema:about ?country ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?title . }
  OPTIONAL { ?country wdt:P1081 ?hdi . }
  OPTIONAL { ?country wdt:P2132 ?gdp . }
  OPTIONAL { ?country wdt:P2250 ?life . }
  OPTIONAL { ?country wdt:P474 ?calling . }
  OPTIONAL { ?country wdt:P856 ?website . }
  OPTIONAL { ?country wdt:P610 ?highest . }
  OPTIONAL { ?country wdt:P1622 ?driving . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 1`
}

type Binding = Record<string, { value: string } | undefined>

function readBindings(json: unknown): Binding[] {
  if (typeof json !== "object" || json === null || !("results" in json)) {
    return []
  }
  const { results } = json
  if (typeof results !== "object" || results === null) return []
  if (!("bindings" in results) || !Array.isArray(results.bindings)) return []
  return results.bindings
}

const text = (b: Binding, key: string) => b[key]?.value ?? null
const num = (b: Binding, key: string) => {
  const value = Number(b[key]?.value)
  return Number.isFinite(value) && b[key] ? value : null
}

function readString(source: object, key: string): string | null {
  const value: unknown = Reflect.get(source, key)
  return typeof value === "string" ? value : null
}

async function fetchSummary(title: string, fetchImpl: FetchLike) {
  try {
    const res = await fetchImpl(SUMMARY_ENDPOINT + encodeURIComponent(title))
    if (!res.ok) return null
    const json: unknown = await res.json()
    if (typeof json !== "object" || json === null) return null
    const urls: unknown = Reflect.get(json, "content_urls")
    const desktop: unknown =
      typeof urls === "object" && urls !== null
        ? Reflect.get(urls, "desktop")
        : null
    return {
      description: readString(json, "description"),
      extract: readString(json, "extract"),
      wikipediaUrl:
        typeof desktop === "object" && desktop !== null
          ? readString(desktop, "page")
          : null,
    }
  } catch {
    return null
  }
}

export async function fetchCountryDetails(
  code: string,
  fetchImpl: FetchLike = fetch
): Promise<CountryDetails | null> {
  try {
    const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(wikidataQuery(code))}`
    const res = await fetchImpl(url, {
      headers: { Accept: "application/sparql-results+json" },
    })
    if (!res.ok) return null
    const [binding] = readBindings(await res.json())
    if (!binding) return null

    const title = text(binding, "title")
    const summary = title ? await fetchSummary(title, fetchImpl) : null

    return {
      description: summary?.description ?? null,
      extract: summary?.extract ?? null,
      wikipediaUrl: summary?.wikipediaUrl ?? null,
      hdi: num(binding, "hdi"),
      gdpPerCapita: num(binding, "gdp"),
      lifeExpectancy: num(binding, "life"),
      callingCode: text(binding, "calling"),
      highestPoint: text(binding, "highestLabel"),
      drivingSide: text(binding, "drivingLabel"),
      website: text(binding, "website"),
    }
  } catch {
    return null
  }
}

const cache = new Map<string, Promise<CountryDetails | null>>()

/** Cached promise per country, ready for React's `use()`. */
export function getCountryDetails(code: string) {
  let promise = cache.get(code)
  if (!promise) {
    promise = fetchCountryDetails(code)
    cache.set(code, promise)
  }
  return promise
}
