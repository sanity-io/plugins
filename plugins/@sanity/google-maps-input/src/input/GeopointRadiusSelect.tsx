import React, {type FC, useCallback, useEffect, useRef} from 'react'
import {SearchInput} from '../map/SearchInput'
import {GoogleMap} from '../map/Map'
import {Marker} from '../map/Marker'
import type {LatLng, GeopointRadius} from '../types'

const fallbackLatLng: LatLng = {lat: 40.7058254, lng: -74.1180863}

// Component to sync marker drag with circle position
const MarkerDragSync: FC<{
  api: typeof window.google.maps
  marker: google.maps.Marker
  circleRef: React.MutableRefObject<google.maps.Circle | null>
  isMarkerDragging: React.MutableRefObject<boolean>
}> = ({api, marker, circleRef, isMarkerDragging}) => {
  useEffect(() => {
    const handleDrag = () => {
      isMarkerDragging.current = true
    }

    const handleDragEnd = () => {
      isMarkerDragging.current = false
    }

    const dragListener = api.event.addListener(marker, 'drag', handleDrag)
    const dragEndListener = api.event.addListener(marker, 'dragend', handleDragEnd)

    return () => {
      api.event.removeListener(dragListener)
      api.event.removeListener(dragEndListener)
    }
  }, [api, marker, circleRef, isMarkerDragging])

  return null
}

interface SelectProps {
  api: typeof window.google.maps
  value?: GeopointRadius
  onChange?: (latLng: google.maps.LatLng, radius?: number) => void
  defaultLocation?: LatLng
  defaultRadiusZoom?: number
  defaultRadius?: number
}

export const GeopointRadiusSelect: FC<SelectProps> = ({
  api,
  value,
  onChange,
  defaultLocation = {lng: 10.74609, lat: 59.91273},
  defaultRadiusZoom = 12,
  defaultRadius = 1000,
}) => {
  const circleRef = useRef<google.maps.Circle | null>(null)
  const markerRef = useRef<google.maps.Marker | undefined>(undefined)
  const isMarkerDragging = useRef(false)

  const getCenter = useCallback(() => {
    const point: LatLng = {...fallbackLatLng, ...defaultLocation, ...value}
    return point
  }, [value, defaultLocation])

  const setValue = useCallback(
    (geoPoint: google.maps.LatLng, radius?: number) => {
      if (onChange) {
        const roundedRadius = radius ? Math.round(radius) : undefined
        onChange(geoPoint, roundedRadius)
      }
    },
    [onChange],
  )

  const handlePlaceChanged = useCallback(
    (place: google.maps.places.PlaceResult) => {
      if (!place.geometry?.location) {
        return
      }
      setValue(place.geometry.location, value?.radius || defaultRadius)
    },
    [setValue, value?.radius, defaultRadius],
  )

  const handleMarkerDragEnd = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        // Update circle position when marker drag ends
        if (circleRef.current) {
          circleRef.current.setCenter(event.latLng)
        }
        setValue(event.latLng, value?.radius || defaultRadius)
      }
    },
    [setValue, value?.radius, defaultRadius],
  )

  const handleMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        setValue(event.latLng, value?.radius || defaultRadius)
      }
    },
    [setValue, value?.radius, defaultRadius],
  )

  // Create or update circle when value changes
  useEffect(() => {
    if (value && circleRef.current) {
      circleRef.current.setCenter({lat: value.lat, lng: value.lng})
      circleRef.current.setRadius(value.radius)
    }
  }, [value])

  return (
    <GoogleMap
      api={api}
      location={getCenter()}
      onClick={handleMapClick}
      defaultZoom={defaultRadiusZoom}
    >
      {(map) => {
        // Create circle if it doesn't exist and we have a value
        if (value && !circleRef.current) {
          circleRef.current = new api.Circle({
            map,
            center: {lat: value.lat, lng: value.lng},
            radius: value.radius,
            fillColor: '#4285F4',
            fillOpacity: 0.2,
            strokeColor: '#4285F4',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            editable: true,
          })

          // Add event listeners for circle interactions
          circleRef.current.addListener('center_changed', () => {
            if (circleRef.current && markerRef.current && !isMarkerDragging.current) {
              // When circle center is dragged, move the marker to match
              const circleCenter = circleRef.current.getCenter()
              if (circleCenter) {
                markerRef.current.setPosition(circleCenter)
              }
            }
          })

          circleRef.current.addListener('radius_changed', () => {
            if (circleRef.current) {
              const center = circleRef.current.getCenter()
              const radius = circleRef.current.getRadius()
              if (center) {
                setValue(center, Math.round(radius))
              }
            }
          })

          circleRef.current.addListener('dragend', () => {
            if (circleRef.current) {
              const center = circleRef.current.getCenter()
              const radius = circleRef.current.getRadius()
              if (center) {
                setValue(center, Math.round(radius))
              }
            }
          })
        }

        return (
          <>
            <SearchInput api={api} map={map} onChange={handlePlaceChanged} />
            {value && (
              <Marker
                api={api}
                map={map}
                position={value}
                onMove={onChange ? handleMarkerDragEnd : undefined}
                markerRef={markerRef}
              />
            )}
            {/* Add drag event listener to marker for circle sync */}
            {value && markerRef.current && (
              <MarkerDragSync
                api={api}
                marker={markerRef.current}
                circleRef={circleRef}
                isMarkerDragging={isMarkerDragging}
              />
            )}
          </>
        )
      }}
    </GoogleMap>
  )
}
