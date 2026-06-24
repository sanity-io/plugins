import {createStaticMapsUrl, type StaticMapsLocation} from '@vis.gl/react-google-maps'

import type {Geopoint, GeopointRadius} from '../types'

const DEFAULT_WIDTH = 640
const DEFAULT_HEIGHT = 300
// Rough meters-per-degree of latitude, used to translate a radius in meters to a
// lat/lng delta. Good enough for previewing modest radii.
const METERS_PER_DEGREE = 111_000
const CIRCLE_OUTLINE = '0x4285F4'
const CIRCLE_FILL = '0x4285F480'

export interface StaticMapSize {
  width?: number
  height?: number
}

/**
 * Static map preview for a plain geopoint: a single marker centered in view.
 */
export function getGeopointStaticMapUrl(
  value: Pick<Geopoint, 'lat' | 'lng'>,
  apiKey: string,
  {width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT}: StaticMapSize = {},
): string {
  const center = {lat: value.lat, lng: value.lng}
  return createStaticMapsUrl({
    apiKey,
    width,
    height,
    scale: 2,
    zoom: 13,
    center,
    markers: [{location: center}],
  })
}

function generateCirclePoints(lat: number, lng: number, radius: number): StaticMapsLocation[] {
  const points: StaticMapsLocation[] = []
  const steps = 64
  const latRatio = radius / METERS_PER_DEGREE
  const lngRatio = radius / (METERS_PER_DEGREE * Math.cos((lat * Math.PI) / 180))

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI
    points.push({
      lat: lat + latRatio * Math.cos(angle),
      lng: lng + lngRatio * Math.sin(angle),
    })
  }

  return points
}

/**
 * The four cardinal extremes of the circle. Passing these as `visible` lets the
 * Static Maps API auto-fit the viewport around the whole circle (with padding)
 * instead of clipping it.
 */
function getCircleBounds(lat: number, lng: number, radius: number): StaticMapsLocation[] {
  const latDelta = radius / METERS_PER_DEGREE
  const lngDelta = radius / (METERS_PER_DEGREE * Math.cos((lat * Math.PI) / 180))
  return [
    {lat: lat + latDelta, lng},
    {lat: lat - latDelta, lng},
    {lat, lng: lng + lngDelta},
    {lat, lng: lng - lngDelta},
  ]
}

/**
 * Static map preview for a geopoint with a radius: a marker plus a filled circle.
 * The viewport is derived from the circle bounds (no fixed zoom) so the entire
 * radius stays within the image.
 */
export function getGeopointRadiusStaticMapUrl(
  value: Pick<GeopointRadius, 'lat' | 'lng' | 'radius'>,
  apiKey: string,
  {width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT}: StaticMapSize = {},
): string {
  if (!value.radius) {
    return getGeopointStaticMapUrl(value, apiKey, {width, height})
  }

  return createStaticMapsUrl({
    apiKey,
    width,
    height,
    scale: 2,
    markers: [{location: {lat: value.lat, lng: value.lng}}],
    paths: [
      {
        coordinates: generateCirclePoints(value.lat, value.lng, value.radius),
        color: CIRCLE_OUTLINE,
        weight: 2,
        fillcolor: CIRCLE_FILL,
      },
    ],
    visible: getCircleBounds(value.lat, value.lng, value.radius),
  })
}
