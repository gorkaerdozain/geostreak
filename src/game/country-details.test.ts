import { describe, expect, it } from "vite-plus/test"

import { fetchCountryDetails, wikidataQuery } from "./country-details"

const wikidataResponse = {
  results: {
    bindings: [
      {
        title: { value: "Spain" },
        hdi: { value: "0.905" },
        gdp: { value: "29993.06" },
        life: { value: "83" },
        calling: { value: "+34" },
        website: { value: "https://administracion.gob.es/" },
        highestLabel: { value: "Teide" },
        drivingLabel: { value: "right" },
      },
    ],
  },
}

const summaryResponse = {
  description: "Country in southwestern Europe",
  extract: "Spain is a country in Southern and Western Europe.",
  content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Spain" } },
}

function fakeFetch(responses: Record<string, unknown>) {
  const calls: string[] = []
  const impl = async (input: string) => {
    calls.push(input)
    const key = Object.keys(responses).find((k) => input.includes(k))
    if (!key) return new Response("not found", { status: 404 })
    return Response.json(responses[key])
  }
  return { impl, calls }
}

async function offlineFetch(): Promise<Response> {
  throw new TypeError("offline")
}

describe("wikidataQuery", () => {
  it("looks the country up by its ISO alpha-3 code", () => {
    expect(wikidataQuery("ESP")).toContain('wdt:P298 "ESP"')
  })

  it("maps codes that Wikidata spells differently", () => {
    expect(wikidataQuery("UNK")).toContain('wdt:P298 "XKX"')
  })
})

describe("fetchCountryDetails", () => {
  it("combines Wikidata facts with the Wikipedia summary", async () => {
    const { impl, calls } = fakeFetch({
      "query.wikidata.org": wikidataResponse,
      "page/summary/Spain": summaryResponse,
    })
    const details = await fetchCountryDetails("ESP", impl)
    expect(details).toEqual({
      description: "Country in southwestern Europe",
      extract: "Spain is a country in Southern and Western Europe.",
      wikipediaUrl: "https://en.wikipedia.org/wiki/Spain",
      hdi: 0.905,
      gdpPerCapita: 29993.06,
      lifeExpectancy: 83,
      callingCode: "+34",
      highestPoint: "Teide",
      drivingSide: "right",
      website: "https://administracion.gob.es/",
    })
    expect(calls).toHaveLength(2)
  })

  it("returns the facts without summary when Wikipedia fails", async () => {
    const { impl } = fakeFetch({ "query.wikidata.org": wikidataResponse })
    const details = await fetchCountryDetails("ESP", impl)
    expect(details?.hdi).toBe(0.905)
    expect(details?.extract).toBeNull()
  })

  it("returns null when Wikidata has no match", async () => {
    const { impl } = fakeFetch({
      "query.wikidata.org": { results: { bindings: [] } },
    })
    expect(await fetchCountryDetails("ZZZ", impl)).toBeNull()
  })

  it("returns null when the network fails", async () => {
    expect(await fetchCountryDetails("ESP", offlineFetch)).toBeNull()
  })
})
