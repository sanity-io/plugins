import {type ReactElement, useEffect, useRef, useState} from 'react'

import type {LatLng} from '../types'
import {MapContainer} from './Map.styles'

interface MapProps {
  api: typeof window.google.maps
  location: LatLng
  bounds?: google.maps.LatLngBounds
  defaultZoom?: number
  mapTypeControl?: boolean
  scrollWheel?: boolean
  controlSize?: number
  onClick?: (event: google.maps.MapMouseEvent) => void
  children?: (map: google.maps.Map) => ReactElement
}

export function GoogleMap({
  api,
  location,
  bounds,
  defaultZoom = 8,
  mapTypeControl,
  scrollWheel = true,
  controlSize,
  onClick,
  children,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [map, setMap] = useState<google.maps.Map | undefined>(undefined)

  // Construct the map once, after the container element has mounted.
  useEffect(() => {
    const element = containerRef.current
    if (!element) {
      return
    }

    const newMap = new api.Map(element, {
      zoom: defaultZoom,
      center: new api.LatLng(location.lat, location.lng),
      scrollwheel: scrollWheel,
      streetViewControl: false,
      mapTypeControl,
      controlSize,
    })

    if (bounds) {
      newMap.fitBounds(bounds)
    }

    setMap(newMap)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!map || !onClick) {
      return undefined
    }

    const listener = api.event.addListener(map, 'click', onClick)
    return () => {
      listener.remove()
    }
  }, [api, map, onClick])

  useEffect(() => {
    if (!map) {
      return
    }

    map.panTo(new api.LatLng(location.lat, location.lng))
  }, [api, map, location.lat, location.lng])

  useEffect(() => {
    if (!map || !bounds) {
      return
    }

    map.fitBounds(bounds)
  }, [map, bounds])

  return (
    <>
      <MapContainer ref={containerRef} />
      {children && map ? children(map) : null}
    </>
  )
}
