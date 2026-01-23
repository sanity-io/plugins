import type {Extension} from '@codemirror/state'

import {tags as t} from '@lezer/highlight'
import {useTheme} from '@sanity/ui'
import {getTheme_v2, rgba} from '@sanity/ui/theme'
import {createTheme} from '@uiw/codemirror-themes'
import {useMemo} from 'react'

export function useCodeMirrorTheme(): Extension {
  const theme = useTheme()

  return useMemo(() => {
    const v2 = getTheme_v2({sanity: theme.sanity})
    const {code: codeFont} = v2.font
    const {syntax} = v2.color
    const dark = v2.color._dark

    return createTheme({
      theme: dark ? 'dark' : 'light',
      settings: {
        background: v2.color.bg,
        foreground: v2.color.code.fg,
        lineHighlight: v2.color.bg,
        fontFamily: codeFont.family,
        caret: v2.color.focusRing,
        selection: rgba(v2.color.focusRing, 0.2),
        selectionMatch: rgba(v2.color.focusRing, 0.4),
        gutterBackground: v2.color.muted.bg,
        gutterForeground: v2.color.code.fg,
        gutterActiveForeground: v2.color.fg,
      },
      styles: [
        {
          tag: [t.heading, t.heading2, t.heading3, t.heading4, t.heading5, t.heading6],
          color: v2.color.fg,
        },
        {tag: t.angleBracket, color: v2.color.code.fg},
        {tag: t.atom, color: syntax.keyword},
        {tag: t.attributeName, color: syntax.attrName},
        {tag: t.bool, color: syntax.boolean},
        {tag: t.bracket, color: v2.color.code.fg},
        {tag: t.className, color: syntax.className},
        {tag: t.comment, color: syntax.comment},
        {tag: t.definition(t.typeName), color: syntax.function},
        {
          tag: [
            t.definition(t.variableName),
            t.function(t.variableName),
            t.className,
            t.attributeName,
          ],
          color: syntax.function,
        },
        {tag: [t.function(t.propertyName), t.propertyName], color: syntax.function},
        {tag: t.keyword, color: syntax.keyword},
        {tag: t.null, color: syntax.number},
        {tag: t.number, color: syntax.number},
        {tag: t.meta, color: v2.color.code.fg},
        {tag: t.operator, color: syntax.operator},
        {tag: t.propertyName, color: syntax.property},
        {tag: [t.string, t.special(t.brace)], color: syntax.string},
        {tag: t.tagName, color: syntax.className},
        {tag: t.typeName, color: syntax.keyword},
      ],
    })
  }, [theme])
}
