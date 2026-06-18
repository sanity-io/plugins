import {randomKey} from '@sanity/util/content'

import DocumentInNode from '../components/DocumentInNode'
import NodeActions from '../components/NodeActions'
import type {
  AllItems,
  DocumentPair,
  EnhancedTreeItem,
  LocalTreeItem,
  NodeProps,
  StoredTreeItem,
  VisibilityMap,
} from '../types'
import flatDataToTree from './flatDataToTree'
import {INTERNAL_NODE_TYPE, INTERNAL_NODE_VALUE_TYPE} from './injectNodeTypeInPatches'

export const dataToEditorTree = ({
  tree,
  allItems,
  visibilityMap,
}: {
  tree: StoredTreeItem[]
  allItems: AllItems
  visibilityMap: VisibilityMap
}): LocalTreeItem[] => {
  const itemsWithTitle = tree
    .filter((item) => item?.value?.reference?._ref)
    .map((item) => {
      const refId = item.value?.reference?._ref
      const docPair = refId ? allItems[refId] : undefined
      const draftDoc = docPair?.draft
      const publishedDoc = docPair?.published

      const enhancedItem: LocalTreeItem = {
        _key: item._key,
        _type: item._type,
        value: item.value,
        parent: item.parent,
        expanded: visibilityMap[item._key] !== false,
        draftId: draftDoc?._id,
        publishedId: publishedDoc?._id,
        draftUpdatedAt: draftDoc?._updatedAt,
        publishedUpdatedAt: publishedDoc?._updatedAt,
      }

      return Object.assign(enhancedItem, {
        title: (nodeProps: NodeProps) => (
          <DocumentInNode item={enhancedItem} action={<NodeActions nodeProps={nodeProps} />} />
        ),
        children: [],
      })
    })
  return flatDataToTree(itemsWithTitle)
}

const documentPairToNode = (doc?: DocumentPair): EnhancedTreeItem | undefined => {
  if (!doc?.published?._id) {
    return undefined
  }

  return {
    _key: randomKey(12),
    _type: INTERNAL_NODE_TYPE,
    draftId: doc.draft?._id,
    draftUpdatedAt: doc.draft?._updatedAt,
    publishedId: doc.published._id,
    publishedUpdatedAt: doc.published?._updatedAt,
    value: {
      _type: INTERNAL_NODE_VALUE_TYPE,
      reference: {
        _ref: doc.published._id,
        _type: 'reference',
        _weak: true,
      },
      docType: doc.published._type,
    },
  }
}

export const getUnaddedItems = (data: {
  allItems: AllItems
  tree: StoredTreeItem[]
}): EnhancedTreeItem[] => {
  if (!data.tree) {
    return Object.values(data.allItems).flatMap((documentPair) => {
      const node = documentPairToNode(documentPair)
      return node ? [node] : []
    })
  }

  return Object.entries(data.allItems)
    .filter(
      ([publishedId]) =>
        publishedId &&
        // unadded items shouldn't be in the tree
        !data.tree.some((treeItem) => treeItem?.value?.reference?._ref === publishedId),
    )
    .flatMap(([, documentPair]) => {
      const node = documentPairToNode(documentPair)
      return node ? [node] : []
    })
}

export function normalizeNodeForStorage(item: LocalTreeItem): StoredTreeItem {
  return {
    _key: item._key,
    _type: item._type || INTERNAL_NODE_TYPE,
    value: item.value,
    parent: item.parent,
  }
}
