// Tests read raw behavior payloads back off the engine, which erases their
// shape to Record<string, unknown>; the assertions below re-narrow them.
// oxlint-disable no-unsafe-type-assertion
import {defineSchema, EditorProvider, useEditor} from '@portabletext/editor'
import {defineBehavior, forward} from '@portabletext/editor/behaviors'
import {getTextBlockText, isTextBlock} from '@portabletext/editor/utils'
import {defineInputRuleBehavior} from '@portabletext/plugin-input-rule'
import {act, render} from '@testing-library/react'
import React, {useEffect} from 'react'
import type {PortableTextBlock} from 'sanity'
import {describe, expect, it} from 'vitest'

import {
  BLOCKQUOTE_PATTERN,
  blockquoteRule,
  CODE_FENCE_PATTERN,
  codeFenceRule,
  createMarkdownInputRules,
  fenceLanguageFromMatch,
  type LanguageEntry,
  normalizeFenceLanguage,
} from './inputRules'

const schemaDefinition = defineSchema({
  annotations: [],
  blockObjects: [{name: 'codeBlock'}, {name: 'callout'}],
  decorators: [],
  inlineObjects: [],
  lists: [],
  styles: [{name: 'normal'}],
})

const languages: readonly LanguageEntry[] = [
  {aliases: ['py'], filename: 'main.py', value: 'python'},
  {aliases: ['ts'], filename: 'index.ts', value: 'typescript'},
  {value: 'text'},
]

const fenceRule = codeFenceRule({
  blockType: 'codeBlock',
  createValue: ({filename, keyGenerator, language}) => ({
    blocks: [
      {
        _key: keyGenerator(),
        code: {_type: 'code', language},
        ...(filename ? {filename} : {}),
      },
    ],
  }),
  defaultLanguage: 'typescript',
  languages,
})

const quoteRule = blockquoteRule({
  blockType: 'callout',
  createValue: () => ({type: 'info'}),
})

const testRules = [fenceRule, quoteRule]

function buildFenceValue(matchText: string) {
  let counter = 0
  return fenceRule.buildValue({
    keyGenerator: () => `k${counter++}`,
    matchText,
  }) as {
    blocks: Array<{code: {language?: string}; filename?: string}>
  }
}

describe('fence language parsing', () => {
  it('strips the fence and trims to the language token', () => {
    expect(fenceLanguageFromMatch('```ts ')).toBe('ts')
    expect(fenceLanguageFromMatch('``` ')).toBe('')
    expect(fenceLanguageFromMatch('```python\n')).toBe('python')
  })

  it('round-trips canonical values and resolves aliases, case-insensitively', () => {
    expect(normalizeFenceLanguage('python', languages)).toBe('python')
    expect(normalizeFenceLanguage('py', languages)).toBe('python')
    expect(normalizeFenceLanguage('TS', languages)).toBe('typescript')
  })

  it('passes an unrecognized language through as typed', () => {
    expect(normalizeFenceLanguage('rust', languages)).toBe('rust')
    // Case is preserved for unknown tokens (the "as typed" contract), so a
    // no-table rule like wellKnownInputRules keeps what the writer typed.
    expect(normalizeFenceLanguage('GraphQL', languages)).toBe('GraphQL')
    expect(normalizeFenceLanguage('GraphQL', [])).toBe('GraphQL')
  })

  it('matches a mixed-case table entry and returns its canonical value', () => {
    const mixedCase: readonly LanguageEntry[] = [{aliases: ['JS'], value: 'JavaScript'}]
    expect(normalizeFenceLanguage('javascript', mixedCase)).toBe('JavaScript')
    expect(normalizeFenceLanguage('js', mixedCase)).toBe('JavaScript')
  })

  it('yields the default (or nothing) for an empty token', () => {
    expect(normalizeFenceLanguage('', languages, 'typescript')).toBe('typescript')
    expect(normalizeFenceLanguage('', languages)).toBeUndefined()
  })
})

describe('codeFenceRule', () => {
  it('targets the configured block type with the fence pattern', () => {
    expect(fenceRule.blockType).toBe('codeBlock')
    expect(fenceRule.pattern).toBe(CODE_FENCE_PATTERN)
  })

  it('resolves the language and filename from the table', () => {
    const value = buildFenceValue('```py ')
    expect(value.blocks[0]!.code.language).toBe('python')
    expect(value.blocks[0]!.filename).toBe('main.py')
  })

  it('omits the filename for a language without a mapped name', () => {
    expect(buildFenceValue('```text ').blocks[0]).not.toHaveProperty('filename')
    expect(buildFenceValue('```rust ').blocks[0]).not.toHaveProperty('filename')
  })

  it('defaults the language when no token is typed', () => {
    expect(buildFenceValue('``` ').blocks[0]!.code.language).toBe('typescript')
  })
})

describe('blockquoteRule', () => {
  it('targets the configured block type with the quote pattern', () => {
    expect(quoteRule.blockType).toBe('callout')
    expect(quoteRule.pattern).toBe(BLOCKQUOTE_PATTERN)
  })

  it('builds the configured fields, or none by default', () => {
    expect(quoteRule.buildValue({keyGenerator: () => 'k', matchText: '> '})).toEqual({type: 'info'})
    expect(
      blockquoteRule({blockType: 'callout'}).buildValue({
        keyGenerator: () => 'k',
        matchText: '> ',
      }),
    ).toEqual({})
  })
})

describe('createMarkdownInputRules', () => {
  const deps = {keyGenerator: () => 'k', onInserted: () => {}}

  it('only builds rules for block types the array allows', () => {
    expect(
      createMarkdownInputRules({
        ...deps,
        allowedBlockTypes: new Set(['codeBlock', 'callout']),
        rules: testRules,
      }),
    ).toHaveLength(2)
    expect(
      createMarkdownInputRules({
        ...deps,
        allowedBlockTypes: new Set(['codeBlock']),
        rules: testRules,
      }),
    ).toHaveLength(1)
    expect(
      createMarkdownInputRules({
        ...deps,
        allowedBlockTypes: new Set(),
        rules: testRules,
      }),
    ).toHaveLength(0)
  })
})

// --- integration: drive the rules through the plugin's real matching engine ---

const CaptureEditor = React.forwardRef<null | ReturnType<typeof useEditor>, object>(
  function CaptureEditor(_, ref) {
    const editor = useEditor()
    React.useImperativeHandle(ref, () => editor, [editor])
    return null
  },
)

// The minimal test schema (block objects without field definitions) drops
// undeclared fields when the editor normalizes an inserted block, so nested
// values can't be read back off editor state. Capture the raw `insert.block`
// payload the rule raised — before that normalization — to assert them.
type CapturedBlock = {_key: string; _type: string} & Record<string, unknown>

function allText(editor: ReturnType<typeof useEditor>): string {
  const schema = editor.getSnapshot().context.schema
  return editor
    .getSnapshot()
    .context.value.filter((block) => isTextBlock({schema}, block))
    .map((block) => getTextBlockText(block))
    .join('')
}

function blockTypes(editor: ReturnType<typeof useEditor>): string[] {
  return editor.getSnapshot().context.value.map((block) => block._type)
}

function HarnessRegister({
  capturedBlocks,
  onInserted,
}: {
  capturedBlocks: CapturedBlock[]
  onInserted: (block: CapturedBlock) => void
}) {
  const editor = useEditor()
  useEffect(() => {
    const unregisterRules = editor.registerBehavior({
      behavior: defineInputRuleBehavior({
        rules: createMarkdownInputRules({
          allowedBlockTypes: new Set(['codeBlock', 'callout']),
          keyGenerator: () => editor.getSnapshot().context.keyGenerator(),
          onInserted,
          rules: testRules,
        }),
      }),
    })
    const unregisterCapture = editor.registerBehavior({
      behavior: defineBehavior({
        actions: [
          ({event}) => {
            capturedBlocks.push(event.block as CapturedBlock)
            return [forward(event)]
          },
        ],
        on: 'insert.block',
      }),
    })
    return () => {
      unregisterRules()
      unregisterCapture()
    }
  }, [capturedBlocks, editor, onInserted])
  return null
}

async function renderHarness(initialValue: PortableTextBlock[]) {
  const editorRef = React.createRef<null | ReturnType<typeof useEditor>>()
  const insertedKeys: string[] = []
  const capturedBlocks: CapturedBlock[] = []
  render(
    <EditorProvider initialConfig={{initialValue, schemaDefinition}}>
      <CaptureEditor ref={editorRef} />
      <HarnessRegister
        capturedBlocks={capturedBlocks}
        onInserted={(block) => insertedKeys.push(block._key)}
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
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  return {capturedBlocks, editor, insertedKeys}
}

function selectEndOf(editor: ReturnType<typeof useEditor>, blockKey: string, offset: number) {
  const point = {
    offset,
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

function typeText(editor: ReturnType<typeof useEditor>, text: string) {
  act(() => {
    editor.send({text, type: 'insert.text'})
  })
}

describe('markdown input rules (integration)', () => {
  it('turns a ```lang fence + space into a code block with the language prefilled', async () => {
    const {capturedBlocks, editor, insertedKeys} = await renderHarness([
      textBlock('anchor', '```py'),
    ])
    selectEndOf(editor, 'anchor', 5)
    typeText(editor, ' ')

    expect(blockTypes(editor)).toContain('codeBlock')
    // The fence AND the trailing trigger space must be gone — no orphaned text.
    expect(allText(editor)).toBe('')
    expect(insertedKeys).toHaveLength(1)
    const code = capturedBlocks[0] as unknown as {
      blocks: Array<{code: {language: string}; filename: string}>
    }
    expect(code.blocks[0]!.code.language).toBe('python')
    expect(code.blocks[0]!.filename).toBe('main.py')
  })

  it('defaults the language when no token is typed', async () => {
    const {capturedBlocks, editor} = await renderHarness([textBlock('anchor', '```')])
    selectEndOf(editor, 'anchor', 3)
    typeText(editor, ' ')

    const code = capturedBlocks[0] as unknown as {
      blocks: Array<{code: {language: string}}>
    }
    expect(code.blocks[0]!.code.language).toBe('typescript')
  })

  it('turns "> " at the start of a block into an info callout', async () => {
    const {capturedBlocks, editor} = await renderHarness([textBlock('anchor', '>')])
    selectEndOf(editor, 'anchor', 1)
    typeText(editor, ' ')

    expect(blockTypes(editor)).toContain('callout')
    expect(allText(editor)).toBe('')
    expect((capturedBlocks[0] as unknown as {type: string}).type).toBe('info')
  })

  it('does not transform an incomplete fence', async () => {
    const {editor} = await renderHarness([textBlock('anchor', '``')])
    selectEndOf(editor, 'anchor', 2)
    typeText(editor, '`')

    expect(blockTypes(editor)).not.toContain('codeBlock')
    expect(allText(editor)).toBe('```')
  })

  it('restores the typed fence with a single undo', async () => {
    const {editor} = await renderHarness([textBlock('anchor', '```ts')])
    selectEndOf(editor, 'anchor', 5)
    typeText(editor, ' ')
    expect(blockTypes(editor)).toContain('codeBlock')

    act(() => {
      editor.send({type: 'history.undo'})
    })
    expect(blockTypes(editor)).not.toContain('codeBlock')
    expect(allText(editor)).toContain('```ts')
  })
})
