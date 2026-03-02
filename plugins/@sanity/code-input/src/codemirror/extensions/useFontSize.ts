import type {Extension} from '@codemirror/state'
import {EditorView} from '@codemirror/view'
import {rem, useTheme} from '@sanity/ui'
import {useMemo} from 'react'

export function useFontSizeExtension(props: {fontSize: number}): Extension {
  const {fontSize: fontSizeProp} = props
  const theme = useTheme()

  return useMemo(() => {
    // TODO: when upgrading to @sanity/ui@4 start using the new tokens
    // oxlint-disable-next-line typescript/no-deprecated
    const {code: codeFont} = theme.sanity.fonts
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
