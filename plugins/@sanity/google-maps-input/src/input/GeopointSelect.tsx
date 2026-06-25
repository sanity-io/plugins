import {
  AdvancedMarker,
  ControlPosition,
  Map,
  type MapCameraChangedEvent,
  type MapMouseEvent,
  MapControl,
} from '@vis.gl/react-google-maps'
import {useCallback, useRef} from 'react'

import {MAP_ID} from '../map/constants'
import {SearchInput} from '../map/SearchInput'
import type {Geopoint, LatLng} from '../types'

const fallbackLatLng: LatLng = {lat: 40.7058254, lng: -74.1180863}
const defaultMapLocation: LatLng = {lng: 10.74609, lat: 59.91273}

interface SelectProps {
  value?: Geopoint
  onChange?: (latLng: LatLng) => void
  onZoomChange?: (zoom: number) => void
  defaultLocation?: LatLng
  defaultZoom?: number
}

export function GeopointSelect({
  value,
  onChange,
  onZoomChange,
  defaultLocation = defaultMapLocation,
  defaultZoom = 8,
}: SelectProps) {
  const center: LatLng = {
    ...fallbackLatLng,
    ...defaultLocation,
    ...(value ? {lat: value.lat, lng: value.lng} : {}),
  }

  // Seed with the zoom the map opens at so the initial `zoom_changed` the Maps
  // API emits on load doesn't write a value before the user interacts. Only
  // genuine, distinct integer zoom levels get persisted.
  const lastZoomRef = useRef(Math.round(defaultZoom))

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

  const handleZoomChanged = useCallback(
    (event: MapCameraChangedEvent) => {
      if (!onZoomChange) return
      const zoom = Math.round(event.detail.zoom)
      if (zoom !== lastZoomRef.current) {
        lastZoomRef.current = zoom
        onZoomChange(zoom)
      }
    },
    [onZoomChange],
  )

  return (
    <Map
      mapId={MAP_ID}
      defaultCenter={center}
      defaultZoom={defaultZoom}
      onClick={handleMapClick}
      onZoomChanged={onZoomChange ? handleZoomChanged : undefined}
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
