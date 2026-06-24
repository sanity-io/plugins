import {
  AdvancedMarker,
  ControlPosition,
  Map,
  type MapMouseEvent,
  MapControl,
} from '@vis.gl/react-google-maps'
import {useCallback} from 'react'

import {MAP_ID} from '../map/constants'
import {SearchInput} from '../map/SearchInput'
import type {Geopoint, LatLng} from '../types'

const fallbackLatLng: LatLng = {lat: 40.7058254, lng: -74.1180863}
const defaultMapLocation: LatLng = {lng: 10.74609, lat: 59.91273}

interface SelectProps {
  value?: Geopoint
  onChange?: (latLng: LatLng) => void
  defaultLocation?: LatLng
  defaultZoom?: number
}

export function GeopointSelect({
  value,
  onChange,
  defaultLocation = defaultMapLocation,
  defaultZoom = 8,
}: SelectProps) {
  const center: LatLng = {
    ...fallbackLatLng,
    ...defaultLocation,
    ...(value ? {lat: value.lat, lng: value.lng} : {}),
  }

  const handleMapClick = useCallback(
    (event: MapMouseEvent) => {
      if (event.detail.latLng && onChange) {
        onChange(event.detail.latLng)
      }
    },
    [onChange],
  )

  const handleMarkerDragEnd = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (event.latLng && onChange) {
        onChange({lat: event.latLng.lat(), lng: event.latLng.lng()})
      }
    },
    [onChange],
  )

  const handleSelect = useCallback(
    (location: LatLng) => {
      onChange?.(location)
    },
    [onChange],
  )

  return (
    <Map
      mapId={MAP_ID}
      defaultCenter={center}
      defaultZoom={defaultZoom}
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
        <AdvancedMarker
          position={{lat: value.lat, lng: value.lng}}
          draggable={Boolean(onChange)}
          onDragEnd={handleMarkerDragEnd}
        />
      )}
    </Map>
  )
}
