import type {GoogleMapsInputConfig} from './types'

let config: GoogleMapsInputConfig

export function getGeoConfig(): GoogleMapsInputConfig {
  return config
}

export function setGeoConfig(newConfig: GoogleMapsInputConfig): void {
  config = newConfig
}
