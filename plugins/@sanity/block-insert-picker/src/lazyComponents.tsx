import {lazy, Suspense} from 'react'

import type {BlockInsertPickerProps} from './blockInsertPicker'
import type {MarkdownInputRulesProps} from './markdownInputRules'

const BlockInsertPickerImplementation = lazy(() => import('./blockInsertPicker.lazy'))
const MarkdownInputRulesImplementation = lazy(() => import('./markdownInputRules.lazy'))

// Both render nothing until the picker opens, so they wait for their chunk under their own
// boundary instead of suspending the Portable Text input around them.

export function BlockInsertPicker(props: BlockInsertPickerProps) {
  return (
    <Suspense fallback={null}>
      <BlockInsertPickerImplementation {...props} />
    </Suspense>
  )
}

export function MarkdownInputRules(props: MarkdownInputRulesProps) {
  return (
    <Suspense fallback={null}>
      <MarkdownInputRulesImplementation {...props} />
    </Suspense>
  )
}
