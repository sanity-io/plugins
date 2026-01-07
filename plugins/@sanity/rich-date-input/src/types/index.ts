export interface RichDate {
  local: string
  utc: string
  timezone: string
  offset: number
}

export interface NormalizedTimeZone {
  abbreviation: string
  alternativeName: string
  mainCities: string
  name: string
  namePretty: string
  offset: string
  value: string
  currentTimeOffsetInMinutes: number
  group: string[]
}
