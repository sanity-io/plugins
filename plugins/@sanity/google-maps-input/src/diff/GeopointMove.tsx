import {useRef} from 'react'
import {useUserColor, type ObjectDiff} from 'sanity'
import {Marker} from '../map/Marker'
import {Arrow} from '../map/Arrow'
import type {Geopoint} from '../types'

interface GeopointMoveProps {
  api: typeof window.google.maps
  map: google.maps.Map
  diff: ObjectDiff<Geopoint>
  label?: string
}

export function GeopointMove({diff, api, map, label}: GeopointMoveProps) {
  const {fromValue: from, toValue: to} = diff
  const annotation = diff.isChanged ? diff.annotation : undefined
  const userColor = useUserColor(annotation ? annotation.author : null) || undefined
  const fromRef = useRef<google.maps.Marker>(undefined)
  const toRef = useRef<google.maps.Marker>(undefined)

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
