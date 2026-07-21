import {defineSchema, EditorProvider, useEditor} from '@portabletext/editor'
import {act, render} from '@testing-library/react'
import React, {useEffect} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {createPickerBehavior} from './pickerBehavior'
import type {PickerIntent, PickerState} from './types'

const schemaDefinition = defineSchema({
  annotations: [],
  blockObjects: [{name: 'callout'}],
  decorators: [],
  inlineObjects: [],
  lists: [],
  styles: [{name: 'normal'}],
})

const initialValueWithObjectBlock = [
  {
    _key: 'first-text',
    _type: 'block',
    children: [{_key: 'first-text-span', _type: 'span', marks: [], text: 'intro'}],
    markDefs: [],
    style: 'normal',
  },
  {_key: 'focused-callout', _type: 'callout'},
]

function HarnessRegister({
  onIntent,
  shortcutEnabled = true,
  stateRef,
}: {
  onIntent: (intent: PickerIntent) => void
  shortcutEnabled?: boolean
  stateRef: React.RefObject<PickerState>
}) {
  const editor = useEditor()
  useEffect(() => {
    const behavior = createPickerBehavior({
      getState: () => stateRef.current,
      isShortcutEnabled: () => shortcutEnabled,
      onIntent,
    })
    const unregister = editor.registerBehavior({behavior})
    return unregister
  }, [editor, onIntent, shortcutEnabled, stateRef])
  return null
}

// Exposes the Editor instance through a React ref so the test can call
// editor.send() without mutating a variable inside render.
const CaptureEditor = React.forwardRef<null | ReturnType<typeof useEditor>, object>(
  function CaptureEditor(_, ref) {
    const editor = useEditor()
    React.useImperativeHandle(ref, () => editor, [editor])
    return null
  },
)

function renderHarness(
  initialValue?: typeof initialValueWithObjectBlock,
  options?: {shortcutEnabled?: boolean},
) {
  const editorRef = React.createRef<null | ReturnType<typeof useEditor>>()
  const onIntent = vi.fn<(intent: PickerIntent) => void>()
  const stateRef = {current: {mode: 'closed'} as PickerState}
  render(
    <EditorProvider initialConfig={{initialValue, schemaDefinition}}>
      <CaptureEditor ref={editorRef} />
      <HarnessRegister
        onIntent={onIntent}
        shortcutEnabled={options?.shortcutEnabled}
        stateRef={stateRef}
      />
    </EditorProvider>,
  )
  const editor = editorRef.current!
  return {editor, onIntent, stateRef}
}

/** Flush the editor machine's value-sync so a seeded initialValue is live. */
async function waitForValue(editor: ReturnType<typeof useEditor>, firstKey: string) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (editor.getSnapshot().context.value[0]?._key === firstKey) break
    // Polling is inherently sequential: each pass yields to the editor's
    // value-sync actor before re-checking.
    // oxlint-disable-next-line no-await-in-loop
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5))
    })
  }
  expect(editor.getSnapshot().context.value[0]?._key).toBe(firstKey)
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

describe('createPickerBehavior', () => {
  it("opens in slash mode when '/' is typed at the start of an empty block", () => {
    const {editor, onIntent} = renderHarness()
    act(() => {
      editor.send({text: '/', type: 'insert.text'})
    })
    expect(onIntent).toHaveBeenCalledWith(
      expect.objectContaining({mode: 'slash', query: '/', type: 'open'}),
    )
  })

  it('opens in shortcut mode on Cmd+/', () => {
    const {editor, onIntent} = renderHarness()
    act(() => {
      editor.send({
        originEvent: {
          altKey: false,
          code: 'Slash',
          ctrlKey: false,
          key: '/',
          metaKey: true,
          shiftKey: false,
        },
        type: 'keyboard.keydown',
      })
    })
    expect(onIntent).toHaveBeenCalledWith(
      expect.objectContaining({mode: 'shortcut', query: '', type: 'open'}),
    )
  })

  it('ignores Cmd+/ when the shortcut is disabled', () => {
    const {editor, onIntent} = renderHarness(undefined, {shortcutEnabled: false})
    act(() => {
      editor.send({
        originEvent: {
          altKey: false,
          code: 'Slash',
          ctrlKey: false,
          key: '/',
          metaKey: true,
          shiftKey: false,
        },
        type: 'keyboard.keydown',
      })
    })
    expect(onIntent).not.toHaveBeenCalled()
  })

  it('anchors shortcut mode to the focused block object, not the first block', async () => {
    // Cmd+/ with an image/callout selected must insert relative to that
    // block; falling back to the document's first block puts the insert far
    // from where the editor is working.
    const {editor, onIntent} = renderHarness(initialValueWithObjectBlock)
    await waitForValue(editor, 'first-text')
    const point = {offset: 0, path: [{_key: 'focused-callout'}]}
    act(() => {
      editor.send({at: {anchor: point, focus: point}, type: 'select'})
    })
    onIntent.mockClear()
    act(() => {
      editor.send({
        originEvent: {
          altKey: false,
          code: 'Slash',
          ctrlKey: false,
          key: '/',
          metaKey: true,
          shiftKey: false,
        },
        type: 'keyboard.keydown',
      })
    })
    expect(onIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        anchorBlockKey: 'focused-callout',
        mode: 'shortcut',
        type: 'open',
      }),
    )
  })

  it('forwards subsequent typing as updateQuery while in slash mode', () => {
    const {editor, onIntent, stateRef} = renderHarness()
    stateRef.current = {
      anchorBlockKey: 'anchor',
      highlightedIndex: 0,
      mode: 'slash',
      query: '/',
    }
    onIntent.mockClear()
    act(() => {
      editor.send({text: 'c', type: 'insert.text'})
    })
    expect(onIntent).toHaveBeenCalledWith({query: '/c', type: 'updateQuery'})
  })

  it('emits navigate / select / close on arrow / enter / escape when open', () => {
    const {editor, onIntent, stateRef} = renderHarness()
    stateRef.current = {
      anchorBlockKey: 'anchor',
      highlightedIndex: 0,
      mode: 'slash',
      query: '/',
    }
    onIntent.mockClear()
    function press(key: string) {
      act(() => {
        editor.send({
          originEvent: {
            altKey: false,
            code: key,
            ctrlKey: false,
            key,
            metaKey: false,
            shiftKey: false,
          },
          type: 'keyboard.keydown',
        })
      })
    }
    press('ArrowDown')
    press('ArrowUp')
    press('Enter')
    press('Escape')
    expect(onIntent.mock.calls.map((c) => c[0])).toEqual([
      {delta: 1, type: 'navigate'},
      {delta: -1, type: 'navigate'},
      {type: 'select'},
      {type: 'close'},
    ])
  })

  it('emits close on ArrowLeft / ArrowRight while open (caret moves off the query)', () => {
    const {editor, onIntent, stateRef} = renderHarness()
    stateRef.current = {
      anchorBlockKey: 'anchor',
      highlightedIndex: 0,
      mode: 'slash',
      query: '/',
    }
    onIntent.mockClear()
    for (const key of ['ArrowLeft', 'ArrowRight']) {
      act(() => {
        editor.send({
          originEvent: {
            altKey: false,
            code: key,
            ctrlKey: false,
            key,
            metaKey: false,
            shiftKey: false,
          },
          type: 'keyboard.keydown',
        })
      })
    }
    expect(onIntent.mock.calls.map((c) => c[0])).toEqual([{type: 'close'}, {type: 'close'}])
  })

  it('emits close on Home / End / PageUp / PageDown while open (caret jumps off the query)', () => {
    const {editor, onIntent, stateRef} = renderHarness()
    stateRef.current = {
      anchorBlockKey: 'anchor',
      highlightedIndex: 0,
      mode: 'slash',
      query: '/',
    }
    onIntent.mockClear()
    for (const key of ['Home', 'End', 'PageUp', 'PageDown']) {
      act(() => {
        editor.send({
          originEvent: {
            altKey: false,
            code: key,
            ctrlKey: false,
            key,
            metaKey: false,
            shiftKey: false,
          },
          type: 'keyboard.keydown',
        })
      })
    }
    expect(onIntent.mock.calls.map((c) => c[0])).toEqual([
      {type: 'close'},
      {type: 'close'},
      {type: 'close'},
      {type: 'close'},
    ])
  })

  it('emits close on delete.forward while open (edits content ahead of the caret, not the query)', () => {
    const {editor, onIntent, stateRef} = renderHarness()
    stateRef.current = {
      anchorBlockKey: 'anchor',
      highlightedIndex: 0,
      mode: 'slash',
      query: '/',
    }
    onIntent.mockClear()
    act(() => {
      editor.send({type: 'delete.forward', unit: 'character'})
    })
    expect(onIntent).toHaveBeenCalledWith({type: 'close'})
  })

  it('captures typed characters into the shortcut query without inserting them', () => {
    // Shortcut-mode type-to-filter: the query is picker-only state, so the
    // character must be blocked from ever reaching the document.
    const {editor, onIntent, stateRef} = renderHarness()
    stateRef.current = {
      anchorBlockKey: 'anchor',
      highlightedIndex: 0,
      mode: 'shortcut',
      query: '',
    }
    onIntent.mockClear()
    const valueBefore = JSON.stringify(editor.getSnapshot().context.value)
    act(() => {
      editor.send({text: 'c', type: 'insert.text'})
    })
    expect(onIntent).toHaveBeenCalledWith({query: 'c', type: 'updateQuery'})
    expect(JSON.stringify(editor.getSnapshot().context.value)).toBe(valueBefore)
  })

  it('captures spaces into the shortcut query (titles contain spaces)', () => {
    const {editor, onIntent, stateRef} = renderHarness()
    stateRef.current = {
      anchorBlockKey: 'anchor',
      highlightedIndex: 0,
      mode: 'shortcut',
      query: 'card',
    }
    onIntent.mockClear()
    act(() => {
      editor.send({text: ' ', type: 'insert.text'})
    })
    expect(onIntent).toHaveBeenCalledWith({
      query: 'card ',
      type: 'updateQuery',
    })
  })

  it('shrinks the shortcut query on backspace without touching the document', () => {
    const {editor, onIntent, stateRef} = renderHarness()
    stateRef.current = {
      anchorBlockKey: 'anchor',
      highlightedIndex: 0,
      mode: 'shortcut',
      query: 'co',
    }
    onIntent.mockClear()
    const valueBefore = JSON.stringify(editor.getSnapshot().context.value)
    act(() => {
      editor.send({type: 'delete.backward', unit: 'character'})
    })
    expect(onIntent).toHaveBeenCalledWith({query: 'c', type: 'updateQuery'})
    expect(JSON.stringify(editor.getSnapshot().context.value)).toBe(valueBefore)
  })

  it('clears the whole shortcut query on word deletes', () => {
    const {editor, onIntent, stateRef} = renderHarness()
    stateRef.current = {
      anchorBlockKey: 'anchor',
      highlightedIndex: 0,
      mode: 'shortcut',
      query: 'code',
    }
    onIntent.mockClear()
    act(() => {
      editor.send({type: 'delete.backward', unit: 'word'})
    })
    expect(onIntent).toHaveBeenCalledWith({query: '', type: 'updateQuery'})
  })

  it('closes on backspace in shortcut mode when the query is empty, without deleting content', () => {
    const {editor, onIntent, stateRef} = renderHarness()
    stateRef.current = {
      anchorBlockKey: 'anchor',
      highlightedIndex: 0,
      mode: 'shortcut',
      query: '',
    }
    onIntent.mockClear()
    act(() => {
      editor.send({type: 'delete.backward', unit: 'character'})
    })
    expect(onIntent).toHaveBeenCalledWith({type: 'close'})
  })

  it('shrinks the slash query on backspace while the deletion proceeds in the document', () => {
    // Slash-mode query text lives in the document; backspace deletes the
    // last typed character there, so the query shrinks in sync instead of
    // closing and stranding a half-typed filter.
    const {editor, onIntent, stateRef} = renderHarness()
    stateRef.current = {
      anchorBlockKey: 'anchor',
      highlightedIndex: 0,
      mode: 'slash',
      query: '/co',
    }
    onIntent.mockClear()
    act(() => {
      editor.send({type: 'delete.backward', unit: 'character'})
    })
    expect(onIntent).toHaveBeenCalledWith({query: '/c', type: 'updateQuery'})
  })

  it('closes on word deletes in slash mode (deletion can outrun the query)', () => {
    const {editor, onIntent, stateRef} = renderHarness()
    stateRef.current = {
      anchorBlockKey: 'anchor',
      highlightedIndex: 0,
      mode: 'slash',
      query: '/co',
    }
    onIntent.mockClear()
    act(() => {
      editor.send({type: 'delete.backward', unit: 'word'})
    })
    expect(onIntent).toHaveBeenCalledWith({type: 'close'})
  })

  it('emits close when a space is typed while open', () => {
    const {editor, onIntent, stateRef} = renderHarness()
    stateRef.current = {
      anchorBlockKey: 'anchor',
      highlightedIndex: 0,
      mode: 'slash',
      query: '/',
    }
    onIntent.mockClear()
    act(() => {
      editor.send({text: ' ', type: 'insert.text'})
    })
    expect(onIntent).toHaveBeenCalledWith({type: 'close'})
  })

  it('emits close on backspace when only the opening slash remains', () => {
    const {editor, onIntent, stateRef} = renderHarness()
    stateRef.current = {
      anchorBlockKey: 'anchor',
      highlightedIndex: 0,
      mode: 'slash',
      query: '/',
    }
    onIntent.mockClear()
    act(() => {
      editor.send({type: 'delete.backward', unit: 'character'})
    })
    expect(onIntent).toHaveBeenCalledWith({type: 'close'})
  })
})
