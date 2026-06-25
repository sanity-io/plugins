import {
  AdvancedMarker,
  Circle,
  ControlPosition,
  Map,
  type MapMouseEvent,
  MapControl,
} from '@vis.gl/react-google-maps'
import {useCallback} from 'react'

import {MAP_ID} from '../map/constants'
import {SearchInput} from '../map/SearchInput'
import type {GeopointRadius, LatLng} from '../types'

const fallbackLatLng: LatLng = {lat: 40.7058254, lng: -74.1180863}
const defaultMapLocation: LatLng = {lng: 10.74609, lat: 59.91273}

interface SelectProps {
  value?: GeopointRadius
  onChange?: (latLng: LatLng, radius?: number) => void
  defaultLocation?: LatLng
  defaultRadiusZoom?: number
  defaultRadius?: number
}

export function GeopointRadiusSelect({
  value,
  onChange,
  defaultLocation = defaultMapLocation,
  defaultRadiusZoom = 12,
  defaultRadius = 1000,
}: SelectProps) {
  const center: LatLng = {
    ...fallbackLatLng,
    ...defaultLocation,
    ...(value ? {lat: value.lat, lng: value.lng} : {}),
  }
  const currentRadius = value?.radius ?? defaultRadius

  const setValue = useCallback(
    (latLng: LatLng, radius?: number) => {
      onChange?.(latLng, radius == null ? undefined : Math.round(radius))
    },
    [onChange],
  )

  const handleMapClick = useCallback(
    (event: MapMouseEvent) => {
      if (event.detail.latLng) {
        setValue(event.detail.latLng, currentRadius)
      }
    },
    [setValue, currentRadius],
  )

  const handleMarkerDragEnd = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        setValue({lat: event.latLng.lat(), lng: event.latLng.lng()}, currentRadius)
      }
    },
    [setValue, currentRadius],
  )

  const handleSelect = useCallback(
    (location: LatLng) => setValue(location, currentRadius),
    [setValue, currentRadius],
  )

  const handleCircleRadiusChanged = useCallback(
    (radius: number) => {
      if (value) {
        setValue({lat: value.lat, lng: value.lng}, radius)
      }
    },
    [setValue, value],
  )

  const handleCircleDragEnd = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        setValue({lat: event.latLng.lat(), lng: event.latLng.lng()}, currentRadius)
      }
    },
    [setValue, currentRadius],
  )

  return (
    <Map
      mapId={MAP_ID}
      defaultCenter={center}
      defaultZoom={defaultRadiusZoom}
      onClick={handleMapClick}
      gestureHandling="greedy"
      streetViewControl={false}
      mapTypeControl={false}
      style={{width: '100%', height: '100%'}}
    >
      <MapControl position={ControlPosition.TOP_RIGHT}>
        <SearchInput onSelect={handleSelect} />
      </MapControl>
      {value && (
        <>
          <AdvancedMarker
            position={{lat: value.lat, lng: value.lng}}
            draggable={Boolean(onChange)}
            onDragEnd={handleMarkerDragEnd}
          />
          <Circle
            center={{lat: value.lat, lng: value.lng}}
            radius={value.radius}
            editable={Boolean(onChange)}
            draggable={Boolean(onChange)}
            fillColor="#4285F4"
            fillOpacity={0.2}
            strokeColor="#4285F4"
            strokeOpacity={0.8}
            strokeWeight={2}
            onRadiusChanged={handleCircleRadiusChanged}
            onDragEnd={handleCircleDragEnd}
          />
        </>
      )}
    </Map>
  )
}
