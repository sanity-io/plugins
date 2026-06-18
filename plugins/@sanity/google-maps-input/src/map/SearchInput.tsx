import {TextInput} from '@sanity/ui'
import {createRef, PureComponent} from 'react'

import {WrapperContainer} from './SearchInput.styles'

interface Props {
  api: typeof window.google.maps
  map: google.maps.Map
  onChange: (result: google.maps.places.PlaceResult) => void
}

export class SearchInput extends PureComponent<Props> {
  searchInputRef = createRef<HTMLInputElement>()
  autoComplete: google.maps.places.Autocomplete | undefined
  placeChangedListener: google.maps.MapsEventListener | undefined

  handleChange = () => {
    if (!this.autoComplete) {
      return
    }

    this.props.onChange(this.autoComplete.getPlace())

    if (this.searchInputRef.current) {
      this.searchInputRef.current.value = ''
    }
  }

  override componentDidMount() {
    const input = this.searchInputRef.current
    if (!input) {
      return
    }

    const {api, map} = this.props
    const {Circle, places, event} = api
    const searchBounds = new Circle({center: map.getCenter(), radius: 100}).getBounds()!
    this.autoComplete = new places.Autocomplete(input, {
      bounds: searchBounds,
      types: [], // return all kinds of places
    })

    this.placeChangedListener = event.addListener(
      this.autoComplete,
      'place_changed',
      this.handleChange,
    )
  }

  override componentWillUnmount() {
    if (this.placeChangedListener) {
      this.placeChangedListener.remove()
    }

    if (this.autoComplete) {
      this.props.api.event.clearInstanceListeners(this.autoComplete)
    }
  }

  override render() {
    return (
      <WrapperContainer>
        <TextInput
          name="place"
          ref={this.searchInputRef}
          placeholder="Search for place or address"
          padding={4}
        />
      </WrapperContainer>
    )
  }
}
