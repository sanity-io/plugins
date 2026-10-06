import {expect, test} from 'vitest'

import type {NodeProps, StoredTreeItem} from '../types'
import {getDuplicateItemPatch} from './treePatches'

const SOURCE_DOCUMENT_ID = 'source-doc'

function sourceNode(): NodeProps {
  return {
    treeIndex: 1,
    node: {
      _key: 'existing-key',
      _type: 'hierarchy.tree.node',
      parent: 'parent-key',
      value: {
        _type: 'hierarchy.tree.nodeValue',
        docType: 'page',
        reference: {
          _type: 'reference',
          _ref: SOURCE_DOCUMENT_ID,
          _weak: true,
        },
      },
      children: [],
    },
  }
}

function isStoredTreeItem(value: unknown): value is StoredTreeItem {
  return (
    typeof value === 'object' && value !== null && '_key' in value && typeof value._key === 'string'
  )
}

function insertedItem(patches: unknown[]): StoredTreeItem {
  const patch = patches[0]
  if (!patch || typeof patch !== 'object' || !('items' in patch)) {
    throw new Error('Expected an insert patch')
  }
  const {items} = patch
  const item = Array.isArray(items) ? items[0] : undefined
  if (!isStoredTreeItem(item)) {
    throw new Error('Expected an inserted tree item')
  }
  return item
}

test('duplicating a hierarchy item references a new document', () => {
  const nodeProps = sourceNode()
  const patches = getDuplicateItemPatch(nodeProps)
  const duplicated = insertedItem(patches)

  expect(duplicated._key).not.toBe(nodeProps.node._key)
  // The copy must not point at the source document. Sharing `_ref` makes both
  // rows open and highlight the same document.
  expect(duplicated.value?.reference?._ref).not.toBe(SOURCE_DOCUMENT_ID)
})
