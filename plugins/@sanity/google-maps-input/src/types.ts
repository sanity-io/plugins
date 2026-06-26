import type {ObjectSchemaType} from 'sanity'

export interface LatLng {
  lat: number
  lng: number
}

export interface Geopoint {
  _type: 'geopoint'
  _key?: string
  lat: number
  lng: number
  alt?: number
  zoom?: number
}

export interface GeopointRadius {
  _type: 'geopointRadius'
  _key?: string
  lat: number
  lng: number
  alt?: number
  radius: number
}

export type GeopointSchemaType = ObjectSchemaType

export type GeopointRadiusSchemaType = ObjectSchemaType

export interface GoogleMapsInputConfig {
  apiKey: string
  defaultZoom?: number
  defaultLocale?: string
  saveZoom?: boolean
  defaultLocation?: {
    lat: number
    lng: number
  }
  defaultRadiusZoom?: number
  defaultRadius?: number
}
