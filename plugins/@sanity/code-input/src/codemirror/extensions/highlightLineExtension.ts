import {
  type ChangeDesc,
  type Extension,
  type Range,
  StateEffect,
  StateField,
  type Text,
  type Transaction,
} from '@codemirror/state'
import {Decoration, type DecorationSet, EditorView, lineNumbers} from '@codemirror/view'
import type {ThemeContextValue} from '@sanity/ui'
import {rgba} from '@sanity/ui/theme'
import {ExternalChange} from '@uiw/react-codemirror'

import {getBackwardsCompatibleTone} from './backwardsCompatibleTone'

const highlightLineClass = 'cm-highlight-line'

const addLineHighlight = StateEffect.define<number>()
const removeLineHighlight = StateEffect.define<number>()

const lineHighlightField = StateField.define({
  create() {
    return Decoration.none
  },
  update(lines, tr) {
    if (tr.docChanged) {
      lines = mapLineHighlights(lines, tr)
    }
    for (const e of tr.effects) {
      if (e.is(addLineHighlight)) {
        lines = lines.update({add: [lineHighlightMark.range(e.value)]})
      }
      if (e.is(removeLineHighlight)) {
        lines = lines.update({
          filter: (from) => {
            // removeLineHighlight value is lineStart for the highlight, so keep other effects
            return from !== e.value
          },
        })
      }
    }
    return lines
  },
  toJSON(value, state) {
    return getHighlightedLines(value, state.doc)
  },
  fromJSON(value: number[], state) {
    const lines = state.doc.lines
    const highlights = value
      .filter((line) => line <= lines) // one-indexed
      .map((line) => lineHighlightMark.range(state.doc.line(line).from))
    highlights.sort((a, b) => a.from - b.from)
    try {
      return Decoration.none.update({
        add: highlights,
      })
    } catch (e) {
      console.error(e)
      return Decoration.none
    }
  },
  provide: (f) => EditorView.decorations.from(f),
})

const lineHighlightMark = Decoration.line({
  class: highlightLineClass,
})

function isRemoved(changes: ChangeDesc, from: number, to: number): boolean {
  let pos = from
  changes.iterChangedRanges((fromA, toA) => {
    if (fromA <= pos && toA > pos) {
      pos = toA
    }
  })
  return pos >= to
}

/**
 * Moves highlights to the line their content ends up on, and drops them only when their line
 * is deleted (its content and one of its line breaks are removed). `DecorationSet.map` keeps
 * line decorations in front of text inserted at the start of the line, and drops them when
 * the line break before the line is deleted.
 */
function mapLineHighlights(lines: DecorationSet, tr: Transaction): DecorationSet {
  const {changes, startState} = tr
  const doc = startState.doc
  const ranges: Range<Decoration>[] = []
  const iter = lines.iter()
  while (iter.value) {
    const line = doc.lineAt(iter.from)
    const lineBreakRemoved =
      (line.from > 0 && isRemoved(changes, line.from - 1, line.from)) ||
      (line.to < doc.length && isRemoved(changes, line.to, line.to + 1))
    if (!lineBreakRemoved || !isRemoved(changes, line.from, line.to)) {
      const from = tr.newDoc.lineAt(changes.mapPos(line.from, 1)).from
      if (ranges.at(-1)?.from !== from) {
        ranges.push(lineHighlightMark.range(from))
      }
    }
    iter.next()
  }
  return Decoration.set(ranges)
}

function getHighlightedLines(lines: DecorationSet, doc: Text): number[] {
  const highlightLines: number[] = []
  const iter = lines.iter()
  while (iter.value) {
    const lineNumber = doc.lineAt(iter.from).number
    if (!highlightLines.includes(lineNumber)) {
      highlightLines.push(lineNumber)
    }
    iter.next()
  }
  return highlightLines
}

/**
 * Reports highlighted lines that moved because the code was edited, so the stored line
 * numbers follow the highlighted content.
 */
function highlightChangeListener(onHighlightChange: (lines: number[]) => void): Extension {
  return EditorView.updateListener.of((update) => {
    // Values synced from outside the editor come with their own highlighted lines
    if (!update.docChanged || update.transactions.some((tr) => tr.annotation(ExternalChange))) {
      return
    }
    const previous = getHighlightedLines(
      update.startState.field(lineHighlightField),
      update.startState.doc,
    )
    const next = getHighlightedLines(update.state.field(lineHighlightField), update.state.doc)
    if (previous.length !== next.length || previous.some((line, i) => line !== next[i])) {
      onHighlightChange(next)
    }
  })
}

export const highlightState: {
  [prop: string]: StateField<DecorationSet>
} = {
  highlight: lineHighlightField,
}

export interface HighlightLineConfig {
  onHighlightChange?: (lines: number[]) => void
  readOnly?: boolean
  theme: ThemeContextValue
}

function createCodeMirrorTheme(options: {themeCtx: ThemeContextValue}) {
  const {themeCtx} = options

  const fallbackTone = getBackwardsCompatibleTone(themeCtx)

  // TODO: when upgrading to @sanity/ui@4 start using the new tokens
  // oxlint-disable-next-line typescript/no-deprecated
  const dark = {color: themeCtx.theme.color.dark[fallbackTone]}
  // oxlint-disable-next-line typescript/no-deprecated
  const light = {color: themeCtx.theme.color.light[fallbackTone]}

  return EditorView.baseTheme({
    '.cm-lineNumbers': {
      cursor: 'default',
    },
    '.cm-line.cm-line': {
      position: 'relative',
    },

    // need set background with pseudoelement so it does not render over selection color
    [`.${highlightLineClass}::before`]: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: -3,
      content: "''",
      boxSizing: 'border-box',
    },
    [`&dark .${highlightLineClass}::before`]: {
      background: rgba(dark.color.muted.caution.pressed.bg, 0.5),
    },
    [`&light .${highlightLineClass}::before`]: {
      background: rgba(light.color.muted.caution.pressed.bg, 0.75),
    },
  })
}

export const highlightLine = (config: HighlightLineConfig): Extension => {
  const highlightTheme = createCodeMirrorTheme({themeCtx: config.theme})

  return [
    lineHighlightField,
    config.readOnly
      ? []
      : lineNumbers({
          domEventHandlers: {
            mousedown: (editorView, lineInfo) => {
              // Determine if the line for the clicked gutter line number has highlighted state or not
              const line = editorView.state.doc.lineAt(lineInfo.from)
              let isHighlighted = false
              editorView.state
                .field(lineHighlightField)
                .between(line.from, line.to, (_from, _to, value) => {
                  if (value) {
                    isHighlighted = true
                    return false // stop iteration
                  }
                  return undefined
                })

              if (isHighlighted) {
                editorView.dispatch({effects: removeLineHighlight.of(line.from)})
              } else {
                editorView.dispatch({effects: addLineHighlight.of(line.from)})
              }
              if (config?.onHighlightChange) {
                config.onHighlightChange(editorView.state.toJSON(highlightState).highlight)
              }
              return true
            },
          },
        }),
    config.readOnly || !config.onHighlightChange
      ? []
      : highlightChangeListener(config.onHighlightChange),
    highlightTheme,
  ]
}

/**
 * Adds and removes highlights to the provided view using highlightLines
 * @param view
 * @param highlightLines
 */
export function setHighlightedLines(view: EditorView, highlightLines: number[]): void {
  const doc = view.state.doc
  const lines = doc.lines
  //1-based line numbers
  const allLineNumbers = Array.from({length: lines}, (_x, i) => i + 1)
  view.dispatch({
    effects: allLineNumbers.map((lineNumber) => {
      const line = doc.line(lineNumber)
      if (highlightLines?.includes(lineNumber)) {
        return addLineHighlight.of(line.from)
      }
      return removeLineHighlight.of(line.from)
    }),
  })
}
