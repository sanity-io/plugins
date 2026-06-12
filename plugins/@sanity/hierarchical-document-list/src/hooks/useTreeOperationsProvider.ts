import {PatchEvent, type PathSegment, prefixPath, setIfMissing} from 'sanity'

import type {LocalTreeItem, NodeProps} from '../types'
import {
  type HandleMovedNode,
  type HandleMovedNodeData,
  getAddItemPatch,
  getDuplicateItemPatch,
  getMoveItemPatch,
  getMovedNodePatch,
  getRemoveItemPatch,
} from '../utils/treePatches'

export default function useTreeOperationsProvider(props: {
  patchPrefix?: PathSegment
  onChange: (patch: PatchEvent) => void
  localTree: LocalTreeItem[]
}): {
  handleMovedNode: HandleMovedNode
  addItem: (item: LocalTreeItem) => void
  duplicateItem: (nodeProps: NodeProps) => void
  removeItem: (nodeProps: NodeProps) => void
  moveItemUp: (nodeProps: NodeProps) => void
  moveItemDown: (nodeProps: NodeProps) => void
} {
  const {localTree} = props

  function runPatches(patches: any) {
    const finalPatches = [
      // Ensure tree array exists before any operation
      setIfMissing([]),
      ...(patches || []),
    ]
    const prefix: PathSegment | undefined = props.patchPrefix
    let patchEvent = PatchEvent.from(finalPatches)
    if (prefix) {
      patchEvent = PatchEvent.from(finalPatches.map((patch) => prefixPath(patch, prefix)))
    }
    props.onChange(patchEvent)
  }

  function handleMovedNode(data: HandleMovedNodeData) {
    runPatches(getMovedNodePatch(data))
  }

  function addItem(item: LocalTreeItem) {
    runPatches(getAddItemPatch(item))
  }

  function duplicateItem(nodeProps: NodeProps) {
    runPatches(getDuplicateItemPatch(nodeProps))
  }

  function removeItem(nodeProps: NodeProps) {
    runPatches(getRemoveItemPatch(nodeProps))
  }

  function moveItemUp(nodeProps: NodeProps) {
    runPatches(
      getMoveItemPatch({
        nodeProps,
        localTree,
        direction: 'up',
      }),
    )
  }

  function moveItemDown(nodeProps: NodeProps) {
    runPatches(
      getMoveItemPatch({
        nodeProps,
        localTree,
        direction: 'down',
      }),
    )
  }

  return {
    handleMovedNode,
    addItem,
    removeItem,
    moveItemUp,
    moveItemDown,
    duplicateItem,
  }
}
