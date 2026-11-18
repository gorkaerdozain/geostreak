export type Position = [number, number]

export type CountryGeometry =
  | { type: "Polygon"; coordinates: Position[][] }
  | { type: "MultiPolygon"; coordinates: Position[][][] }

export interface Country {
  code: string
  iso2: string
  name: string
  nameEs: string
  flag: string
  capital: string | null
  continent: string
  subregion: string
  population: number
  area: number
  languages: string[]
  currencies: string[]
  borders: string[]
  latlng: [number, number]
  playable: boolean
  geometry: CountryGeometry
}
