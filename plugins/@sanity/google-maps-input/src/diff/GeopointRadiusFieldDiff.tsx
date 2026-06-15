import {
  type DiffComponent,
  type ObjectDiff,
  type DiffProps as GenericDiffProps,
  DiffTooltip,
  getAnnotationAtPath,
} from 'sanity'
import {GoogleMapsLoadProxy} from '../loader/GoogleMapsLoadProxy'
import {GoogleMap} from '../map/Map'
import type {GeopointRadius} from '../types'
import {getGeoConfig} from '../global-workaround'
import {GeopointRadiusMove} from './GeopointRadiusMove'
import {RootContainer} from './GeopointFieldDiff.styles'

export type DiffProps = GenericDiffProps<ObjectDiff<GeopointRadius>>

export const GeopointRadiusFieldDiff: DiffComponent<ObjectDiff<GeopointRadius>> = ({
  diff,
  schemaType,
}: DiffProps) => {
  return (
    <RootContainer>
      <GoogleMapsLoadProxy config={getGeoConfig()}>
        {(api) => <GeopointRadiusDiff api={api} diff={diff} schemaType={schemaType} />}
      </GoogleMapsLoadProxy>
    </RootContainer>
  )
}

function GeopointRadiusDiff({api, diff}: DiffProps & {api: typeof window.google.maps}) {
  const {fromValue, toValue} = diff
  const annotation =
    getAnnotationAtPath(diff, ['lat']) ||
    getAnnotationAtPath(diff, ['lng']) ||
    getAnnotationAtPath(diff, ['radius']) ||
    getAnnotationAtPath(diff, [])

  const center = getCenter(diff, api)
  const bounds = fromValue && toValue ? getBounds(fromValue, toValue, api) : undefined

  return (
    <DiffTooltip annotations={annotation ? [annotation] : []} description={getAction(diff)}>
      <div>
        <GoogleMap
          api={api}
          location={center}
          mapTypeControl={false}
          controlSize={20}
          bounds={bounds}
          scrollWheel={false}
        >
          {(map) => <GeopointRadiusMove api={api} map={map} diff={diff} />}
        </GoogleMap>
      </div>
    </DiffTooltip>
  )
}

function getBounds(
  fromValue: google.maps.LatLngLiteral & {radius?: number},
  toValue: google.maps.LatLngLiteral & {radius?: number},
  api: typeof window.google.maps,
): google.maps.LatLngBounds {
  const bounds = new api.LatLngBounds().extend(fromValue).extend(toValue)

  // Extend bounds to include radius circles
  const fromRadius = fromValue.radius || 0
  const toRadius = toValue.radius || 0
  const maxRadius = Math.max(fromRadius, toRadius)

  if (maxRadius > 0) {
    // Convert radius from meters to degrees (approximate)
    const radiusInDegrees = maxRadius / 111000 // Rough conversion
    bounds.extend({
      lat: fromValue.lat + radiusInDegrees,
      lng: fromValue.lng + radiusInDegrees,
    })
    bounds.extend({
      lat: fromValue.lat - radiusInDegrees,
      lng: fromValue.lng - radiusInDegrees,
    })
    bounds.extend({
      lat: toValue.lat + radiusInDegrees,
      lng: toValue.lng + radiusInDegrees,
    })
    bounds.extend({
      lat: toValue.lat - radiusInDegrees,
      lng: toValue.lng - radiusInDegrees,
    })
  }

  return bounds
}

function getCenter(
  diff: DiffProps['diff'],
  api: typeof window.google.maps,
): google.maps.LatLngLiteral {
  const {fromValue, toValue} = diff
  if (fromValue && toValue) {
    return getBounds(fromValue, toValue, api).getCenter().toJSON()
  }

  if (fromValue) {
    return fromValue
  }

  if (toValue) {
    return toValue
  }

  throw new Error('Neither a from or a to value present')
}

function getAction(diff: ObjectDiff<GeopointRadius>) {
  const {fromValue, toValue} = diff
  if (fromValue && toValue) {
    const latChanged = fromValue.lat !== toValue.lat || fromValue.lng !== toValue.lng
    const radiusChanged = fromValue.radius !== toValue.radius

    if (latChanged && radiusChanged) {
      return 'Moved and radius changed'
    } else if (latChanged) {
      return 'Moved'
    } else if (radiusChanged) {
      return 'Radius changed'
    }
    return 'Unchanged'
  } else if (fromValue) {
    return 'Removed'
  } else if (toValue) {
    return 'Added'
  }

  return 'Unchanged'
}
