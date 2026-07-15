import {defineSchema, EditorProvider, useEditor} from '@portabletext/editor'
import {act, render} from '@testing-library/react'
import React from 'react'
import type {PortableTextBlock} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {blockquoteRule} from './inputRules'
import {MarkdownInputRules} from './markdownInputRules'
import type {PickerInsertEvent} from './types'

// The component reads the host array's members off the Studio schema and the
// member-items context for open-on-insert; both are mocked, mirroring
// blockInsertPicker.test.tsx.
vi.mock('sanity', () => ({
  useFormCallbacks: () => ({
    onPathOpen: () => {},
    onSetPathCollapsed: () => {},
  }),
  useSchema: () => ({
    get: (name: string) =>
      name === 'testContent'
        ? {
            jsonType: 'array',
            of: [{name: 'block'}, {name: 'callout'}],
          }
        : undefined,
  }),
}))

vi.mock('sanity/_singletons', async () => {
  const {createContext} = await import('react')
  return {PortableTextMemberItemsContext: createContext([])}
})

const schemaDefinition = defineSchema({
  annotations: [],
  blockObjects: [{name: 'callout'}],
  decorators: [],
  inlineObjects: [],
  lists: [],
  styles: [{name: 'normal'}],
})

const rules = [
  blockquoteRule({
    blockType: 'callout',
    createValue: () => ({type: 'info'}),
  }),
]

const CaptureEditor = React.forwardRef<null | ReturnType<typeof useEditor>, object>(
  function CaptureEditor(_, ref) {
    const editor = useEditor()
    React.useImperativeHandle(ref, () => editor, [editor])
    return null
  },
)

async function renderComponent(initialValue: PortableTextBlock[]) {
  const editorRef = React.createRef<null | ReturnType<typeof useEditor>>()
  const events: PickerInsertEvent[] = []
  render(
    <EditorProvider initialConfig={{initialValue, schemaDefinition}}>
      <CaptureEditor ref={editorRef} />
      <MarkdownInputRules
        arrayTypeName="testContent"
        onItemInserted={(event) => events.push(event)}
        rules={rules}
      />
    </EditorProvider>,
  )
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
  return {editor, events}
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

describe('MarkdownInputRules component', () => {
  it("notifies onItemInserted with the inserted block's key, type, and via", async () => {
    const {editor, events} = await renderComponent([textBlock('anchor', '>')])
    const point = {
      offset: 1,
      path: [{_key: 'anchor'}, 'children', {_key: 'anchor-span'}],
    }
    act(() => {
      editor.send({at: {anchor: point, focus: point}, type: 'select'})
    })
    act(() => {
      editor.send({text: ' ', type: 'insert.text'})
    })

    const callout = editor.getSnapshot().context.value.find((block) => block._type === 'callout')
    expect(callout).toBeDefined()
    expect(events).toEqual([{blockKey: callout!._key, blockType: 'callout', via: 'inputRule'}])
  })

  it('does not enable rules for block types the array disallows', async () => {
    const disallowed = [blockquoteRule({blockType: 'notInArray', createValue: () => ({})})]
    const editorRef = React.createRef<null | ReturnType<typeof useEditor>>()
    const events: PickerInsertEvent[] = []
    render(
      <EditorProvider
        initialConfig={{
          initialValue: [textBlock('anchor', '>')],
          schemaDefinition,
        }}
      >
        <CaptureEditor ref={editorRef} />
        <MarkdownInputRules
          arrayTypeName="testContent"
          onItemInserted={(event) => events.push(event)}
          rules={disallowed}
        />
      </EditorProvider>,
    )
    const editor = editorRef.current!
    for (let attempt = 0; attempt < 100; attempt++) {
      if (editor.getSnapshot().context.value[0]?._key === 'anchor') break
      // oxlint-disable-next-line no-await-in-loop -- sequential poll for editor sync
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5))
      })
    }
    const point = {
      offset: 1,
      path: [{_key: 'anchor'}, 'children', {_key: 'anchor-span'}],
    }
    act(() => {
      editor.send({at: {anchor: point, focus: point}, type: 'select'})
    })
    act(() => {
      editor.send({text: ' ', type: 'insert.text'})
    })
    expect(events).toEqual([])
    expect(editor.getSnapshot().context.value.map((block) => block._type)).toEqual(['block'])
  })
})
