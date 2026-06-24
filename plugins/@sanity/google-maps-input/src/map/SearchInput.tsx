import {useMap, useMapsLibrary} from '@vis.gl/react-google-maps'
import {useEffect, useRef} from 'react'

import type {LatLng} from '../types'
import {SearchInputContainer} from './SearchInput.styles'

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
  const ref = useRef<google.maps.places.PlaceAutocompleteElement | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    const handleSelect = async (event: Event) => {
      const {placePrediction} = event as google.maps.places.PlacePredictionSelectEvent
      const place = placePrediction.toPlace()
      await place.fetchFields({fields: ['location']})

      const location = place.location
      if (!location) {
        return
      }

      const latLng = {lat: location.lat(), lng: location.lng()}
      onSelect(latLng)
      map?.panTo(latLng)
    }

    element.addEventListener('gmp-select', handleSelect as EventListener)
    return () => element.removeEventListener('gmp-select', handleSelect as EventListener)
  }, [places, map, onSelect])

  if (!places) {
    return null
  }

  return (
    <SearchInputContainer>
      <gmp-place-autocomplete ref={ref} />
    </SearchInputContainer>
  )
}
