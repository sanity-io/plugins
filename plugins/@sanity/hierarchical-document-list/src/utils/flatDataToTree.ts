import type {StoredTreeItem} from '../types'

interface TreeItemWithChildren extends StoredTreeItem {
  // Index signature for structural compatibility with react-sortable-tree's TreeItem
  [key: string]: unknown
  children?: TreeItemWithChildren[]
}

/**
 * Converts the flat array stored in the Sanity document into a nested tree,
 * nesting items under their `parent` _key. Items without a `parent` are roots.
 */
export default function flatDataToTree(data: StoredTreeItem[]): TreeItemWithChildren[] {
  const childrenByParent = new Map<string | null, StoredTreeItem[]>()
  for (const item of data) {
    const parentKey = item.parent || null
    const siblings = childrenByParent.get(parentKey)
    if (siblings) {
      siblings.push(item)
    } else {
      childrenByParent.set(parentKey, [item])
    }
  }

  const buildNode = (item: StoredTreeItem): TreeItemWithChildren => {
    const children = childrenByParent.get(item._key)
    return children ? {...item, children: children.map(buildNode)} : {...item}
  }

  return (childrenByParent.get(null) || []).map(buildNode)
}
