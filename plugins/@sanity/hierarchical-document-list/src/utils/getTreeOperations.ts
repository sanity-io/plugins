import {PatchEvent, type PathSegment, prefixPath, setIfMissing} from 'sanity'

import type {LocalTreeItem, NodeProps} from '../types'
import {
  type HandleMovedNode,
  type HandleMovedNodeData,
  getAddItemPatch,
  getDuplicateItemPatch,
  getMovedNodePatch,
  getRemoveItemPatch,
} from '../utils/treePatches'

export function getTreeOperations({
  patchPrefix,
  onChange,
}: {
  patchPrefix?: PathSegment
  onChange: (patch: PatchEvent) => void
}): {
  handleMovedNode: HandleMovedNode
  addItem: (item: LocalTreeItem) => void
  duplicateItem: (nodeProps: NodeProps) => void
  removeItem: (nodeProps: NodeProps) => void
} {
  function runPatches(patches: any) {
    const finalPatches = [
      // Ensure tree array exists before any operation
      setIfMissing([]),
      ...(patches || []),
    ]
    let patchEvent = PatchEvent.from(finalPatches)
    if (patchPrefix) {
      patchEvent = PatchEvent.from(finalPatches.map((patch) => prefixPath(patch, patchPrefix)))
    }
    onChange(patchEvent)
  }

  return {
    handleMovedNode: (data: HandleMovedNodeData) => runPatches(getMovedNodePatch(data)),
    addItem: (item: LocalTreeItem) => runPatches(getAddItemPatch(item)),
    duplicateItem: (nodeProps: NodeProps) => runPatches(getDuplicateItemPatch(nodeProps)),
    removeItem: (nodeProps: NodeProps) => runPatches(getRemoveItemPatch(nodeProps)),
  }
}
