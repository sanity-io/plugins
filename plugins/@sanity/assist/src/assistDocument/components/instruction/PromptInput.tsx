import {Box} from '@sanity/ui'
import {useEffect} from 'react'
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
  useEffect(() => {
    let needsFix = false
    // oxlint-disable-next-line no-unsafe-type-assertion
    const val = ((props.value as PromptBlock[]) ?? []).map((block) => {
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
      props.onChange(set(val))
    }
    // only run this once when loading the field
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
