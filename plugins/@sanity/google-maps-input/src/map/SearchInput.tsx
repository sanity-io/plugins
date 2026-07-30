import {useMap, useMapsLibrary} from '@vis.gl/react-google-maps'

import type {LatLng} from '../types'

import {searchInput} from './SearchInput.css'

interface Props {
  onSelect: (location: LatLng) => void
}

/**
 * Place search using the `<gmp-place-autocomplete>` web component (Places API
 * New). The element is provided by the `places` library, so we wait for it to
 * load before rendering, then listen for the `gmp-select` event.
 */
export function SearchInput({onSelect}: Props) {
  const places = useMapsLibrary('places')
  const map = useMap()

  if (!places) {
    return null
  }

  return (
    <gmp-place-autocomplete
      className={searchInput}
      ongmp-select={async ({placePrediction}: google.maps.places.PlacePredictionSelectEvent) => {
        const place = placePrediction.toPlace()
        await place.fetchFields({fields: ['location']})

        const location = place.location
        if (!location) {
          return
        }

        const latLng = {lat: location.lat(), lng: location.lng()}
        onSelect(latLng)
        map?.panTo(latLng)
      }}
    />
  )
}
