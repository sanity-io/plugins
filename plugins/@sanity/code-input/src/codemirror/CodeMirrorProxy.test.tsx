import {EditorView} from '@codemirror/view'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, cleanup, render, screen, waitFor} from '@testing-library/react'
import {useCallback, useState} from 'react'
import {afterEach, describe, expect, test, vi} from 'vitest'

import CodeMirrorProxy from './CodeMirrorProxy'

// jsdom has no matchMedia; @sanity/ui's ThemeProvider queries it for the
// prefers-color-scheme lookup.
// oxlint-disable no-unsafe-type-assertion
window.matchMedia ??= ((query: string) =>
  ({
    addEventListener: () => {},
    addListener: () => {},
    dispatchEvent: () => false,
    matches: false,
    media: query,
    onchange: null,
    removeEventListener: () => {},
    removeListener: () => {},
  }) as unknown as MediaQueryList) as typeof window.matchMedia
// oxlint-enable no-unsafe-type-assertion

const theme = buildTheme()

const noop = () => {}

/**
 * Wires the editor like `CodeInput` does: code and highlighted lines are written to the
 * document value, which is passed back to the editor as props.
 */
function CodeInputHarness(props: {
  initialCode: string
  initialHighlightedLines: number[]
  onHighlightChange?: (lines: number[]) => void
}) {
  const {initialCode, initialHighlightedLines, onHighlightChange} = props
  const [code, setCode] = useState(initialCode)
  const [highlightedLines, setHighlightedLines] = useState(initialHighlightedLines)
  const handleHighlightChange = useCallback(
    (lines: number[]) => {
      setHighlightedLines(lines)
      onHighlightChange?.(lines)
    },
    [onHighlightChange],
  )

  return (
    <ThemeProvider theme={theme}>
      <CodeMirrorProxy
        languageMode="text"
        value={code}
        onChange={setCode}
        highlightLines={highlightedLines}
        onHighlightChange={handleHighlightChange}
      />
      <output data-testid="highlighted-lines">{highlightedLines.join(',')}</output>
    </ThemeProvider>
  )
}

/**
 * An editor whose code and highlighted lines only change through props, like when the
 * document is edited somewhere else.
 */
function ExternallyControlledEditor(props: {
  value: string
  highlightLines: number[]
  onHighlightChange: (lines: number[]) => void
}) {
  return (
    <ThemeProvider theme={theme}>
      <CodeMirrorProxy languageMode="text" onChange={noop} {...props} />
    </ThemeProvider>
  )
}

function getEditorView(container: HTMLElement): EditorView {
  const editor = container.querySelector<HTMLElement>('.cm-editor')
  const view = editor ? EditorView.findFromDOM(editor) : null
  if (!view) {
    throw new Error('Could not find the CodeMirror editor')
  }
  return view
}

function getHighlightedLineText(container: HTMLElement): (string | null)[] {
  return Array.from(container.querySelectorAll('.cm-highlight-line'), (line) => line.textContent)
}

function typeText(view: EditorView, from: number, insert: string) {
  act(() => {
    view.dispatch({
      changes: {from, insert},
      selection: {anchor: from + insert.length},
      userEvent: 'input.type',
    })
  })
}

afterEach(() => {
  cleanup()
})

describe('highlighted lines', () => {
  test('follow their content when a line is inserted above them', () => {
    const {container} = render(
      <CodeInputHarness initialCode={'first\nsecond\nthird'} initialHighlightedLines={[2]} />,
    )
    expect(getHighlightedLineText(container)).toEqual(['second'])

    const view = getEditorView(container)
    typeText(view, view.state.doc.line(1).to, '\n')

    expect(view.state.doc.toString()).toBe('first\n\nsecond\nthird')
    expect(getHighlightedLineText(container)).toEqual(['second'])
    expect(screen.getByTestId('highlighted-lines').textContent).toBe('3')
  })

  test('follow their content when a line above them is deleted', () => {
    const {container} = render(
      <CodeInputHarness initialCode={'first\nsecond\nthird'} initialHighlightedLines={[3]} />,
    )
    expect(getHighlightedLineText(container)).toEqual(['third'])

    const view = getEditorView(container)
    act(() => {
      view.dispatch({
        changes: {from: view.state.doc.line(1).from, to: view.state.doc.line(2).from},
        userEvent: 'delete.selection',
      })
    })

    expect(view.state.doc.toString()).toBe('second\nthird')
    expect(getHighlightedLineText(container)).toEqual(['third'])
    expect(screen.getByTestId('highlighted-lines').textContent).toBe('2')
  })

  test('are not written back when an edit keeps them on the same lines', () => {
    const onHighlightChange = vi.fn()
    const {container} = render(
      <CodeInputHarness
        initialCode={'first\nsecond\nthird'}
        initialHighlightedLines={[2]}
        onHighlightChange={onHighlightChange}
      />,
    )

    const view = getEditorView(container)
    typeText(view, view.state.doc.line(2).to, ' line')

    expect(getHighlightedLineText(container)).toEqual(['second line'])
    expect(onHighlightChange).not.toHaveBeenCalled()
  })

  test('are not written back when the value is replaced from outside the editor', () => {
    const onHighlightChange = vi.fn()
    const {container, rerender} = render(
      <ExternallyControlledEditor
        value={'first\nsecond\nthird'}
        highlightLines={[2]}
        onHighlightChange={onHighlightChange}
      />,
    )
    expect(getHighlightedLineText(container)).toEqual(['second'])

    rerender(
      <ExternallyControlledEditor
        value={'zero\nfirst\nsecond\nthird'}
        highlightLines={[3]}
        onHighlightChange={onHighlightChange}
      />,
    )

    expect(getHighlightedLineText(container)).toEqual(['second'])
    expect(onHighlightChange).not.toHaveBeenCalled()
  })

  test('are applied to a value replaced from outside the editor right after typing', async () => {
    const onHighlightChange = vi.fn()
    const {container, rerender} = render(
      <ExternallyControlledEditor
        value={'first\nsecond\nthird'}
        highlightLines={[2]}
        onHighlightChange={onHighlightChange}
      />,
    )
    const view = getEditorView(container)
    typeText(view, view.state.doc.line(3).to, '!')

    // @uiw/react-codemirror holds back value props that arrive while typing, and applies them
    // once typing pauses
    rerender(
      <ExternallyControlledEditor
        value={'zero\nfirst\nsecond\nthird'}
        highlightLines={[3]}
        onHighlightChange={onHighlightChange}
      />,
    )
    expect(view.state.doc.toString()).toBe('first\nsecond\nthird!')
    await waitFor(() => expect(view.state.doc.toString()).toBe('zero\nfirst\nsecond\nthird'), {
      timeout: 2_000,
    })

    expect(getHighlightedLineText(container)).toEqual(['second'])
    expect(onHighlightChange).not.toHaveBeenCalled()
  })
})
