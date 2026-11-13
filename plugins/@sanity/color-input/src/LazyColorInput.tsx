import {Box, Text} from '@sanity/ui'
import {lazy, Suspense} from 'react'
import {type ObjectInputProps} from 'sanity'

const ColorInputLazy = lazy(() => import('./ColorInput'))

const fallback = (
  <Box padding={3}>
    <Text>Loading color input...</Text>
  </Box>
)

/**
 * The document form suspends as one tree, and that tree includes the field
 * group tabs. Loading the picker here keeps that fallback inside the field,
 * so the tabs stay mounted and keep the width they already measured.
 */
export function ColorInput(props: ObjectInputProps) {
  return (
    <Suspense fallback={fallback}>
      <ColorInputLazy {...props} />
    </Suspense>
  )
}
