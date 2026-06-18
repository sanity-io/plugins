import {TextInput} from '@sanity/ui'
import {useEffect, useEffectEvent, useRef} from 'react'

import {WrapperContainer} from './SearchInput.styles'

interface Props {
  api: typeof window.google.maps
  map: google.maps.Map
  onChange: (result: google.maps.places.PlaceResult) => void
}

export function SearchInput({api, map, onChange}: Props) {
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handlePlaceChanged = useEffectEvent((autoComplete: google.maps.places.Autocomplete) => {
    onChange(autoComplete.getPlace())

    if (searchInputRef.current) {
      searchInputRef.current.value = ''
    }
  })

  useEffect(() => {
    const input = searchInputRef.current
    if (!input) {
      return undefined
    }

    const {Circle, places, event} = api
    const searchBounds = new Circle({center: map.getCenter(), radius: 100}).getBounds()!
    const autoComplete = new places.Autocomplete(input, {
      bounds: searchBounds,
      types: [], // return all kinds of places
    })

    const listener = event.addListener(autoComplete, 'place_changed', () => {
      handlePlaceChanged(autoComplete)
    })

    return () => {
      listener.remove()
    }
  }, [api, map])

  return (
    <WrapperContainer>
      <TextInput
        name="place"
        ref={searchInputRef}
        placeholder="Search for place or address"
        padding={4}
      />
    </WrapperContainer>
  )
}
