import {expect, test, vi} from 'vitest'

import type {NodeProps, StoredTreeItem} from '../types'
import {
  type DocumentDuplicationClient,
  type DuplicableDocument,
  duplicateHierarchyItem,
} from './duplicateDocument'
import {hasResolvableDocument} from './treeData'

const SOURCE_DOCUMENT_ID = 'source-doc'
const NEW_DOCUMENT_ID = 'new-doc'

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
      children: [{_key: 'child-key', _type: 'hierarchy.tree.node'}],
    },
  }
}

function pageDocument(
  overrides: Partial<DuplicableDocument> & Pick<DuplicableDocument, '_id'>,
): DuplicableDocument {
  return {
    _type: 'page',
    _rev: 'rev-1',
    _createdAt: '2020-01-01T00:00:00.000Z',
    _updatedAt: '2020-01-02T00:00:00.000Z',
    _system: {group: 'source-group'},
    title: 'Published title',
    body: {text: 'original'},
    ...overrides,
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

function createClient(documents: Record<string, DuplicableDocument | null>): {
  client: DocumentDuplicationClient
  created: DuplicableDocument[]
  fetched: string[]
} {
  const created: DuplicableDocument[] = []
  const fetched: string[] = []
  const client: DocumentDuplicationClient = {
    async getDocument(id) {
      fetched.push(id)
      return documents[id]
    },
    async create(document) {
      created.push(document)
      return document
    },
  }
  return {client, created, fetched}
}

test('duplicating a hierarchy item references a new document', async () => {
  const nodeProps = sourceNode()
  const published = pageDocument({_id: SOURCE_DOCUMENT_ID})
  const draft = pageDocument({
    _id: `drafts.${SOURCE_DOCUMENT_ID}`,
    title: 'Draft title',
    body: {text: 'draft body'},
  })
  const {client, created, fetched} = createClient({
    [SOURCE_DOCUMENT_ID]: published,
    [`drafts.${SOURCE_DOCUMENT_ID}`]: draft,
  })

  const patches = await duplicateHierarchyItem({
    nodeProps,
    client,
    liveEdit: false,
    newPublishedId: NEW_DOCUMENT_ID,
    key: 'duplicated-key',
  })

  expect(fetched).toEqual([`drafts.${SOURCE_DOCUMENT_ID}`, SOURCE_DOCUMENT_ID])
  expect(created).toHaveLength(1)
  const duplicate = created[0]
  expect(duplicate?._id).toBe(`drafts.${NEW_DOCUMENT_ID}`)
  expect(duplicate?._id).not.toBe(SOURCE_DOCUMENT_ID)
  expect(duplicate?._id).not.toBe(`drafts.${SOURCE_DOCUMENT_ID}`)
  expect(duplicate?._type).toBe('page')
  // Unpublished edits are what Studio duplicate copies.
  expect(duplicate?.['title']).toBe('Draft title')
  expect(duplicate?._rev).toBeUndefined()
  expect(duplicate?._createdAt).toBeUndefined()
  expect(duplicate?._updatedAt).toBeUndefined()
  expect(duplicate?._system).toBeUndefined()

  const duplicatedBody = duplicate?.['body']
  if (duplicatedBody && typeof duplicatedBody === 'object' && 'text' in duplicatedBody) {
    duplicatedBody.text = 'changed'
  }
  expect(draft['body']).toEqual({text: 'draft body'})
  expect(published['body']).toEqual({text: 'original'})

  if (!patches) {
    throw new Error('Expected tree patches')
  }
  expect(patches[0]).toMatchObject({
    type: 'insert',
    position: 'before',
    path: [{_key: 'existing-key'}],
  })
  const duplicated = insertedItem(patches)
  expect(duplicated._key).toBe('duplicated-key')
  expect(duplicated._key).not.toBe(nodeProps.node._key)
  // The copy must not point at the source document. Sharing `_ref` makes both
  // rows open and highlight the same document.
  expect(duplicated.value?.reference?._ref).toBe(NEW_DOCUMENT_ID)
  expect(duplicated.value?.reference?._ref).not.toBe(SOURCE_DOCUMENT_ID)
  expect(duplicated.value?.reference?._weak).toBe(true)
  expect(duplicated.value?.docType).toBe('page')
  expect(duplicated.parent).toBe('parent-key')
  expect('children' in duplicated).toBe(false)
  expect(nodeProps.node.value?.reference?._ref).toBe(SOURCE_DOCUMENT_ID)
})

test('duplicating a live edit document creates a published document', async () => {
  const {client, created, fetched} = createClient({
    [SOURCE_DOCUMENT_ID]: pageDocument({_id: SOURCE_DOCUMENT_ID, title: 'Live'}),
  })

  await duplicateHierarchyItem({
    nodeProps: sourceNode(),
    client,
    liveEdit: true,
    newPublishedId: NEW_DOCUMENT_ID,
    key: 'duplicated-key',
  })

  expect(fetched).toEqual([`drafts.${SOURCE_DOCUMENT_ID}`, SOURCE_DOCUMENT_ID])
  expect(created[0]?._id).toBe(NEW_DOCUMENT_ID)
  expect(created[0]?.['title']).toBe('Live')
})

test('duplicating a live edit document keeps unpublished edits', async () => {
  const {client, created} = createClient({
    [SOURCE_DOCUMENT_ID]: pageDocument({_id: SOURCE_DOCUMENT_ID, title: 'Published'}),
    [`drafts.${SOURCE_DOCUMENT_ID}`]: pageDocument({
      _id: `drafts.${SOURCE_DOCUMENT_ID}`,
      title: 'Unpublished edit',
    }),
  })

  await duplicateHierarchyItem({
    nodeProps: sourceNode(),
    client,
    liveEdit: true,
    newPublishedId: NEW_DOCUMENT_ID,
    key: 'duplicated-key',
  })

  expect(created[0]?._id).toBe(NEW_DOCUMENT_ID)
  expect(created[0]?.['title']).toBe('Unpublished edit')
})

test('duplicating does nothing when the source document is missing', async () => {
  const create = vi.fn()
  const patches = await duplicateHierarchyItem({
    nodeProps: sourceNode(),
    client: {
      async getDocument() {
        return null
      },
      create,
    },
    liveEdit: false,
    newPublishedId: NEW_DOCUMENT_ID,
    key: 'duplicated-key',
  })

  expect(patches).toBeUndefined()
  expect(create).not.toHaveBeenCalled()
})

test('a failed document create does not return a tree patch', async () => {
  await expect(
    duplicateHierarchyItem({
      nodeProps: sourceNode(),
      client: {
        async getDocument(id) {
          return id === SOURCE_DOCUMENT_ID ? pageDocument({_id: id}) : null
        },
        async create() {
          throw new Error('permission denied')
        },
      },
      liveEdit: false,
      newPublishedId: NEW_DOCUMENT_ID,
      key: 'duplicated-key',
    }),
  ).rejects.toThrow('permission denied')
})

test('draft-only documents stay addressable in the tree', () => {
  expect(hasResolvableDocument({publishedId: 'published'})).toBe(true)
  expect(hasResolvableDocument({draftId: 'drafts.new-doc'})).toBe(true)
  expect(hasResolvableDocument({})).toBe(false)
})
