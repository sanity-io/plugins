import {type FC, useCallback} from 'react'
import {SearchInput} from '../map/SearchInput'
import {GoogleMap} from '../map/Map'
import {Marker} from '../map/Marker'
import type {LatLng, Geopoint} from '../types'

const fallbackLatLng: LatLng = {lat: 40.7058254, lng: -74.1180863}

interface SelectProps {
  api: typeof window.google.maps
  value?: Geopoint
  onChange?: (latLng: google.maps.LatLng) => void
  defaultLocation?: LatLng
  defaultZoom?: number
}

export const GeopointSelect: FC<SelectProps> = ({
  api,
  value,
  onChange,
  defaultLocation = {lng: 10.74609, lat: 59.91273},
  defaultZoom = 8,
}) => {
  const getCenter = useCallback(() => {
    const point: LatLng = {...fallbackLatLng, ...defaultLocation, ...value}
    return point
  }, [value, defaultLocation])

  const setValue = useCallback(
    (geoPoint: google.maps.LatLng) => {
      if (onChange) {
        onChange(geoPoint)
      }
    },
    [onChange],
  )

  const handlePlaceChanged = useCallback(
    (place: google.maps.places.PlaceResult) => {
      if (!place.geometry?.location) {
        return
      }
      setValue(place.geometry.location)
    },
    [setValue],
  )

  const handleMarkerDragEnd = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (event.latLng) setValue(event.latLng)
    },
    [setValue],
  )

  const handleMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (event.latLng) setValue(event.latLng)
    },
    [setValue],
  )

  return (
    <GoogleMap api={api} location={getCenter()} onClick={handleMapClick} defaultZoom={defaultZoom}>
      {(map) => (
        <>
          <SearchInput api={api} map={map} onChange={handlePlaceChanged} />
          {value && (
            <Marker
              api={api}
              map={map}
              position={value}
              onMove={onChange ? handleMarkerDragEnd : undefined}
            />
          )}
        </>
      )}
    </GoogleMap>
  )
}
