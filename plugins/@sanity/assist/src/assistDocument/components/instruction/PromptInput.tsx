import {Box} from '@sanity/ui'
import {useEffect, useRef} from 'react'
import {type ArrayOfObjectsInputProps, set, typed} from 'sanity'
import {styled} from 'styled-components'

import {randomKey} from '../../../_lib/randomKey'
import type {PromptBlock, PromptTextBlock} from '../../../types'

const PteMods = styled(Box)`
  & [data-testid='pt-editor__toolbar-card'] > div > div:last-child {
    display: none;
  }
  & [data-testid='pt-editor'] {
    min-height: 300px;
  }
  & [data-testid='pt-editor'] .pt-inline-object * {
    max-width: 400px;
  }
`

export function PromptInput(props: ArrayOfObjectsInputProps) {
  // quickfixes the model (converts blocks to inline blocks for alpha customers)
  // backend supports both types, but this prevents "missing block" schema errors
  useOnlyInlineBlocks(props)
  return <PteMods>{props.renderDefault(props)}</PteMods>
}

function useOnlyInlineBlocks(props: ArrayOfObjectsInputProps) {
  const {value, onChange} = props
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    valueRef.current = value
  }, [value])
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    let needsFix = false
    // oxlint-disable-next-line no-unsafe-type-assertion
    const val = ((valueRef.current as PromptBlock[]) ?? []).map((block) => {
      if (block._type === 'block') {
        return block
      }

      needsFix = true
      return typed<PromptTextBlock>({
        _key: randomKey(12),
        _type: 'block',
        level: 0,
        markDefs: [],
        style: 'normal',
        children: [block],
      })
    })

    if (needsFix) {
      onChangeRef.current(set(val))
    }
    // only run this once when loading the field
  }, [])
}
