import {ImageIcon} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'
import {useState} from 'react'

import {getGeopointRadiusStaticMapUrl, getGeopointStaticMapUrl} from '../map/staticMapUrl'
import type {Geopoint, GeopointRadius} from '../types'
import {useGeoConfig} from './GeoConfigContext'
import {MapDiffImage, MapDiffPlaceholder} from './StaticMapDiffPreview.styles'

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
  const config = useGeoConfig()
  const [failed, setFailed] = useState(false)

  if (!value || typeof value.lat !== 'number' || typeof value.lng !== 'number' || !config?.apiKey) {
    return null
  }

  if (failed) {
    return (
      <MapDiffPlaceholder>
        <Flex align="center" gap={2} justify="center" padding={3}>
          <Text muted size={1}>
            <ImageIcon />
          </Text>
          <Text muted size={1}>
            Map preview unavailable
          </Text>
        </Flex>
      </MapDiffPlaceholder>
    )
  }

  const url = hasRadius(value)
    ? getGeopointRadiusStaticMapUrl(value, config.apiKey, {width: 500, height: 280})
    : getGeopointStaticMapUrl(value, config.apiKey, {width: 500, height: 280})

  return (
    <MapDiffImage>
      <img alt="Map preview" src={url} onError={() => setFailed(true)} />
    </MapDiffImage>
  )
}
