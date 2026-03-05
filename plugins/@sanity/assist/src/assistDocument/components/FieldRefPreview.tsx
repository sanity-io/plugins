import {Box, Flex, Text} from '@sanity/ui'
import {useContext} from 'react'
import type {PreviewProps} from 'sanity'

import {InlineBlockValueContext} from '../../assistFormComponents/AssistInlineFormBlock'
import {useSelectedField} from '../../assistInspector/helpers'
import {SelectedFieldContext} from './SelectedFieldContext'

export function FieldRefPreview(props: PreviewProps & {path?: string}) {
  const {actions} = props
  const documentSchema = useContext(SelectedFieldContext)?.documentSchema
  // oxlint-disable-next-line no-unsafe-type-assertion
  const path = (useContext(InlineBlockValueContext) as {path?: string})?.path ?? props.path
  const selectedField = useSelectedField(documentSchema, path)
  return (
    <Flex gap={2} align="center" style={{width: '100%'}}>
      <Flex flex={1} gap={2} align="center" paddingY={3} paddingX={1}>
        <Box>
          <Text size={1} textOverflow="ellipsis">
            {selectedField?.title ?? 'Select field'}
          </Text>
        </Box>
      </Flex>
      {/* oxlint-disable-next-line no-unsafe-type-assertion */}
      {actions as any}
    </Flex>
  )
}
