import type {Extension} from '@codemirror/state'

import {EditorView} from '@codemirror/view'
import {useRootTheme} from '@sanity/ui'
import {rgba} from '@sanity/ui/theme'
import {useMemo} from 'react'

import {getBackwardsCompatibleTone} from './backwardsCompatibleTone'

export function useThemeExtension(): Extension {
  const themeCtx = useRootTheme()

  return useMemo(() => {
    // Get the tone from context or fall back to 'default' for backwards compatibility
    const tone = getBackwardsCompatibleTone(themeCtx)

    // Access the color schemes directly from the RootTheme
    // themeCtx.theme.color contains both 'dark' and 'light' color schemes
    // Each scheme contains tones like 'default', 'primary', etc.
    // oxlint-disable-next-line typescript/no-deprecated
    const colorSchemes = themeCtx.theme.color as Record<string, Record<string, any>>
    const darkScheme = colorSchemes['dark']?.[tone]
    const lightScheme = colorSchemes['light']?.[tone]

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
        outline: `1px solid ${darkScheme?.border ?? '#333'}`,
      },
      '&dark.cm-editor.cm-focused .cm-nonmatchingBracket': {
        outline: `1px solid ${darkScheme?.border ?? '#333'}`,
      },
      '&light.cm-editor.cm-focused .cm-matchingBracket': {
        outline: `1px solid ${lightScheme?.border ?? '#ccc'}`,
      },
      '&light.cm-editor.cm-focused .cm-nonmatchingBracket': {
        outline: `1px solid ${lightScheme?.border ?? '#ccc'}`,
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
        color: `${rgba(darkScheme?.code?.fg ?? '#888', 0.5)} !important`,
        borderRight: `1px solid ${rgba(darkScheme?.border ?? '#333', 0.5)}`,
      },
      '&light .cm-gutters': {
        color: `${rgba(lightScheme?.code?.fg ?? '#888', 0.5)} !important`,
        borderRight: `1px solid ${rgba(lightScheme?.border ?? '#ccc', 0.5)}`,
      },
    })
  }, [themeCtx])
}
