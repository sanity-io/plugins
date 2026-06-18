import {type FC, useCallback, useEffect, useRef} from 'react'

import {GoogleMap} from '../map/Map'
import {Marker} from '../map/Marker'
import {SearchInput} from '../map/SearchInput'
import type {LatLng, GeopointRadius} from '../types'

const fallbackLatLng: LatLng = {lat: 40.7058254, lng: -74.1180863}

const defaultMapLocation: LatLng = {lng: 10.74609, lat: 59.91273}

interface MapContentProps {
  api: typeof window.google.maps
  map: google.maps.Map
  value?: GeopointRadius
  onChange?: (latLng: google.maps.LatLng, radius?: number) => void
  defaultRadius: number
}

// Renders the search box, marker and editable radius circle for a given map.
// All Google Maps objects are created/destroyed inside effects (not during
// render) so listeners are always cleaned up when the dialog closes.
const MapContent: FC<MapContentProps> = ({api, map, value, onChange, defaultRadius}) => {
  const circleRef = useRef<google.maps.Circle | null>(null)
  const markerRef = useRef<google.maps.Marker | undefined>(undefined)
  const isMarkerDragging = useRef(false)

  // Keep the latest onChange/value reachable from long-lived Google Maps
  // listeners without re-creating those listeners on every render.
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)
  useEffect(() => {
    onChangeRef.current = onChange
    valueRef.current = value
  })

  const setValue = useCallback((geoPoint: google.maps.LatLng, radius?: number) => {
    const handleChange = onChangeRef.current
    if (handleChange) {
      handleChange(geoPoint, radius ? Math.round(radius) : undefined)
    }
  }, [])

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
      if (!event.latLng) {
        return
      }
      // Keep the circle aligned with the marker when the marker is dragged.
      if (circleRef.current) {
        circleRef.current.setCenter(event.latLng)
      }
      setValue(event.latLng, value?.radius || defaultRadius)
    },
    [setValue, value?.radius, defaultRadius],
  )

  const hasValue = Boolean(value)

  // Create the editable circle once a value exists, and tear it down (with its
  // listeners) when the value is removed or the component unmounts.
  useEffect(() => {
    if (!hasValue) {
      return undefined
    }

    const initial = valueRef.current
    const circle = new api.Circle({
      map,
      center: {lat: initial?.lat ?? 0, lng: initial?.lng ?? 0},
      radius: initial?.radius || defaultRadius,
      fillColor: '#4285F4',
      fillOpacity: 0.2,
      strokeColor: '#4285F4',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      editable: true,
    })
    circleRef.current = circle

    const listeners = [
      circle.addListener('center_changed', () => {
        // When the circle center is dragged, move the marker to match (unless
        // the marker itself is the thing being dragged).
        if (markerRef.current && !isMarkerDragging.current) {
          const center = circle.getCenter()
          if (center) {
            markerRef.current.setPosition(center)
          }
        }
      }),
      circle.addListener('radius_changed', () => {
        const center = circle.getCenter()
        if (center) {
          setValue(center, circle.getRadius())
        }
      }),
      circle.addListener('dragend', () => {
        const center = circle.getCenter()
        if (center) {
          setValue(center, circle.getRadius())
        }
      }),
    ]

    return () => {
      for (const listener of listeners) {
        listener.remove()
      }
      circle.setMap(null)
      circleRef.current = null
    }
  }, [api, map, hasValue, defaultRadius, setValue])

  // Keep the circle in sync when the stored value changes.
  useEffect(() => {
    if (value && circleRef.current) {
      circleRef.current.setCenter({lat: value.lat, lng: value.lng})
      circleRef.current.setRadius(value.radius)
    }
  }, [value])

  // Track marker dragging so the circle's center_changed handler doesn't fight
  // the user while they drag the marker. Runs after the marker has mounted.
  useEffect(() => {
    if (!hasValue) {
      return undefined
    }
    const marker = markerRef.current
    if (!marker) {
      return undefined
    }
    const dragListener = api.event.addListener(marker, 'drag', () => {
      isMarkerDragging.current = true
    })
    const dragEndListener = api.event.addListener(marker, 'dragend', () => {
      isMarkerDragging.current = false
    })
    return () => {
      api.event.removeListener(dragListener)
      api.event.removeListener(dragEndListener)
    }
  }, [api, hasValue])

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
    </>
  )
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
  defaultLocation = defaultMapLocation,
  defaultRadiusZoom = 12,
  defaultRadius = 1000,
}) => {
  const getCenter = useCallback(() => {
    const point: LatLng = {...fallbackLatLng, ...defaultLocation, ...value}
    return point
  }, [value, defaultLocation])

  const setValue = useCallback(
    (geoPoint: google.maps.LatLng, radius?: number) => {
      if (onChange) {
        onChange(geoPoint, radius ? Math.round(radius) : undefined)
      }
    },
    [onChange],
  )

  const handleMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        setValue(event.latLng, value?.radius || defaultRadius)
      }
    },
    [setValue, value?.radius, defaultRadius],
  )

  return (
    <GoogleMap
      api={api}
      location={getCenter()}
      onClick={handleMapClick}
      defaultZoom={defaultRadiusZoom}
    >
      {(map) => (
        <MapContent
          api={api}
          map={map}
          value={value}
          onChange={onChange}
          defaultRadius={defaultRadius}
        />
      )}
    </GoogleMap>
  )
}
