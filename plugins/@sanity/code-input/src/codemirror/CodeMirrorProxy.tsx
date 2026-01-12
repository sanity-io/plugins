import {EditorView} from '@codemirror/view'
import {useRootTheme} from '@sanity/ui'
import CodeMirror, {type ReactCodeMirrorProps, type ReactCodeMirrorRef} from '@uiw/react-codemirror'
import {forwardRef, use, useCallback, useEffect, useMemo, useState} from 'react'

import {CodeInputLanguageModeLoaderContext} from './CodeModeContext'
import {defaultCodeModes} from './defaultCodeModes'
import {
  highlightLine,
  highlightState,
  setHighlightedLines,
} from './extensions/highlightLineExtension'
import {useThemeExtension} from './extensions/theme'
import {useCodeMirrorTheme} from './extensions/useCodeMirrorTheme'
import {useFontSizeExtension} from './extensions/useFontSize'

export interface CodeMirrorProps extends ReactCodeMirrorProps {
  highlightLines?: number[]
  languageMode?: string
  onHighlightChange?: (lines: number[]) => void
}

/**
 * CodeMirrorProxy is a wrapper component around CodeMirror that we lazy load to reduce initial bundle size.
 *
 * It is also responsible for integrating any CodeMirror extensions.
 */
const CodeMirrorProxy = forwardRef<ReactCodeMirrorRef, CodeMirrorProps>(
  function CodeMirrorProxy(props, ref) {
    const {
      basicSetup: basicSetupProp,
      highlightLines,
      languageMode,
      onHighlightChange,
      readOnly,
      value,
      ...codeMirrorProps
    } = props

    const themeCtx = useRootTheme()
    const codeMirrorTheme = useCodeMirrorTheme()
    const [editorView, setEditorView] = useState<EditorView | undefined>(undefined)

    // Resolve extensions
    const themeExtension = useThemeExtension()
    const fontSizeExtension = useFontSizeExtension({fontSize: 1})
    const languageExtension = useLanguageExtension(languageMode)
    const highlightLineExtension = useMemo(
      () =>
        highlightLine({
          onHighlightChange,
          readOnly,
          theme: themeCtx,
        }),
      [onHighlightChange, readOnly, themeCtx],
    )

    const extensions = useMemo(() => {
      const baseExtensions = [
        themeExtension,
        fontSizeExtension,
        highlightLineExtension,
        EditorView.lineWrapping,
      ]
      if (languageExtension) {
        return [...baseExtensions, languageExtension]
      }
      return baseExtensions
    }, [fontSizeExtension, highlightLineExtension, languageExtension, themeExtension])

    useEffect(() => {
      if (editorView) {
        setHighlightedLines(editorView, highlightLines ?? [])
      }
    }, [editorView, highlightLines, value])

    const [initialState] = useState(() => {
      return {
        json: {
          doc: value ?? '',
          selection: {
            main: 0,
            ranges: [{anchor: 0, head: 0}],
          },
          highlight: highlightLines ?? [],
        },
        fields: highlightState,
      }
    })

    const handleCreateEditor = useCallback((view: EditorView) => {
      setEditorView(view)
    }, [])

    const basicSetup = useMemo(
      () =>
        basicSetupProp ?? {
          highlightActiveLine: false,
        },
      [basicSetupProp],
    )

    return (
      <CodeMirror
        {...codeMirrorProps}
        value={value}
        ref={ref}
        extensions={extensions}
        theme={codeMirrorTheme}
        onCreateEditor={handleCreateEditor}
        initialState={initialState}
        basicSetup={basicSetup}
      />
    )
  },
)

function useLanguageExtension(mode?: string) {
  if (!mode) return undefined
  const languageModeLoader = use(CodeInputLanguageModeLoaderContext)
  return use(languageModeLoader(mode, defaultCodeModes))
}

export default CodeMirrorProxy
