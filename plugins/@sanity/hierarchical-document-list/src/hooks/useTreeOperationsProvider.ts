import {useToast} from '@sanity/ui/toast'
import {randomKey} from '@sanity/util/content'
import {useRef} from 'react'
import {PatchEvent, type PathSegment, prefixPath, setIfMissing, useClient, useSchema} from 'sanity'

import type {LocalTreeItem, NodeProps} from '../types'
import {duplicateHierarchyItem} from '../utils/duplicateDocument'
import {
  type HandleMovedNode,
  type HandleMovedNodeData,
  getAddItemPatch,
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
  duplicateItem: (nodeProps: NodeProps) => Promise<void>
  removeItem: (nodeProps: NodeProps) => void
  moveItemUp: (nodeProps: NodeProps) => void
  moveItemDown: (nodeProps: NodeProps) => void
} {
  const {localTree} = props
  const client = useClient({apiVersion: '2021-09-01'})
  const schema = useSchema()
  const toast = useToast()
  const duplicatingKeys = useRef(new Set<string>())

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

  async function duplicateItem(nodeProps: NodeProps) {
    const referenceId = nodeProps.node.value?.reference?._ref
    const docType = nodeProps.node.value?.docType
    const nodeKey = nodeProps.node._key
    if (!referenceId || !docType || duplicatingKeys.current.has(nodeKey)) {
      return
    }

    duplicatingKeys.current.add(nodeKey)
    try {
      const patches = await duplicateHierarchyItem({
        nodeProps,
        client,
        liveEdit: schema.get(docType)?.liveEdit === true,
        newPublishedId: crypto.randomUUID(),
        key: randomKey(12),
      })
      if (patches) {
        runPatches(patches)
      } else {
        toast.push({
          status: 'error',
          title: 'Could not duplicate document',
          description: 'The original document could not be loaded.',
        })
      }
    } catch {
      toast.push({
        status: 'error',
        title: 'Could not duplicate document',
      })
    }
    duplicatingKeys.current.delete(nodeKey)
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
