import countries from "@/data/countries.json"

import type { Country } from "./types"

export const ALL_COUNTRIES: Country[] = countries
export const PLAYABLE_COUNTRIES = countries.filter((c) => c.playable)
export const COUNTRIES_BY_CODE = new Map(countries.map((c) => [c.code, c]))
