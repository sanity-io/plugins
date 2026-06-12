import type {LocalTreeItem} from '../types'
import type {LocalFlatDataItem} from './treePatches'

/**
 * Gets adjescent non-children nodes of a given treeIndex.
 */
export default function getAdjescentNodes({
  flatTree,
  node,
  treeIndex,
}: {
  flatTree: LocalFlatDataItem[]
  node: LocalTreeItem
  treeIndex: number
}): {
  leadingNode?: LocalFlatDataItem
  followingNode?: LocalFlatDataItem
} {
  // Disregard children nodes - these include the current node's key in their `path` array.
  // `path` is typed as number[] but contains the string keys returned by our `getNodeKey`.
  const isOutsideOfNode = (item: LocalFlatDataItem) => !(item.path as unknown[]).includes(node._key)

  const leadingNode = flatTree.slice(0, treeIndex).reverse().find(isOutsideOfNode)

  const followingNode = flatTree.slice(treeIndex + 1).find(isOutsideOfNode)

  return {
    leadingNode,
    followingNode,
  }
}
