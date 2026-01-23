import type {Extension} from '@codemirror/state'

import {EditorView} from '@codemirror/view'
import {rem, useTheme} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {useMemo} from 'react'

export function useFontSizeExtension(props: {fontSize: number}): Extension {
  const {fontSize: fontSizeProp} = props
  const theme = useTheme()

  return useMemo(() => {
    const v2 = getTheme_v2({sanity: theme.sanity})
    const {code: codeFont} = v2.font
    const {fontSize, lineHeight} = codeFont.sizes[fontSizeProp] || codeFont.sizes[2]!

    return EditorView.baseTheme({
      '&': {
        fontSize: rem(fontSize),
      },

      '& .cm-scroller': {
        lineHeight: `${lineHeight / fontSize} !important`,
      },
    })
  }, [fontSizeProp, theme])
}
