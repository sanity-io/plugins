import {type MutableRefObject, useEffect} from 'react'

import type {LatLng} from '../types'

interface Props {
  api: typeof window.google.maps
  map: google.maps.Map
  from: LatLng
  to: LatLng
  color?: {background: string; border: string; text: string}
  zIndex?: number
  arrowRef?: MutableRefObject<google.maps.Polyline | undefined>
  onClick?: (event: google.maps.MapMouseEvent) => void
}

export function Arrow({api, map, from, to, color, zIndex, arrowRef, onClick}: Props) {
  useEffect(() => {
    const lineSymbol = {
      path: api.SymbolPath.FORWARD_OPEN_ARROW,
    }

    const line = new api.Polyline({
      map,
      zIndex,
      path: [from, to],
      icons: [{icon: lineSymbol, offset: '50%'}],
      strokeOpacity: 0.55,
      strokeColor: color ? color.text : 'black',
    })

    let clickHandler: google.maps.MapsEventListener | undefined
    if (onClick) {
      clickHandler = api.event.addListener(line, 'click', onClick)
    }

    if (arrowRef) {
      arrowRef.current = line
    }

    return () => {
      line.setMap(null)
      clickHandler?.remove()
      if (arrowRef) {
        arrowRef.current = undefined
      }
    }
  }, [api, map, from, to, color, zIndex, arrowRef, onClick])

  return null
}
