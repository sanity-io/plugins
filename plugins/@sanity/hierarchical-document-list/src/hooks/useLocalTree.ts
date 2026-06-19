import {useState} from 'react'

import type {AllItems, LocalTreeItem, StoredTreeItem, VisibilityMap} from '../types'
import {dataToEditorTree} from '../utils/treeData'

/**
 * Enhances tree data with information on:
 *   - `expanded` - native property of react-sortable-tree to determine collapsing & expanding of a node's children
 *   - `draftId` & `publishedId` - refer to LocalTreeItem's type annotations
 *
 * Doesn't modify the main tree or has side-effects on data.
 * Has the added benefit of being local to the user, so external changes won't affect local visibility.
 */
export default function useLocalTree({
  tree,
  allItems,
}: {
  tree: StoredTreeItem[]
  allItems: AllItems
}): {
  handleVisibilityToggle: (data: any) => void
  localTree: LocalTreeItem[]
} {
  const [visibilityMap, setVisibilityMap] = useState<VisibilityMap>({})

  function handleVisibilityToggle(data: any) {
    setVisibilityMap((currentMap) => ({
      ...currentMap,
      [data.node._key]: data.expanded,
    }))
  }

  return {
    localTree: dataToEditorTree({
      tree,
      allItems,
      visibilityMap,
    }),
    handleVisibilityToggle,
  }
}
