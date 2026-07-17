import {defineSchema, EditorProvider, PortableTextEditable, useEditor} from '@portabletext/editor'
import {getTextBlockText, isTextBlock} from '@portabletext/editor/utils'
import {ThemeProvider, ToastProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react'
import React from 'react'
import type {PortableTextBlock} from 'sanity'
// Resolves to the vi.mock'd module below; the Provider lets tests drive the
// primary (context-based) detection path.
import {PortableTextMemberSchemaTypesContext} from 'sanity/_singletons'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {BlockInsertPicker, type BlockInsertPickerProps} from './blockInsertPicker'
import type {PickerInsertEvent, PickerItem, PickerItemMetadata} from './types'

// jsdom has no matchMedia; @sanity/ui's ThemeProvider queries it for the
// prefers-color-scheme lookup. The shape assertions are test-environment
// shims, not production narrowing.
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

// jsdom lacks CSS.escape, which editor.dom's block-element lookup uses.
globalThis.CSS ??= {} as typeof CSS
CSS.escape ??= (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`)
// oxlint-enable no-unsafe-type-assertion

const scrollIntoViewSpy = vi.fn()
Element.prototype.scrollIntoView = scrollIntoViewSpy

const theme = buildTheme()

// vi.fn is unavailable inside vi.hoisted factories, so use swappable plain
// implementations; tests reassign the impls and beforeEach resets them.
const mocks = vi.hoisted(() => {
  const impls = {
    resolveInitialValue: (..._args: unknown[]): Promise<Record<string, unknown>> =>
      Promise.resolve({}),
    schemaGet: (_name: string): unknown => undefined,
  }
  return {
    impls,
    resolveInitialValue: (...args: unknown[]) => impls.resolveInitialValue(...args),
    schemaGet: (name: string) => impls.schemaGet(name),
  }
})

vi.mock('sanity', () => ({
  useFormCallbacks: () => ({
    onPathOpen: () => {},
    onSetPathCollapsed: () => {},
  }),
  useResolveInitialValueForType: () => mocks.resolveInitialValue,
  useSchema: () => ({get: mocks.schemaGet}),
}))

vi.mock('sanity/_singletons', async () => {
  const {createContext} = await import('react')
  return {
    PortableTextMemberItemsContext: createContext([]),
    PortableTextMemberSchemaTypesContext: createContext(null),
  }
})

// Observability for the openOnInsert seam: the real hook rides on Studio's
// member-items context (a permanent no-op under jsdom's empty mock), so swap
// it for a recording stub. vi.fn is unavailable in hoisted factories.
const openBlockSpy = vi.hoisted(() => {
  const calls: string[] = []
  return {calls, record: (key: string) => calls.push(key)}
})

vi.mock('./openBlockOnInsert', () => ({
  useOpenBlockOnInsert: () => openBlockSpy.record,
}))

// callout must declare its fields: insert.block normalizes the inserted
// block against the schema and strips undeclared props, so initial values
// like {type: "info"} would silently vanish otherwise.
const schemaDefinition = defineSchema({
  annotations: [],
  blockObjects: [
    {
      fields: [
        {name: 'type', type: 'string'},
        {name: 'source', type: 'string'},
      ],
      name: 'callout',
    },
    // Extra members so grouped-order tests can insert non-callout blocks
    // without the editor normalizing them away as unknown types.
    {name: 'codeBlock'},
    {name: 'propertiesTable'},
  ],
  decorators: [],
  inlineObjects: [],
  lists: [],
  styles: [{name: 'normal'}],
})

// The default array the picker derives its items from. `items` under the
// metadata semantics only curates (trigger/keywords/group/rank) — titles come
// from the schema members, so the base mock supplies them.
const baseSchemaGet = (name: string): unknown =>
  name === 'testContent'
    ? {
        jsonType: 'array',
        of: [
          {jsonType: 'object', name: 'block'},
          {jsonType: 'object', name: 'callout', title: 'Callout'},
          {jsonType: 'object', name: 'image', title: 'Image'},
        ],
      }
    : undefined

const defaultItems: readonly PickerItemMetadata[] = [
  {trigger: '/callout', type: 'callout'},
  {trigger: '/image', type: 'image'},
]

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

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

function pressKey(editor: ReturnType<typeof useEditor>, key: string) {
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

async function renderOpenPicker(options?: RenderPickerOptions) {
  const {editor} = await renderPicker(options)
  typeText(editor, '/')
  expect(screen.getByText('Insert block')).toBeDefined()
  return {editor}
}

type RenderPickerOptions = Omit<BlockInsertPickerProps, 'items'> & {
  initialValue?: PortableTextBlock[]
  // null = render without an items prop, exercising bare schema derivation
  items?: null | readonly PickerItemMetadata[]
  /**
   * Value for the (mocked) PortableTextMemberSchemaTypesContext — the
   * primary, zero-config detection path. Tests that omit it exercise the
   * arrayTypeName fallback against the mocked useSchema.
   */
  memberSchemaTypes?: unknown
}

function makePickerTree(
  editorRef: React.Ref<null | ReturnType<typeof useEditor>>,
  options?: RenderPickerOptions,
) {
  const {initialValue, items, memberSchemaTypes, ...props} = options ?? {}
  // Opt out of the fallback entirely with arrayTypeName: '' (the
  // context-path tests pass memberSchemaTypes instead).
  const arrayTypeName = 'arrayTypeName' in props ? props.arrayTypeName || undefined : 'testContent'
  // The mocked context accepts any stub; the real value type lives in
  // sanity's internals. Aliased outside JSX so the Provider gets a stable
  // identifier (jsx-no-constructed-context-values).
  // oxlint-disable-next-line no-unsafe-type-assertion
  const memberSchemaTypesValue = memberSchemaTypes as never
  const picker = (
    <BlockInsertPicker
      {...props}
      arrayTypeName={arrayTypeName}
      items={items === null ? undefined : (items ?? defaultItems)}
    />
  )
  return (
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <EditorProvider
          initialConfig={{
            initialValue,
            schemaDefinition,
          }}
        >
          <CaptureEditor ref={editorRef} />
          <PortableTextEditable />
          {memberSchemaTypes === undefined ? (
            picker
          ) : (
            <PortableTextMemberSchemaTypesContext.Provider
              // A test harness rendered per call — no re-render for a
              // constructed value to churn.
              // oxlint-disable-next-line react/jsx-no-constructed-context-values
              value={memberSchemaTypesValue}
            >
              {picker}
            </PortableTextMemberSchemaTypesContext.Provider>
          )}
        </EditorProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

async function renderPicker(options?: RenderPickerOptions) {
  const editorRef = React.createRef<null | ReturnType<typeof useEditor>>()
  const view = render(makePickerTree(editorRef, options))
  const editor = editorRef.current!
  // Wait for the editor machine's value sync (see insertBehavior.test.tsx).
  const seededKey = options?.initialValue?.[0]?._key
  for (let attempt = 0; attempt < 100; attempt++) {
    if (!seededKey) break
    if (editor.getSnapshot().context.value[0]?._key === seededKey) break
    // Polling is inherently sequential: each pass yields to the editor's
    // value-sync actor before re-checking.
    // oxlint-disable-next-line no-await-in-loop
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5))
    })
  }
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  return {
    editor,
    rerenderWith: (nextOptions?: RenderPickerOptions) =>
      view.rerender(makePickerTree(editorRef, nextOptions)),
  }
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

function textContents(editor: ReturnType<typeof useEditor>): string[] {
  const schema = editor.getSnapshot().context.schema
  return editor
    .getSnapshot()
    .context.value.filter((block) => isTextBlock({schema}, block))
    .map((block) => getTextBlockText(block))
}

function typeText(editor: ReturnType<typeof useEditor>, text: string) {
  for (const char of text) {
    act(() => {
      editor.send({text: char, type: 'insert.text'})
    })
  }
}

describe('BlockInsertPicker popover', () => {
  afterEach(cleanup)

  beforeEach(() => {
    mocks.impls.resolveInitialValue = () => Promise.resolve({})
    mocks.impls.schemaGet = baseSchemaGet
    scrollIntoViewSpy.mockClear()
    openBlockSpy.calls.length = 0
  })

  it('closes when a pointerdown lands outside the popover', async () => {
    await renderOpenPicker()
    fireEvent.pointerDown(document.body)
    expect(screen.queryByText('Insert block')).toBeNull()
  })

  it('closes on outside pointerdown even when a bubble-phase handler stops propagation', async () => {
    await renderOpenPicker()
    const stopper = document.createElement('div')
    document.body.appendChild(stopper)
    stopper.addEventListener('pointerdown', (event) => event.stopPropagation())
    fireEvent.pointerDown(stopper)
    stopper.remove()
    expect(screen.queryByText('Insert block')).toBeNull()
  })

  it('stays open when a pointerdown lands inside the popover', async () => {
    await renderOpenPicker()
    fireEvent.pointerDown(screen.getByText('Callout'))
    expect(screen.getByText('Insert block')).toBeDefined()
  })

  it('prevents default on mousedown anywhere on the popover surface so the editor keeps focus', async () => {
    await renderOpenPicker()
    // fireEvent returns false when preventDefault was called. The header is
    // a non-row surface; without preventDefault the editor blurs and the
    // focusout listener closes the picker mid-interaction.
    expect(fireEvent.mouseDown(screen.getByText('Insert block'))).toBe(false)
  })

  it('closes when focus leaves the editor entirely', async () => {
    const {editor} = await renderOpenPicker()
    const editable = editor.dom.getEditorElement()!
    fireEvent.focusOut(editable, {relatedTarget: document.body})
    expect(screen.queryByText('Insert block')).toBeNull()
  })

  it('stays open when focus moves into the popover itself', async () => {
    const {editor} = await renderOpenPicker()
    const editable = editor.dom.getEditorElement()!
    fireEvent.focusOut(editable, {
      relatedTarget: screen.getByText('Insert block'),
    })
    expect(screen.getByText('Insert block')).toBeDefined()
  })

  it('keeps the highlighted row visible during keyboard navigation', async () => {
    // The default schema derives two rows (Callout, Image) to navigate.
    const {editor} = await renderOpenPicker()
    scrollIntoViewSpy.mockClear()
    pressKey(editor, 'ArrowDown')
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({block: 'nearest'})
  })

  it('inserts via Cmd+/ and Enter even when the editor has no selection', async () => {
    // Shortcut mode falls back to the first block when nothing is focused;
    // selecting must still insert (anchored via the behavior's `at`), not
    // silently no-op on the null selection.
    const {editor} = await renderPicker()
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
    expect(screen.getByText('Insert block')).toBeDefined()
    pressKey(editor, 'Enter')
    await flush()
    expect(blockTypes(editor)).toContain('callout')
  })

  it("notifies onInsert with the inserted block's key, type, via, mode, and query", async () => {
    const events: PickerInsertEvent[] = []
    const {editor} = await renderPicker({
      onInsert: (event) => events.push(event),
    })
    typeText(editor, '/')
    expect(screen.getByText('Insert block')).toBeDefined()
    pressKey(editor, 'Enter')
    await flush()
    const callout = editor.getSnapshot().context.value.find((block) => block._type === 'callout')
    expect(callout).toBeDefined()
    expect(events).toEqual([
      {blockKey: callout!._key, blockType: 'callout', mode: 'slash', query: '/', via: 'picker'},
    ])
  })

  it('derives items from the array members when no metadata is given', async () => {
    mocks.impls.schemaGet = (name: string) =>
      name === 'groupedContent'
        ? {
            jsonType: 'array',
            of: [
              {jsonType: 'object', name: 'block'},
              {
                jsonType: 'object',
                name: 'callout',
                title: 'Callout card',
              },
            ],
          }
        : undefined
    const {editor} = await renderPicker({
      arrayTypeName: 'groupedContent',
      items: null,
    })
    typeText(editor, '/')
    // The item exists without any curated list, presented with the member
    // title, and the text block member produces no item.
    expect(screen.getByText('Callout card')).toBeDefined()
    pressKey(editor, 'Enter')
    await flush()
    expect(blockTypes(editor)).toContain('callout')
  })

  it("presents the array member's title over the global type of the same name", async () => {
    // The groupedContent image member is adaptiveImage config named
    // "image"; resolving presentation via schema.get("image") would show the
    // bare core type instead. Member-level resolution must win.
    mocks.impls.schemaGet = (name: string) => {
      if (name === 'groupedContent')
        return {
          jsonType: 'array',
          of: [{jsonType: 'object', name: 'callout', title: 'Member Title'}],
        }
      if (name === 'callout')
        return {
          jsonType: 'object',
          name: 'callout',
          title: 'Global Title',
        }
      return undefined
    }
    await renderOpenPicker({arrayTypeName: 'groupedContent'})
    expect(screen.getByText('Member Title')).toBeDefined()
    expect(screen.queryByText('Global Title')).toBeNull()
  })

  it('filters by the schema-resolved title, case-insensitively', async () => {
    mocks.impls.schemaGet = (name: string) =>
      name === 'testContent'
        ? {
            jsonType: 'array',
            of: [
              {
                jsonType: 'object',
                name: 'callout',
                title: 'Callout card',
              },
            ],
          }
        : undefined
    const {editor} = await renderPicker()
    typeText(editor, '/CARD')
    // "/CARD" matches no trigger prefix, but "card" is a substring of the
    // schema title "Callout card" — the item must stay visible.
    expect(screen.getByText('Callout card')).toBeDefined()
    typeText(editor, 'zzz')
    expect(screen.getByText('No matches for "/CARDzzz"')).toBeDefined()
  })

  it('filters via typing in shortcut mode without leaking characters into the document', async () => {
    const {editor} = await renderPicker({
      initialValue: [textBlock('anchor', 'hello world')],
    })
    selectStartOf(editor, 'anchor')
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
    expect(screen.getByText('Insert block')).toBeDefined()
    typeText(editor, 'cal')
    // The query narrows the list (trigger "/callout" matches "cal"), is
    // echoed in the popover, and never reaches the document.
    expect(screen.getByText('Callout')).toBeDefined()
    expect(screen.getByText('cal')).toBeDefined()
    expect(textContents(editor)).toEqual(['hello world'])
    pressKey(editor, 'Enter')
    await flush()
    expect(blockTypes(editor)).toContain('callout')
    expect(textContents(editor)).toEqual(['hello world'])
  })

  it('preserves pre-existing block text through the full slash-select path', async () => {
    const {editor} = await renderPicker({
      initialValue: [textBlock('anchor', 'hello world')],
    })
    selectStartOf(editor, 'anchor')
    typeText(editor, '/cal')
    expect(screen.getByText('Insert block')).toBeDefined()
    pressKey(editor, 'Enter')
    await flush()
    expect(blockTypes(editor)).toContain('callout')
    expect(textContents(editor)).toContain('hello world')
    expect(textContents(editor).join('')).not.toContain('/cal')
  })

  it('applies the initial value resolved at select time, even when resolution settles after Enter', async () => {
    let release: (value: Record<string, unknown>) => void = () => {}
    mocks.impls.resolveInitialValue = () =>
      new Promise<Record<string, unknown>>((resolve) => {
        release = resolve
      })
    const {editor} = await renderOpenPicker()
    pressKey(editor, 'Enter')
    await act(async () => {
      release({type: 'info'})
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    const callout = editor.getSnapshot().context.value.find((block) => block._type === 'callout')
    expect(callout).toBeDefined()
    expect(callout).toMatchObject({type: 'info'})
  })

  it('resolves the initial value against the array member type when arrayTypeName is set', async () => {
    const memberType = {jsonType: 'object', name: 'callout'}
    const globalType = {jsonType: 'object', name: 'callout'}
    mocks.impls.schemaGet = (name: string) => {
      if (name === 'groupedContent') return {jsonType: 'array', of: [memberType]}
      if (name === 'callout') return globalType
      return undefined
    }
    mocks.impls.resolveInitialValue = (type: unknown) =>
      Promise.resolve({source: type === memberType ? 'member' : 'global'})
    const {editor} = await renderOpenPicker({
      arrayTypeName: 'groupedContent',
    })
    pressKey(editor, 'Enter')
    await flush()
    const callout = editor.getSnapshot().context.value.find((block) => block._type === 'callout')
    expect(callout).toMatchObject({source: 'member'})
  })

  // A derived groupedContent with members drawn from two different
  // groups, so the menu renders multiple sections.
  const multiGroupSchemaGet = (name: string) =>
    name === 'groupedContent'
      ? {
          jsonType: 'array',
          of: [
            {jsonType: 'object', name: 'block'},
            {jsonType: 'object', name: 'codeBlock', title: 'Code block'},
            {
              jsonType: 'object',
              name: 'propertiesTable',
              title: 'Properties table',
            },
            {jsonType: 'object', name: 'callout', title: 'Callout card'},
          ],
        }
      : undefined

  // Rank order deliberately interleaves the groups (code, callout, props) so
  // grouped rendering demonstrably reorders rows versus the flat rank.
  const groupedItems: readonly PickerItemMetadata[] = [
    {
      description: 'Syntax-highlighted code sample',
      group: 'Code & API',
      trigger: '/code',
      type: 'codeBlock',
    },
    {group: 'Callouts & cards', trigger: '/callout', type: 'callout'},
    {group: 'Code & API', trigger: '/props', type: 'propertiesTable'},
  ]

  it('renders category headers, descriptions, and trigger chips', async () => {
    mocks.impls.schemaGet = multiGroupSchemaGet
    await renderOpenPicker({
      arrayTypeName: 'groupedContent',
      items: groupedItems,
    })
    // Group headers (two members are Code & API, one is Callouts & cards).
    expect(screen.getByText('Code & API')).toBeDefined()
    expect(screen.getByText('Callouts & cards')).toBeDefined()
    // Member title + curated description + trigger chip on a row.
    expect(screen.getByText('Code block')).toBeDefined()
    expect(screen.getByText('Syntax-highlighted code sample')).toBeDefined()
    expect(screen.getByText('/code')).toBeDefined()
  })

  it('renders the shortcut-teaching footer', async () => {
    await renderOpenPicker()
    expect(screen.getByText('Navigate')).toBeDefined()
    expect(screen.getByText('Insert')).toBeDefined()
    expect(screen.getByText('Dismiss')).toBeDefined()
    expect(screen.getByText('Anywhere')).toBeDefined()
  })

  it('exposes listbox and option roles with the first row selected', async () => {
    mocks.impls.schemaGet = multiGroupSchemaGet
    await renderOpenPicker({
      arrayTypeName: 'groupedContent',
      items: groupedItems,
    })
    expect(screen.getByRole('listbox')).toBeDefined()
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)
    expect(options[0]!.getAttribute('aria-selected')).toBe('true')
    expect(options[1]!.getAttribute('aria-selected')).toBe('false')
  })

  it('orders rows by group, pulling same-group members together', async () => {
    mocks.impls.schemaGet = multiGroupSchemaGet
    await renderOpenPicker({
      arrayTypeName: 'groupedContent',
      items: groupedItems,
    })
    const titles = screen.getAllByRole('option').map((option) => option.textContent)
    // Census-flat order would be code, callout, props; grouping pulls the two
    // Code & API members (code, props) together ahead of the callout.
    expect(titles?.[0]).toContain('Code block')
    expect(titles?.[1]).toContain('Properties table')
    expect(titles?.[2]).toContain('Callout card')
  })

  it('responds to ArrowUp immediately after overshooting the bottom', async () => {
    // The stored highlight index must never drift past the list bounds:
    // holding ArrowDown at the last row followed by one ArrowUp has to move
    // the highlight up right away, not eat presses while a hidden
    // out-of-range index counts back down into range.
    mocks.impls.schemaGet = multiGroupSchemaGet
    const {editor} = await renderOpenPicker({
      arrayTypeName: 'groupedContent',
      items: groupedItems,
    })
    for (let press = 0; press < 6; press++) pressKey(editor, 'ArrowDown')
    pressKey(editor, 'ArrowUp')
    const options = screen.getAllByRole('option')
    expect(options[1]!.getAttribute('aria-selected')).toBe('true')
  })

  it('responds to ArrowDown immediately after overshooting the top', async () => {
    mocks.impls.schemaGet = multiGroupSchemaGet
    const {editor} = await renderOpenPicker({
      arrayTypeName: 'groupedContent',
      items: groupedItems,
    })
    for (let press = 0; press < 4; press++) pressKey(editor, 'ArrowUp')
    pressKey(editor, 'ArrowDown')
    const options = screen.getAllByRole('option')
    expect(options[1]!.getAttribute('aria-selected')).toBe('true')
  })

  it('does not move the highlight when rows pass under a stationary pointer', async () => {
    // Keyboard navigation scrolls the list via scrollIntoView; the browser
    // then fires mouseenter (and, in some engines, a coordinate-identical
    // mousemove) on whichever row slides under the unmoving cursor. Those
    // synthetic events must not steal the keyboard highlight.
    mocks.impls.schemaGet = multiGroupSchemaGet
    await renderOpenPicker({
      arrayTypeName: 'groupedContent',
      items: groupedItems,
    })
    const options = screen.getAllByRole('option')
    fireEvent.mouseEnter(options[2]!, {clientX: 10, clientY: 10})
    expect(options[0]!.getAttribute('aria-selected')).toBe('true')
    fireEvent.mouseMove(options[1]!, {clientX: 10, clientY: 10})
    fireEvent.mouseMove(options[2]!, {clientX: 10, clientY: 10})
    expect(options[0]!.getAttribute('aria-selected')).toBe('true')
  })

  it('highlights the row under the pointer on genuine movement', async () => {
    mocks.impls.schemaGet = multiGroupSchemaGet
    await renderOpenPicker({
      arrayTypeName: 'groupedContent',
      items: groupedItems,
    })
    const options = screen.getAllByRole('option')
    fireEvent.mouseMove(options[1]!, {clientX: 10, clientY: 10})
    fireEvent.mouseMove(options[1]!, {clientX: 12, clientY: 34})
    expect(options[1]!.getAttribute('aria-selected')).toBe('true')
  })

  it('navigates the grouped display order, not the census-flat order', async () => {
    mocks.impls.schemaGet = multiGroupSchemaGet
    const {editor} = await renderOpenPicker({
      arrayTypeName: 'groupedContent',
      items: groupedItems,
    })
    // One ArrowDown from the top lands on the second *visual* row
    // (Properties table), which is a different block than the census-flat
    // second row (Callout card) would be.
    pressKey(editor, 'ArrowDown')
    pressKey(editor, 'Enter')
    await flush()
    expect(blockTypes(editor)).toContain('propertiesTable')
    expect(blockTypes(editor)).not.toContain('callout')
  })

  it('inserts on a real click of a row (not only mousedown)', async () => {
    const {editor} = await renderOpenPicker()
    fireEvent.click(screen.getByText('Callout'))
    await flush()
    expect(blockTypes(editor)).toContain('callout')
  })

  it('aborts the insert and shows an error toast when initial value resolution fails', async () => {
    mocks.impls.resolveInitialValue = () => Promise.reject(new Error('template exploded'))
    const {editor} = await renderOpenPicker()
    pressKey(editor, 'Enter')
    await flush()
    const callout = editor.getSnapshot().context.value.find((block) => block._type === 'callout')
    expect(callout).toBeUndefined()
    expect(screen.getByText('template exploded')).toBeDefined()
  })

  it('derives items from the member-schema context with no arrayTypeName (zero-config path)', async () => {
    // No schema.get fallback available at all: detection rides entirely on
    // the context Studio provides above the plugins slot.
    mocks.impls.schemaGet = () => undefined
    const {editor} = await renderPicker({
      arrayTypeName: '',
      items: null,
      memberSchemaTypes: {
        blockObjects: [{jsonType: 'object', name: 'callout', title: 'Context Callout'}],
        portableText: {jsonType: 'array', name: 'anything', of: []},
      },
    })
    typeText(editor, '/')
    expect(screen.getByText('Context Callout')).toBeDefined()
    pressKey(editor, 'Enter')
    await flush()
    expect(blockTypes(editor)).toContain('callout')
  })

  it('prefers the member-schema context over the arrayTypeName fallback', async () => {
    const {editor} = await renderPicker({
      items: null,
      memberSchemaTypes: {
        blockObjects: [{jsonType: 'object', name: 'callout', title: 'Context Callout'}],
        portableText: {jsonType: 'array', name: 'anything', of: []},
      },
    })
    typeText(editor, '/')
    // testContent's schema.get members (Callout/Image) must not appear.
    expect(screen.getByText('Context Callout')).toBeDefined()
    expect(screen.queryByText('Image')).toBeNull()
  })

  it('excludes aliased text-block members on the fallback path', async () => {
    mocks.impls.schemaGet = (name: string) =>
      name === 'aliasedContent'
        ? {
            jsonType: 'array',
            of: [
              // A custom-named text block: `{name: 'myBlock', type: 'block'}`
              // compiles to a member whose type chain roots at `block`.
              {jsonType: 'object', name: 'myBlock', type: {name: 'block'}},
              {jsonType: 'object', name: 'callout', title: 'Callout'},
            ],
          }
        : undefined
    await renderOpenPicker({arrayTypeName: 'aliasedContent', items: null})
    expect(screen.getByText('Callout')).toBeDefined()
    expect(screen.queryByText('MyBlock')).toBeNull()
    expect(screen.getAllByRole('option')).toHaveLength(1)
  })

  it('never opens (and warns in dev) when the array derives zero items', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      mocks.impls.schemaGet = (name: string) =>
        name === 'textOnlyContent'
          ? {jsonType: 'array', of: [{jsonType: 'object', name: 'block'}]}
          : undefined
      const {editor} = await renderPicker({arrayTypeName: 'textOnlyContent', items: null})
      typeText(editor, '/')
      // No behaviors registered: the "/" inserts as plain text, no popover.
      expect(screen.queryByText('Insert block')).toBeNull()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('No insertable items'))
    } finally {
      warn.mockRestore()
    }
  })

  it('surfaces resolveItems-appended custom items on a text-only array', async () => {
    // The zero-items guard runs on the resolver's OUTPUT: a block-only array
    // plus a custom item is a working picker, not a disabled one.
    mocks.impls.schemaGet = (name: string) =>
      name === 'textOnlyContent'
        ? {jsonType: 'array', of: [{jsonType: 'object', name: 'block'}]}
        : undefined
    const onSelect = vi.fn()
    const {editor} = await renderPicker({
      arrayTypeName: 'textOnlyContent',
      items: null,
      resolveItems: (items) => [
        ...items,
        {action: {onSelect, type: 'custom'}, id: 'my-command', title: 'Run my command'},
      ],
    })
    typeText(editor, '/')
    expect(screen.getByText('Run my command')).toBeDefined()
    pressKey(editor, 'Enter')
    await flush()
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({closePicker: expect.any(Function), editor}),
    )
    // A custom action inserts nothing and cleans up the typed query.
    expect(blockTypes(editor)).toEqual(['block'])
    expect(textContents(editor)).toEqual([''])
  })

  it('lets resolveItems reorder and drop derived items', async () => {
    await renderOpenPicker({
      resolveItems: (items) => items.filter((item) => item.id !== 'image').toReversed(),
    })
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(1)
    expect(options[0]!.textContent).toContain('Callout')
  })

  it('decorates well-known member types from presets, with items metadata winning', async () => {
    mocks.impls.schemaGet = (name: string) =>
      name === 'presetContent'
        ? {
            jsonType: 'array',
            of: [
              {jsonType: 'object', name: 'image', title: 'Image'},
              {jsonType: 'object', name: 'code', title: 'Code'},
            ],
          }
        : undefined
    await renderOpenPicker({
      arrayTypeName: 'presetContent',
      // The host overrides the image trigger; code falls through to presets.
      items: [{trigger: '/pic', type: 'image'}],
    })
    expect(screen.getByText('/pic')).toBeDefined()
    expect(screen.queryByText('/image')).toBeNull()
    expect(screen.getByText('/code')).toBeDefined()
  })

  it('applies no preset metadata with presets: false', async () => {
    mocks.impls.schemaGet = (name: string) =>
      name === 'presetContent'
        ? {jsonType: 'array', of: [{jsonType: 'object', name: 'image', title: 'Image'}]}
        : undefined
    await renderOpenPicker({arrayTypeName: 'presetContent', items: null, presets: false})
    expect(screen.queryByText('/image')).toBeNull()
  })

  it('renders overridden labels in the chrome', async () => {
    const {editor} = await renderPicker({
      labels: {noMatches: 'Nichts zu "{query}"', title: 'Block einfügen'},
    })
    typeText(editor, '/')
    expect(screen.getByText('Block einfügen')).toBeDefined()
    typeText(editor, 'zzz')
    expect(screen.getByText('Nichts zu "/zzz"')).toBeDefined()
  })

  it('ignores Cmd+/ with shortcut: false, keeping the slash trigger', async () => {
    const {editor} = await renderPicker({shortcut: false})
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
    expect(screen.queryByText('Insert block')).toBeNull()
    typeText(editor, '/')
    expect(screen.getByText('Insert block')).toBeDefined()
  })

  it('replaces the built-in matching via the filter option, receiving the bare query', async () => {
    const filter = vi.fn((items: readonly PickerItem[], filterQuery: string) =>
      filterQuery.includes('!') ? items.filter((item) => item.id === 'image') : items,
    )
    const {editor} = await renderPicker({filter})
    typeText(editor, '/')
    expect(screen.getAllByRole('option')).toHaveLength(2)
    // The slash-mode "/" prefix is stripped before the seam.
    expect(filter).toHaveBeenLastCalledWith(expect.anything(), '')
    typeText(editor, 'im!')
    expect(filter).toHaveBeenLastCalledWith(expect.anything(), 'im!')
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(1)
    expect(options[0]!.textContent).toContain('Image')
  })

  it('renders badges from items metadata', async () => {
    await renderOpenPicker({
      items: [{badge: 'Beta', trigger: '/callout', type: 'callout'}],
    })
    expect(screen.getByText('Beta')).toBeDefined()
  })

  it('warns in dev about items metadata that matches no member', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      await renderPicker({items: [{trigger: '/callout', type: 'calout'}]})
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('calout'))
    } finally {
      warn.mockRestore()
    }
  })

  it('warns in dev when neither context nor arrayTypeName resolves, and stays disabled', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      mocks.impls.schemaGet = () => undefined
      const {editor} = await renderPicker({arrayTypeName: '', items: null})
      typeText(editor, '/')
      expect(screen.queryByText('Insert block')).toBeNull()
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('No Portable Text member schema context found'),
      )
    } finally {
      warn.mockRestore()
    }
  })

  it('opens inserted blocks for editing by default', async () => {
    const {editor} = await renderOpenPicker()
    pressKey(editor, 'Enter')
    await flush()
    const callout = editor.getSnapshot().context.value.find((block) => block._type === 'callout')
    expect(openBlockSpy.calls).toEqual([callout!._key])
  })

  it('keeps inserted blocks closed with openOnInsert: false, still notifying onInsert', async () => {
    const events: PickerInsertEvent[] = []
    const {editor} = await renderPicker({
      onInsert: (event) => events.push(event),
      openOnInsert: false,
    })
    typeText(editor, '/')
    pressKey(editor, 'Enter')
    await flush()
    expect(openBlockSpy.calls).toEqual([])
    expect(events).toHaveLength(1)
  })

  it('lets per-item openOnInsert metadata override the plugin default, in both directions', async () => {
    // Item false beats plugin default true.
    const first = await renderPicker({
      items: [{openOnInsert: false, trigger: '/callout', type: 'callout'}],
    })
    typeText(first.editor, '/cal')
    pressKey(first.editor, 'Enter')
    await flush()
    expect(openBlockSpy.calls).toEqual([])
    cleanup()
    // Item true beats plugin false.
    const second = await renderPicker({
      items: [{openOnInsert: true, trigger: '/callout', type: 'callout'}],
      openOnInsert: false,
    })
    typeText(second.editor, '/cal')
    pressKey(second.editor, 'Enter')
    await flush()
    expect(openBlockSpy.calls).toHaveLength(1)
  })

  it('runs custom actions from shortcut mode without touching the document', async () => {
    const onSelect = vi.fn()
    const events: PickerInsertEvent[] = []
    const {editor} = await renderPicker({
      initialValue: [textBlock('anchor', 'run me later')],
      onInsert: (event) => events.push(event),
      resolveItems: (items) => [
        ...items,
        {action: {onSelect, type: 'custom'}, id: 'my-command', title: 'Run my command'},
      ],
    })
    selectStartOf(editor, 'anchor')
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
    // The anchor text deliberately starts with the typed query, so only the
    // mode guard (not the starts-with guard) keeps cleanup from deleting it.
    typeText(editor, 'run')
    pressKey(editor, 'Enter')
    await flush()
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(textContents(editor)).toEqual(['run me later'])
    // Custom actions insert nothing, so onInsert must not fire.
    expect(events).toEqual([])
  })

  it('reports shortcut mode and the typed query on onInsert', async () => {
    const events: PickerInsertEvent[] = []
    const {editor} = await renderPicker({
      initialValue: [textBlock('anchor', 'hello')],
      onInsert: (event) => events.push(event),
    })
    selectStartOf(editor, 'anchor')
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
    typeText(editor, 'cal')
    pressKey(editor, 'Enter')
    await flush()
    expect(events).toEqual([
      expect.objectContaining({blockType: 'callout', mode: 'shortcut', query: 'cal'}),
    ])
  })

  it('closes the popover when the item list empties mid-session', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const {editor, rerenderWith} = await renderPicker()
      typeText(editor, '/')
      expect(screen.getByRole('listbox')).toBeDefined()
      rerenderWith({resolveItems: () => []})
      await flush()
      expect(screen.queryByRole('listbox')).toBeNull()
      expect(screen.queryByRole('status')).toBeNull()
    } finally {
      warn.mockRestore()
    }
  })

  it('acts on the clicked row even when a custom item reuses a derived id', async () => {
    const onSelect = vi.fn()
    const {editor} = await renderPicker({
      resolveItems: (items) => [
        ...items,
        {action: {onSelect, type: 'custom'}, id: 'callout', title: 'Shadow command'},
      ],
    })
    typeText(editor, '/')
    fireEvent.click(screen.getByText('Shadow command'))
    await flush()
    // The duplicate id must not alias the click onto the derived row.
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(blockTypes(editor)).not.toContain('callout')
    typeText(editor, '/')
    fireEvent.click(screen.getByText('Callout'))
    await flush()
    expect(blockTypes(editor)).toContain('callout')
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('surfaces a toast when a custom action throws instead of swallowing it', async () => {
    const {editor} = await renderPicker({
      resolveItems: (items) => [
        ...items,
        {
          action: {
            onSelect: () => {
              throw new Error('boom from host')
            },
            type: 'custom',
          },
          id: 'exploder',
          title: 'ZZExploder',
        },
      ],
    })
    typeText(editor, '/zzexp')
    pressKey(editor, 'Enter')
    await flush()
    expect(screen.getByText('boom from host')).toBeDefined()
  })

  it('shows a warning toast when the anchor block disappears during resolution', async () => {
    let release: (value: Record<string, unknown>) => void = () => {}
    mocks.impls.resolveInitialValue = () =>
      new Promise<Record<string, unknown>>((resolve) => {
        release = resolve
      })
    const {editor} = await renderPicker({
      initialValue: [textBlock('anchor', ''), textBlock('other', 'keep me')],
    })
    selectStartOf(editor, 'anchor')
    typeText(editor, '/')
    pressKey(editor, 'Enter')
    // Delete the anchor while the initial value is still resolving.
    act(() => {
      editor.send({at: [{_key: 'anchor'}], type: 'delete.block'})
    })
    await act(async () => {
      release({})
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(blockTypes(editor)).not.toContain('callout')
    expect(screen.getByText('The block you were inserting into was removed')).toBeDefined()
  })

  it('renders an overridden position announcement in the live region', async () => {
    const {editor} = await renderPicker({
      labels: {positionAnnouncement: '{index} von {count}'},
    })
    typeText(editor, '/')
    expect(document.querySelector('output')?.textContent).toContain('1 von 2')
  })

  it('shows queries containing replacement patterns verbatim in the empty state', async () => {
    const {editor} = await renderPicker()
    typeText(editor, '/$&')
    expect(screen.getByText('No matches for "/$&"')).toBeDefined()
  })
})
