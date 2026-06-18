import {createRef, PureComponent, type ReactElement} from 'react'

import type {LatLng} from '../types'
import {MapContainer} from './Map.styles'
import {latLngAreEqual} from './util'

interface MapProps {
  api: typeof window.google.maps
  location: LatLng
  bounds?: google.maps.LatLngBounds
  defaultZoom?: number
  mapTypeControl?: boolean
  scrollWheel?: boolean
  controlSize?: number
  onClick?: (event: google.maps.MapMouseEvent) => void
  onZoomChange?: (zoom: number) => void
  children?: (map: google.maps.Map) => ReactElement
}

interface MapState {
  map: google.maps.Map | undefined
}

export class GoogleMap extends PureComponent<MapProps, MapState> {
  static defaultProps = {
    defaultZoom: 8,
    scrollWheel: true,
  }

  override state: MapState = {map: undefined}
  clickHandler: google.maps.MapsEventListener | undefined
  zoomHandler: google.maps.MapsEventListener | undefined
  mapRef = createRef<HTMLDivElement>()
  mapEl: HTMLDivElement | null = null

  override componentDidMount() {
    this.attachClickHandler()
  }

  attachClickHandler = () => {
    const map = this.state.map
    if (!map) {
      return
    }

    const {api, onClick, onZoomChange} = this.props
    const {event} = api

    if (this.clickHandler) {
      this.clickHandler.remove()
    }

    if (this.zoomHandler) {
      this.zoomHandler.remove()
    }

    if (onClick) {
      this.clickHandler = event.addListener(map, 'click', onClick)
    }

    if (onZoomChange) {
      this.zoomHandler = event.addListener(map, 'zoom_changed', this.handleZoomChange)
    }
  }

  handleZoomChange = () => {
    const zoom = this.state.map?.getZoom()
    if (this.props.onZoomChange && Number.isInteger(zoom)) {
      this.props.onZoomChange(zoom!)
    }
  }

  override componentDidUpdate(prevProps: MapProps) {
    const map = this.state.map
    if (!map) {
      return
    }

    const {onClick, onZoomChange, location, bounds} = this.props

    if (prevProps.onClick !== onClick || prevProps.onZoomChange !== onZoomChange) {
      this.attachClickHandler()
    }

    if (!latLngAreEqual(prevProps.location, location)) {
      map.panTo(this.getCenter())
    }

    if (bounds && (!prevProps.bounds || !bounds.equals(prevProps.bounds))) {
      map.fitBounds(bounds)
    }
  }

  override componentWillUnmount() {
    if (this.clickHandler) {
      this.clickHandler.remove()
    }

    if (this.zoomHandler) {
      this.zoomHandler.remove()
    }
  }

  getCenter(): google.maps.LatLng {
    const {location, api} = this.props
    return new api.LatLng(location.lat, location.lng)
  }

  constructMap(el: HTMLDivElement) {
    const {defaultZoom, api, mapTypeControl, controlSize, bounds, scrollWheel} = this.props

    const map = new api.Map(el, {
      zoom: defaultZoom,
      center: this.getCenter(),
      scrollwheel: scrollWheel,
      streetViewControl: false,
      mapTypeControl,
      controlSize,
    })

    if (bounds) {
      map.fitBounds(bounds)
    }

    return map
  }

  setMapElement = (element: HTMLDivElement | null) => {
    if (element && element !== this.mapEl) {
      const map = this.constructMap(element)
      this.setState({map}, this.attachClickHandler)
    }

    this.mapEl = element
  }

  override render() {
    const {children} = this.props
    const {map} = this.state
    return (
      <>
        <MapContainer ref={this.setMapElement} />
        {children && map ? children(map) : null}
      </>
    )
  }
}
