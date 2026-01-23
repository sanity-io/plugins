import type {Extension} from '@codemirror/state'

import {EditorView} from '@codemirror/view'
import {useTheme} from '@sanity/ui'
import {rgba} from '@sanity/ui/theme'
import {useMemo} from 'react'

export function useThemeExtension(): Extension {
  const theme = useTheme()
  // Use default tone for dark/light schemes since we don't have context here
  const fallbackTone = 'default'

  return useMemo(() => {
    // For accessing color schemes, we need to use the old structure since Theme.sanity.v2
    // doesn't provide access to both light and dark schemes (Theme_v2.color is a single scheme)
    // oxlint-disable-next-line typescript-eslint/no-deprecated, typescript-eslint/no-unsafe-type-assertion
    const darkScheme = (theme.sanity.color as any).dark[fallbackTone]
    // oxlint-disable-next-line typescript-eslint/no-deprecated, typescript-eslint/no-unsafe-type-assertion
    const lightScheme = (theme.sanity.color as any).light[fallbackTone]

    return EditorView.baseTheme({
      '&.cm-editor': {
        height: '100%',
      },
      '&.cm-editor.cm-focused': {
        outline: 'none',
      },

      // Matching brackets
      '&.cm-editor.cm-focused .cm-matchingBracket': {
        backgroundColor: 'transparent',
      },
      '&.cm-editor.cm-focused .cm-nonmatchingBracket': {
        backgroundColor: 'transparent',
      },
      '&dark.cm-editor.cm-focused .cm-matchingBracket': {
        outline: `1px solid ${darkScheme.border}`,
      },
      '&dark.cm-editor.cm-focused .cm-nonmatchingBracket': {
        outline: `1px solid ${darkScheme.border}`,
      },
      '&light.cm-editor.cm-focused .cm-matchingBracket': {
        outline: `1px solid ${lightScheme.border}`,
      },
      '&light.cm-editor.cm-focused .cm-nonmatchingBracket': {
        outline: `1px solid ${lightScheme.border}`,
      },

      // Size and padding of gutter
      '& .cm-lineNumbers .cm-gutterElement': {
        minWidth: `32px !important`,
        padding: `0 8px !important`,
      },
      '& .cm-gutter.cm-foldGutter': {
        width: `0px !important`,
      },

      // Color of gutter
      '&dark .cm-gutters': {
        color: `${rgba(darkScheme.code.fg, 0.5)} !important`,
        borderRight: `1px solid ${rgba(darkScheme.border, 0.5)}`,
      },
      '&light .cm-gutters': {
        color: `${rgba(lightScheme.code.fg, 0.5)} !important`,
        borderRight: `1px solid ${rgba(lightScheme.border, 0.5)}`,
      },
    })
  }, [theme])
}
