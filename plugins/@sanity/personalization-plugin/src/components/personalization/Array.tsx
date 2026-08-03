import {Button, Inline, Stack} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {useCallback} from 'react'

import type {PersonalizationArrayInputProps, VariantType} from '../../types'
import {usePersonalizationContext} from './Context'

export const ArrayInput = (props: PersonalizationArrayInputProps) => {
  const {onItemAppend, segmentName, segmentId} = props

  const {segments} = usePersonalizationContext()

  const handleClick = useCallback(
    async (segment: VariantType) => {
      const item = {
        _key: uuid(),
        [segmentId]: segment.id,
        _type: segmentName,
      }

      // Patch the document
      onItemAppend(item)
    },
    [segmentId, segmentName, onItemAppend],
  )

  type Value = {
    value?: unknown
    [key: string]: unknown
    segmentId: string
    _key: string
    _type: string
  }

  const values = (props.value as Value[]) || []

  const usedSegments = values?.map((segment) => segment[segmentId])

  return (
    <Stack gap={3}>
      {props.renderDefault({...props, arrayFunctions: () => null})}

      <Inline gap={1}>
        {segments.map((segment) => {
          return (
            <Button
              key={segment.id}
              text={`Add ${segment.label}`}
              mode="ghost"
              disabled={usedSegments?.includes(segment.id)}
              onClick={() => handleClick(segment)}
            />
          )
        })}
      </Inline>
    </Stack>
  )
}
