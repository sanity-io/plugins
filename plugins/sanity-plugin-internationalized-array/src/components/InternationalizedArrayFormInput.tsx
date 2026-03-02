import {Stack} from '@sanity/ui'
import type {ObjectInputProps} from 'sanity'

import type {PluginConfig} from '../types'
import DocumentAddButtons from './DocumentAddButtons'

/**
 * An input component for the root object of an internationalized array.
 * It renders the document add buttons if the buttonLocations include 'document'.
 */
export function InternationalizedArrayFormInput(
  props: ObjectInputProps & {pluginConfig: PluginConfig},
) {
  const showDocumentButtons = props.pluginConfig?.buttonLocations?.includes('document')

  if (showDocumentButtons) {
    return (
      <Stack space={5}>
        <DocumentAddButtons value={props.value} />
        {props.renderDefault(props)}
      </Stack>
    )
  }
  return props.renderDefault(props)
}
