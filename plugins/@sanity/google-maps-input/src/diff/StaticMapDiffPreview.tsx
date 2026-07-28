// oxlint-disable typescript/no-unsafe-type-assertion - legacy code will be lint-cleaned in a follow-up PR
import {ImageIcon} from '@sanity/icons/Image'
import {Flex, Text} from '@sanity/ui'
import {use, useState} from 'react'

import {getGeopointRadiusStaticMapUrl, getGeopointStaticMapUrl} from '../map/staticMapUrl'
import type {Geopoint, GeopointRadius} from '../types'
import {GoogleMapsInputContext} from './GeoConfigContext'

import {mapDiffImage, mapDiffPlaceholder} from './StaticMapDiffPreview.css'

type MapValue = Geopoint | GeopointRadius

function hasRadius(value: MapValue): value is GeopointRadius {
  return typeof (value as GeopointRadius).radius === 'number'
}

/**
 * Renders the static map image for a single side of a geopoint/geopointRadius
 * diff. Used as the `previewComponent` for `DiffFromTo`, mirroring how the
 * built-in image diff shows a before/after thumbnail.
 */
export function StaticMapDiffPreview({value}: {value?: MapValue}) {
  const [failed, setFailed] = useState(false)
  const apiKey = use(GoogleMapsInputContext)?.apiKey

  if (!value || typeof value.lat !== 'number' || typeof value.lng !== 'number' || !apiKey) {
    return null
  }

  if (failed) {
    return (
      <div className={mapDiffPlaceholder}>
        <Flex align="center" gap={2} justify="center" padding={3}>
          <Text muted size={1}>
            <ImageIcon />
          </Text>
          <Text muted size={1}>
            Map preview unavailable
          </Text>
        </Flex>
      </div>
    )
  }

  const url = hasRadius(value)
    ? getGeopointRadiusStaticMapUrl(value, apiKey, {width: 500, height: 280})
    : getGeopointStaticMapUrl(value, apiKey, {width: 500, height: 280})

  return (
    <img
      className={mapDiffImage}
      alt=""
      src={url}
      onError={() => setFailed(true)}
      height={280}
      width={500}
    />
  )
}
