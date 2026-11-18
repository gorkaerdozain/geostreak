import { describe, expect, it } from "vite-plus/test"

import { searchCountries } from "./search"
import { makeCountry } from "./test-fixtures"

const countries = [
  makeCountry("ESP", [-4, 40], { name: "Spain", nameEs: "España" }),
  makeCountry("DEU", [10, 51], { name: "Germany", nameEs: "Alemania" }),
  makeCountry("MEX", [-102, 23], { name: "Mexico", nameEs: "México" }),
  makeCountry("GNB", [-15, 12], {
    name: "Guinea-Bissau",
    nameEs: "Guinea-Bisáu",
  }),
  makeCountry("GIN", [-10, 11], { name: "Guinea", nameEs: "Guinea" }),
]
const codes = (query: string) =>
  searchCountries(countries, query).map((c) => c.code)

describe("searchCountries", () => {
  it("returns every country for an empty query", () => {
    expect(codes("")).toHaveLength(countries.length)
  })

  it("matches English and Spanish names", () => {
    expect(codes("germ")).toEqual(["DEU"])
    expect(codes("alem")).toEqual(["DEU"])
  })

  it("ignores accents and case", () => {
    expect(codes("MEXICO")).toEqual(["MEX"])
    expect(codes("espana")).toEqual(["ESP"])
  })

  it("ranks prefix matches before substring matches", () => {
    expect(codes("guinea")).toEqual(["GIN", "GNB"])
    expect(codes("bissau")).toEqual(["GNB"])
  })
})
