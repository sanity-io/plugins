import {type MutableRefObject, useEffect, useRef} from 'react'

import type {LatLng} from '../types'

const markerPath =
  'M 3.052 3.7 C 1.56 5.293 0.626 7.612 0.663 9.793 C 0.738 14.352 2.793 16.077 6.078 22.351 C 7.263 25.111 8.497 28.032 9.672 32.871 C 9.835 33.584 9.994 34.246 10.069 34.305 C 10.143 34.362 10.301 33.697 10.465 32.983 C 11.639 28.145 12.875 25.226 14.059 22.466 C 17.344 16.192 19.398 14.466 19.474 9.908 C 19.511 7.727 18.574 5.405 17.083 3.814 C 15.379 1.994 12.809 0.649 10.069 0.593 C 7.328 0.536 4.756 1.882 3.052 3.7 Z'

interface Props {
  api: typeof window.google.maps
  map: google.maps.Map
  onMove?: (event: google.maps.MapMouseEvent) => void
  onClick?: (event: google.maps.MapMouseEvent) => void
  position: LatLng | google.maps.LatLng
  zIndex?: number
  opacity?: number
  label?: string
  markerRef?: MutableRefObject<google.maps.Marker | undefined>
  color?: {background: string; border: string; text: string}
}

export function Marker({
  api,
  map,
  onMove,
  onClick,
  position,
  zIndex,
  opacity,
  label,
  markerRef,
  color,
}: Props) {
  const markerInstanceRef = useRef<google.maps.Marker | undefined>(undefined)

  // Create the marker once on mount and remove it on unmount. Subsequent prop
  // changes are applied imperatively in the effects below; recreating the marker
  // would interrupt dragging and invalidate `markerRef` for consumers.
  useEffect(() => {
    let icon: google.maps.Symbol | undefined
    if (color) {
      icon = {
        path: markerPath,
        fillOpacity: 1,
        fillColor: color.background,
        strokeColor: color.border,
        strokeWeight: 2,
        anchor: new api.Point(10, 35),
        labelOrigin: new api.Point(10, 11),
      }
    }

    const marker = new api.Marker({
      draggable: Boolean(onMove),
      position,
      map,
      zIndex,
      opacity,
      label,
      icon,
    })

    markerInstanceRef.current = marker

    if (markerRef) {
      markerRef.current = marker
    }

    return () => {
      marker.setMap(null)
      markerInstanceRef.current = undefined
      if (markerRef) {
        markerRef.current = undefined
      }
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    markerInstanceRef.current?.setPosition(position)
  }, [position])

  useEffect(() => {
    markerInstanceRef.current?.setLabel(label || null)
  }, [label])

  useEffect(() => {
    markerInstanceRef.current?.setZIndex(zIndex ?? null)
  }, [zIndex])

  useEffect(() => {
    markerInstanceRef.current?.setOpacity(opacity ?? null)
  }, [opacity])

  useEffect(() => {
    markerInstanceRef.current?.setMap(map)
  }, [map])

  useEffect(() => {
    const marker = markerInstanceRef.current
    if (!marker || !onMove) {
      return undefined
    }

    const listener = api.event.addListener(marker, 'dragend', onMove)
    return () => {
      listener.remove()
    }
  }, [api, onMove])

  useEffect(() => {
    const marker = markerInstanceRef.current
    if (!marker || !onClick) {
      return undefined
    }

    const listener = api.event.addListener(marker, 'click', onClick)
    return () => {
      listener.remove()
    }
  }, [api, onClick])

  return null
}
