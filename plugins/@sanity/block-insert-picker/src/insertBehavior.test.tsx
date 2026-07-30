import {defineSchema, EditorProvider, useEditor} from '@portabletext/editor'
import {getTextBlockText, isTextBlock} from '@portabletext/editor/utils'
import {act, render} from '@testing-library/react'
import React, {useEffect} from 'react'
import type {PortableTextBlock} from 'sanity'
import {describe, expect, it} from 'vitest'

import {createInsertBehavior, sendInsertPickerItem} from './insertBehavior'

const schemaDefinition = defineSchema({
  annotations: [],
  blockObjects: [{name: 'callout'}],
  decorators: [],
  inlineObjects: [],
  lists: [],
  styles: [{name: 'normal'}],
})

function HarnessRegister() {
  const editor = useEditor()
  useEffect(() => {
    const unregister = editor.registerBehavior({
      behavior: createInsertBehavior(),
    })
    return unregister
  }, [editor])
  return null
}

const CaptureEditor = React.forwardRef<null | ReturnType<typeof useEditor>, object>(
  function CaptureEditor(_, ref) {
    const editor = useEditor()
    React.useImperativeHandle(ref, () => editor, [editor])
    return null
  },
)

function blockTypes(editor: ReturnType<typeof useEditor>): string[] {
  return editor.getSnapshot().context.value.map((block) => block._type)
}

async function renderHarness(initialValue: PortableTextBlock[]) {
  const editorRef = React.createRef<null | ReturnType<typeof useEditor>>()
  render(
    <EditorProvider initialConfig={{initialValue, schemaDefinition}}>
      <CaptureEditor ref={editorRef} />
      <HarnessRegister />
    </EditorProvider>,
  )
  // The editor machine stays in its setup state (dropping behavior events and
  // the seeded initialValue) until the value-sync actor finishes, which takes
  // a variable number of tasks. Wait until the seeded value is observable,
  // then flush one more task so the machine's editable-state transition (which
  // follows the sync) has also settled.
  const editor = editorRef.current!
  const seededKey = initialValue[0]?._key
  for (let attempt = 0; attempt < 100; attempt++) {
    if (editor.getSnapshot().context.value[0]?._key === seededKey) break
    // Polling is inherently sequential: each pass yields to the editor's
    // value-sync actor before re-checking.
    // oxlint-disable-next-line no-await-in-loop
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5))
    })
  }
  expect(editor.getSnapshot().context.value[0]?._key).toBe(seededKey)
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  return {editor}
}

function selectStartOf(editor: ReturnType<typeof useEditor>, blockKey: string) {
  const point = {
    offset: 0,
    path: [{_key: blockKey}, 'children', {_key: `${blockKey}-span`}],
  }
  act(() => {
    editor.send({at: {anchor: point, focus: point}, type: 'select'})
  })
}

function textBlock(key: string, text: string): PortableTextBlock {
  return {
    _key: key,
    _type: 'block',
    children: [{_key: `${key}-span`, _type: 'span', marks: [], text}],
    markDefs: [],
    style: 'normal',
  }
}

/** Concatenated text of every text block in the editor, in order. */
function textContents(editor: ReturnType<typeof useEditor>): string[] {
  const schema = editor.getSnapshot().context.schema
  return editor
    .getSnapshot()
    .context.value.filter((block) => isTextBlock({schema}, block))
    .map((block) => getTextBlockText(block))
}

describe('createInsertBehavior', () => {
  it('removes only the typed query and preserves pre-existing text in the anchor block', async () => {
    const {editor} = await renderHarness([textBlock('anchor', '/calhello world')])
    selectStartOf(editor, 'anchor')
    act(() => {
      sendInsertPickerItem(editor, {
        anchorBlockKey: 'anchor',
        block: {_key: 'new-callout', _type: 'callout'},
        mode: 'slash',
        query: '/cal',
      })
    })
    expect(blockTypes(editor)).toContain('callout')
    expect(textContents(editor)).toContain('hello world')
    expect(textContents(editor).join('')).not.toContain('/cal')
  })

  it('leaves no query text behind when the anchor block contained only the query', async () => {
    const {editor} = await renderHarness([textBlock('anchor', '/cal')])
    selectStartOf(editor, 'anchor')
    act(() => {
      sendInsertPickerItem(editor, {
        anchorBlockKey: 'anchor',
        block: {_key: 'new-callout', _type: 'callout'},
        mode: 'slash',
        query: '/cal',
      })
    })
    expect(blockTypes(editor)).toContain('callout')
    expect(textContents(editor).join('')).not.toContain('/cal')
  })

  it('restores the pre-select state with a single undo', async () => {
    const {editor} = await renderHarness([textBlock('anchor', '/calhello world')])
    selectStartOf(editor, 'anchor')
    act(() => {
      sendInsertPickerItem(editor, {
        anchorBlockKey: 'anchor',
        block: {_key: 'new-callout', _type: 'callout'},
        mode: 'slash',
        query: '/cal',
      })
    })
    act(() => {
      editor.send({type: 'history.undo'})
    })
    expect(blockTypes(editor)).not.toContain('callout')
    expect(textContents(editor)).toContain('/calhello world')
  })

  it('skips the query cleanup when the anchor block no longer starts with the query', async () => {
    // Simulates a collaborator (or uncaptured caret movement) changing the
    // anchor block while the picker was open: inserting is still the user's
    // intent, but nothing may be deleted.
    const {editor} = await renderHarness([textBlock('anchor', 'edited by peer')])
    selectStartOf(editor, 'anchor')
    act(() => {
      sendInsertPickerItem(editor, {
        anchorBlockKey: 'anchor',
        block: {_key: 'new-callout', _type: 'callout'},
        mode: 'slash',
        query: '/cal',
      })
    })
    expect(blockTypes(editor)).toContain('callout')
    expect(textContents(editor)).toContain('edited by peer')
  })

  it('anchors the insert to the anchor block even when the selection moved elsewhere', async () => {
    // If the caret moves to a different block between opening the picker and
    // selecting (click-away close can race, or input arrives during the
    // select-time initial-value await), the insert must still land at the
    // anchor block, not wherever the live selection happens to be.
    const {editor} = await renderHarness([
      textBlock('anchor', '/cal'),
      textBlock('other', 'elsewhere'),
    ])
    selectStartOf(editor, 'other')
    act(() => {
      sendInsertPickerItem(editor, {
        anchorBlockKey: 'anchor',
        block: {_key: 'new-callout', _type: 'callout'},
        mode: 'slash',
        query: '/cal',
      })
    })
    expect(textContents(editor)).toEqual(['elsewhere'])
    expect(blockTypes(editor)).toEqual(['callout', 'block'])
  })

  it('anchors a shortcut insert after a block object anchor', async () => {
    // Cmd+/ can be anchored to a non-text block (image, callout). The insert
    // must land right after that block, not at the live selection.
    const {editor} = await renderHarness([
      {_key: 'existing-callout', _type: 'callout'},
      textBlock('tail', 'tail text'),
    ])
    selectStartOf(editor, 'tail')
    act(() => {
      sendInsertPickerItem(editor, {
        anchorBlockKey: 'existing-callout',
        block: {_key: 'new-callout', _type: 'callout'},
        mode: 'shortcut',
        query: '',
      })
    })
    expect(editor.getSnapshot().context.value.map((block) => block._key)).toEqual([
      'existing-callout',
      'new-callout',
      'tail',
    ])
  })

  it('inserts without deleting anything in shortcut mode', async () => {
    const {editor} = await renderHarness([textBlock('anchor', 'existing prose')])
    selectStartOf(editor, 'anchor')
    act(() => {
      sendInsertPickerItem(editor, {
        anchorBlockKey: 'anchor',
        block: {_key: 'new-callout', _type: 'callout'},
        mode: 'shortcut',
        query: '',
      })
    })
    expect(blockTypes(editor)).toContain('callout')
    expect(textContents(editor)).toContain('existing prose')
  })
})
