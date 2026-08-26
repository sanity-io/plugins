import {Text} from '@sanity/ui'
import prettyBytes from 'pretty-bytes'
import prettyMilliseconds from 'pretty-ms'

import type {ShopifyFile} from '../types'
import {extractName} from '../utils/helpers'
import {DurationLine, InfoLine} from './File.styled'

export default function File({data}: {data: ShopifyFile}) {
  const filename = extractName(data.url)
  const {meta} = data

  return (
    <>
      <InfoLine padding={2} radius={2} margin={2}>
        <Text size={1} title={`Select ${filename}`}>
          {filename} {meta.fileSize ? `(${prettyBytes(meta.fileSize)})` : null}
        </Text>
      </InfoLine>
      {meta.duration ? (
        <DurationLine padding={2} radius={2} margin={2}>
          <Text size={1} title={`Video duration: ${filename}`}>
            {prettyMilliseconds(meta.duration, {colonNotation: true, secondsDecimalDigits: 0})}
          </Text>
        </DurationLine>
      ) : null}
    </>
  )
}
