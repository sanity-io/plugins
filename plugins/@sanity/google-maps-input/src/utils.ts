import type {LatLng} from './types'

/**
 * Geopoint values can exist in a partial/empty state — a freshly added array
 * item is just `{_type, _key}` with no coordinates yet. Passing such a value's
 * `lat`/`lng` (which are `undefined`, or could be `NaN`/`Infinity`) to Google
 * Maps markers, circles or the map center throws an `InvalidValueError`. Use
 * this to extract a usable `LatLng` only when both coordinates are finite
 * numbers, and `null` otherwise.
 */
export function getValidLatLng(value: {lat?: number; lng?: number} | undefined): LatLng | null {
  const lat = value?.lat
  const lng = value?.lng
  if (
    typeof lat === 'number' &&
    Number.isFinite(lat) &&
    typeof lng === 'number' &&
    Number.isFinite(lng)
  ) {
    return {lat, lng}
  }
  return null
}
