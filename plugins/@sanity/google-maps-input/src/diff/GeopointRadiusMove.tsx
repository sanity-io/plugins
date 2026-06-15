import {useRef, useEffect} from 'react'
import {useUserColor, type ObjectDiff} from 'sanity'
import {Marker} from '../map/Marker'
import {Arrow} from '../map/Arrow'
import type {GeopointRadius} from '../types'

interface GeopointRadiusMoveProps {
  api: typeof window.google.maps
  map: google.maps.Map
  diff: ObjectDiff<GeopointRadius>
  label?: string
}

export function GeopointRadiusMove({diff, api, map, label}: GeopointRadiusMoveProps) {
  const {fromValue: from, toValue: to} = diff
  const annotation = diff.isChanged ? diff.annotation : undefined
  const userColor = useUserColor(annotation ? annotation.author : null) || undefined
  const fromRef = useRef<google.maps.Marker>(undefined)
  const toRef = useRef<google.maps.Marker>(undefined)
  const fromCircleRef = useRef<google.maps.Circle>(undefined)
  const toCircleRef = useRef<google.maps.Circle>(undefined)

  // Create circles for radius visualization
  useEffect(() => {
    const color = userColor?.background || '#4285F4'

    if (from && from.radius) {
      fromCircleRef.current = new api.Circle({
        map,
        center: {lat: from.lat, lng: from.lng},
        radius: from.radius,
        fillColor: color,
        fillOpacity: 0.1,
        strokeColor: color,
        strokeOpacity: 0.3,
        strokeWeight: 1,
        zIndex: 0,
      })
    }

    if (to && to.radius) {
      toCircleRef.current = new api.Circle({
        map,
        center: {lat: to.lat, lng: to.lng},
        radius: to.radius,
        fillColor: color,
        fillOpacity: 0.2,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        zIndex: 2,
      })
    }

    return () => {
      if (fromCircleRef.current) {
        fromCircleRef.current.setMap(null)
      }
      if (toCircleRef.current) {
        toCircleRef.current.setMap(null)
      }
    }
  }, [api, map, from, to, userColor])

  return (
    <>
      {from && (
        <Marker
          api={api}
          map={map}
          position={from}
          zIndex={0}
          opacity={0.55}
          markerRef={fromRef}
          color={userColor}
        />
      )}
      {from && to && <Arrow api={api} map={map} from={from} to={to} zIndex={1} color={userColor} />}
      {to && (
        <Marker
          api={api}
          map={map}
          position={to}
          zIndex={2}
          markerRef={toRef}
          label={label}
          color={userColor}
        />
      )}
    </>
  )
}
