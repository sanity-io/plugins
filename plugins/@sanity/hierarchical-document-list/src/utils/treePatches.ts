// Interfaces with the loosely-typed react-sortable-tree data shapes; the runtime values are
// guaranteed to be our own LocalTreeItem/LocalFlatDataItem objects.
// oxlint-disable typescript/no-unsafe-type-assertion
import {
  type FlatDataItem,
  type TreeItem,
  getFlatDataFromTree,
} from '@nosferatu500/react-sortable-tree'
import {randomKey} from '@sanity/util/content'
import * as Patch from 'sanity'

import type {LocalTreeItem, NodeProps} from '../types'
import getAdjescentNodes from './getAdjescentNodes'
import moveItemInArray from './moveItemInArray'
import {normalizeNodeForStorage} from './treeData'

/**
 * A {@link FlatDataItem} whose nodes are known to be the plugin's own tree items.
 */
export interface LocalFlatDataItem extends Omit<FlatDataItem, 'node' | 'parentNode'> {
  node: LocalTreeItem
  parentNode?: LocalTreeItem | null
}

/**
 * Data received from react-sortable-tree's `onMoveNode` callback.
 * `nextPath` is undefined / null when the node is removed from the tree.
 */
export interface HandleMovedNodeData {
  treeData: TreeItem[]
  node: LocalTreeItem
  nextParentNode?: LocalTreeItem | null
  nextPath?: number[] | null
  nextTreeIndex: number
}

export type HandleMovedNode = (moveData: HandleMovedNodeData) => void

function getLocalFlatDataFromTree(treeData: TreeItem[]): LocalFlatDataItem[] {
  return getFlatDataFromTree({
    treeData,
    getNodeKey: (t) => t.node['_key'] as string,
  }) as LocalFlatDataItem[]
}

export function getAddItemPatch(item: LocalTreeItem): unknown[] {
  const normalizedNode = normalizeNodeForStorage(item)

  return [
    // Add the node to the end of the tree
    Patch.insert([normalizedNode], 'after', [-1]),
  ]
}

export function getDuplicateItemPatch(nodeProps: NodeProps): unknown[] {
  const newItem = {
    ...nodeProps.node,
    _key: randomKey(12),
  }
  const normalizedNode = normalizeNodeForStorage(newItem)

  return [
    // Add duplicated node before the existing one
    Patch.insert([normalizedNode], 'before', [{_key: nodeProps.node._key}]),
  ]
}

export function getRemoveItemPatch({node}: Pick<NodeProps, 'node'>): unknown[] {
  const keyPath = {_key: node._key}
  const children = getChildrenPaths(node)

  return [
    // 1. Unset the removed node
    Patch.unset([keyPath]),

    // 2. Unset its children
    ...children.map((path) => Patch.unset([{_key: path}])),
  ]
}

export function getMovedNodePatch(data: HandleMovedNodeData): unknown[] {
  const {nextParentNode} = data
  const keyPath = {_key: data.node._key}

  // === REMOVING NODE FROM TREE ===
  // `nextPath` will be undefined / null if the item is removed from tree
  if (!Array.isArray(data.nextPath)) {
    return getRemoveItemPatch({node: data.node})
  }

  const nextFlatTree = getLocalFlatDataFromTree(data.treeData)
  const normalizedNode = normalizeNodeForStorage(data.node)

  const {leadingNode, followingNode} = getAdjescentNodes({
    flatTree: nextFlatTree,
    node: data.node,
    treeIndex: data.nextTreeIndex,
  })

  return [
    // 1. Unset the moved node
    // (will be ignored by Content Lake on new nodes with _key not yet in tree)
    Patch.unset([keyPath]),

    // 2. SIBLING-BASED PLACEMENT
    // If we were to place solely based on nextTreeIndex, concurrent changes from other editors could put the new node in an unexpected position.
    // Let's instead anchor it to the _key of the sibling coming before or after it.
    leadingNode?.node?._key
      ? // After the sibling before it
        Patch.insert([normalizedNode], 'after', [{_key: leadingNode.node._key}])
      : // Or before the sibling right after it, in case there's no leading sibling node
        // prettier-ignore
        Patch.insert([normalizedNode], 'before', [followingNode?.node?._key ? {_key: followingNode.node._key} : data.nextTreeIndex]),

    // 3. Patch the new node with its new `parent`
    nextParentNode
      ? // If it has a parent node, set that parent's _key
        Patch.set(nextParentNode._key, [keyPath, 'parent'])
      : // Else remove the parent key entirely
        Patch.unset([keyPath, 'parent']),
  ]
}

function getChildrenPaths(node: LocalTreeItem): string[] {
  if (!Array.isArray(node.children)) {
    return []
  }

  const keyPaths: string[] = []
  for (const child of node.children) {
    const childKey: unknown = child['_key']
    if (typeof childKey === 'string' && childKey) {
      keyPaths.push(childKey)
    }
    keyPaths.push(...getChildrenPaths(child as LocalTreeItem))
  }
  return keyPaths
}

export function getMoveItemPatch({
  nodeProps: {node, treeIndex},
  localTree,
  direction,
}: {
  nodeProps: NodeProps
  localTree: LocalTreeItem[]
  direction: 'up' | 'down'
}): unknown[] {
  const keyPath = {_key: node._key}

  const nextTreeIndex = treeIndex + (direction === 'up' ? -1 : 1)

  const flatTree = getLocalFlatDataFromTree(localTree)
  const nextFlatTree = moveItemInArray<LocalFlatDataItem>({
    array: flatTree,
    fromIndex: treeIndex,
    toIndex: nextTreeIndex,
  })
  const {leadingNode, followingNode} = getAdjescentNodes({
    flatTree: nextFlatTree,
    node,
    treeIndex: nextTreeIndex,
  })

  const normalizedNode = normalizeNodeForStorage(node)

  // When moving up, look at following node to figure out what is the next parent.
  const nodeToInheritParent = direction === 'up' ? followingNode : leadingNode
  const nextParentNode = nodeToInheritParent?.parentNode

  return [
    // 1. Unset the moved node
    // (will be ignored by Content Lake on new nodes with _key not yet in tree)
    Patch.unset([keyPath]),

    // 2. SIBLING-BASED PLACEMENT
    leadingNode?.node?._key
      ? // After the sibling before it
        Patch.insert([normalizedNode], 'after', [{_key: leadingNode.node._key}])
      : // Or before the sibling right after it, in case there's no leading sibling node
        Patch.insert([normalizedNode], 'before', [
          followingNode?.node?._key ? {_key: followingNode.node._key} : nextTreeIndex,
        ]),

    // 3. Patch the new node with its new `parent`
    nextParentNode
      ? // If it has a parent node, set that parent's _key
        Patch.set(nextParentNode._key, [keyPath, 'parent'])
      : // Else remove the parent key entirely
        Patch.unset([keyPath, 'parent']),
  ]
}
