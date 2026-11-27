import {Stack} from '@sanity/ui'
import {lazy, Suspense} from 'react'
import type {ObjectInputProps} from 'sanity'

import type {PluginConfig} from '../types'

// It imports `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`, which must stay
// out of what the studio shell loads.
const DocumentAddButtons = lazy(() => import('./DocumentAddButtons'))

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
      <Stack gap={5}>
        <Suspense fallback={null}>
          <DocumentAddButtons />
        </Suspense>
        {props.renderDefault(props)}
      </Stack>
    )
  }
  return props.renderDefault(props)
}
