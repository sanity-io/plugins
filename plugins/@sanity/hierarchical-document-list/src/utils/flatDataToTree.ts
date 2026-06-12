import {getTreeFromFlatData} from '@nosferatu500/react-sortable-tree'

import type {StoredTreeItem} from '../types'

interface TreeItemWithChildren extends StoredTreeItem {
  // Index signature for structural compatibility with react-sortable-tree's TreeItem
  [key: string]: unknown
  children?: TreeItemWithChildren[]
}

export default function flatDataToTree(data: StoredTreeItem[]): TreeItemWithChildren[] {
  return getTreeFromFlatData({
    flatData: data.map((item) => ({
      ...item,
      // if parent: undefined, the tree won't be constructed
      parent: item.parent || null,
    })),
    getKey: (item) => item._key,
    getParentKey: (item) => item.parent,
    // without rootKey: null, the tree won't be constructed
    rootKey: null,
  }) as TreeItemWithChildren[]
}
