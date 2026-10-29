// @vitest-environment jsdom
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, render} from '@testing-library/react'
import {Activity} from 'react'
import {describe, expect, test, vi} from 'vitest'

import TreeEditor from './TreeEditor'

const {client, schema} = vi.hoisted(() => ({
  client: {
    fetch: () => Promise.resolve([]),
    listen: () => ({subscribe: () => ({unsubscribe: () => undefined})}),
  },
  schema: {get: () => undefined},
}))

vi.mock('sanity', () => ({
  IntentButton: 'button',
  PatchEvent: vi.fn(),
  Preview: () => null,
  TextWithTone: ({children}: {children?: React.ReactNode}) => children,
  prefixPath: (patch: unknown) => patch,
  setIfMissing: () => ({}),
  useClient: () => client,
  useRelativeTime: () => '',
  useSchema: () => schema,
}))
vi.mock('sanity/structure', () => ({
  usePaneRouter: () => ({routerPanesState: [], ChildLink: 'a'}),
}))

// jsdom has no ResizeObserver; the virtualized tree list observes its viewport
globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const options = {documentId: 'tree-doc', referenceTo: ['book'], maxDepth: 3}
const theme = buildTheme()

describe('TreeEditor', () => {
  test('keeps the tree mounted while an Activity boundary hides it', async () => {
    const tree = (mode: 'visible' | 'hidden') => (
      <ThemeProvider theme={theme}>
        <Activity mode={mode}>
          <TreeEditor options={options} tree={[]} onChange={vi.fn()} />
        </Activity>
      </ThemeProvider>
    )
    const {container, rerender} = render(tree('visible'))
    await act(async () => {
      await Promise.resolve()
    })

    const box = container.querySelector('#tree-doc')
    const editor = box?.firstElementChild
    expect(editor).toBeTruthy()

    rerender(tree('hidden'))
    // React detaches refs while hidden; the box must not forget its element
    expect(box?.firstElementChild).toBe(editor)

    rerender(tree('visible'))
    await act(async () => {
      await Promise.resolve()
    })
    expect(box?.firstElementChild).toBe(editor)
  })
})
