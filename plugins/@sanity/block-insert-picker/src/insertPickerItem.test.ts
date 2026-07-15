// The stub editor only implements `send`, the one member insertPickerItem
// touches; the `as never` casts hand it to the Editor-typed parameter.
// oxlint-disable no-unsafe-type-assertion
import {describe, expect, it, vi} from 'vitest'

import {insertPickerItem} from './insertPickerItem'
import type {PickerItem} from './types'

function makeStubEditor() {
  const sends: unknown[] = []
  return {
    send: (action: unknown) => sends.push(action),
    sends,
  }
}

const callout: PickerItem = {
  action: {blockType: 'callout', type: 'insertBlock'},
  id: 'callout',
  title: 'Callout',
  trigger: '/callout',
}

describe('insertPickerItem', () => {
  it('sends a single custom.blockInsertPicker.insert event in slash mode', () => {
    const editor = makeStubEditor()
    const onInsertedKey = vi.fn()
    insertPickerItem({
      anchorBlockKey: 'blk1',
      editor: editor as never,
      initialValue: {type: 'info'},
      item: callout,
      keyGenerator: () => 'new-block-key',
      mode: 'slash',
      onInsertedKey,
      query: '/cal',
    })
    expect(editor.sends).toEqual([
      {
        anchorBlockKey: 'blk1',
        block: {
          _key: 'new-block-key',
          _type: 'callout',
          type: 'info',
        },
        mode: 'slash',
        query: '/cal',
        type: 'custom.blockInsertPicker.insert',
      },
    ])
    expect(onInsertedKey).toHaveBeenCalledWith('new-block-key')
  })

  it('sends a single custom.blockInsertPicker.insert event in shortcut mode', () => {
    const editor = makeStubEditor()
    const onInsertedKey = vi.fn()
    insertPickerItem({
      anchorBlockKey: 'blk1',
      editor: editor as never,
      initialValue: {type: 'info'},
      item: callout,
      keyGenerator: () => 'new-block-key',
      mode: 'shortcut',
      onInsertedKey,
      query: '',
    })
    expect(editor.sends).toEqual([
      {
        anchorBlockKey: 'blk1',
        block: {
          _key: 'new-block-key',
          _type: 'callout',
          type: 'info',
        },
        mode: 'shortcut',
        query: '',
        type: 'custom.blockInsertPicker.insert',
      },
    ])
    expect(onInsertedKey).toHaveBeenCalledWith('new-block-key')
  })
})
