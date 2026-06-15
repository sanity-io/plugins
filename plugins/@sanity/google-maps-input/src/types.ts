import type {DiffComponent, DiffComponentOptions, ObjectDiff} from 'sanity'
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
}

export interface GeopointRadius {
  _type: 'geopointRadius'
  _key?: string
  lat: number
  lng: number
  alt?: number
  radius: number
}

export interface GeopointSchemaType extends ObjectSchemaType {
  diffComponent?: DiffComponent<ObjectDiff<Geopoint>> | DiffComponentOptions<ObjectDiff<Geopoint>>
}

export interface GeopointRadiusSchemaType extends ObjectSchemaType {
  diffComponent?:
    | DiffComponent<ObjectDiff<GeopointRadius>>
    | DiffComponentOptions<ObjectDiff<GeopointRadius>>
}

export interface GoogleMapsInputConfig {
  apiKey: string
  defaultZoom?: number
  defaultLocale?: string
  defaultLocation?: {
    lat: number
    lng: number
  }
  defaultRadiusZoom?: number
  defaultRadius?: number
}
