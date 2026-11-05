import {type TreeItem, getVisibleNodeCount} from '@nosferatu500/react-sortable-tree'

export default function getTreeHeight<TData>(
  treeData: TreeItem<TData>[],
  rowHeight: number,
): string {
  const visibleNodeCount = getVisibleNodeCount({treeData})

  // prettier-ignore
  return `${50 + (rowHeight * visibleNodeCount)}px`
}
