import {describe, expect, it} from 'vitest'

import type {FolderDoc} from '../types'
import {buildFolderIndex, getFolderAncestry} from './folderTree'

const folder = (_id: string, name: string, parentId: string | null = null): FolderDoc => ({
  _id,
  name,
  parentId,
})

describe('buildFolderIndex', () => {
  it('nests folders under their parent, sorted by name with numbers in order', () => {
    const {tree} = buildFolderIndex(
      [
        folder('f10', 'Folder 10'),
        folder('f2', 'folder 2'),
        folder('child-b', 'b', 'f2'),
        folder('child-a', 'A', 'f2'),
      ],
      {},
    )

    expect(tree.map((node) => node.name)).toEqual(['folder 2', 'Folder 10'])
    expect(tree[0]?.children.map((node) => [node.name, node.path])).toEqual([
      ['A', 'folder 2/A'],
      ['b', 'folder 2/b'],
    ])
  })

  it('counts the assets of nested folders in the total of their ancestors', () => {
    const {byId} = buildFolderIndex(
      [folder('root', 'Root'), folder('child', 'Child', 'root'), folder('leaf', 'Leaf', 'child')],
      {child: 2, leaf: 3, root: 1},
    )

    expect([byId['root'], byId['child'], byId['leaf']].map((node) => node?.totalCount)).toEqual([
      6, 5, 3,
    ])
    expect(byId['root']?.exactCount).toBe(1)
  })

  it('shows folders of unknown parents at the root', () => {
    const {tree} = buildFolderIndex([folder('orphan', 'Orphan', 'deleted')], {})

    expect(tree.map((node) => [node.id, node.path])).toEqual([['orphan', 'Orphan']])
  })

  it('keeps folders in a parent cycle resolvable by id', () => {
    const {byId, tree} = buildFolderIndex([folder('a', 'A', 'b'), folder('b', 'B', 'a')], {a: 1})

    expect(tree).toEqual([])
    expect(byId['a']).toMatchObject({children: [], path: 'B/A', totalCount: 1})
    expect(getFolderAncestry(byId, 'a').map((node) => node.id)).toEqual(['b', 'a'])
  })
})

describe('getFolderAncestry', () => {
  it('lists the folder and its ancestors from the root down', () => {
    const {byId} = buildFolderIndex(
      [folder('root', 'Root'), folder('child', 'Child', 'root'), folder('leaf', 'Leaf', 'child')],
      {},
    )

    expect(getFolderAncestry(byId, 'leaf').map((node) => node.id)).toEqual([
      'root',
      'child',
      'leaf',
    ])
    expect(getFolderAncestry(byId, null)).toEqual([])
    expect(getFolderAncestry(byId, 'missing')).toEqual([])
  })
})
