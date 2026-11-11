import type {ReactSortableTreeProps} from '@nosferatu500/react-sortable-tree'

import NodeContentRenderer from '../components/NodeContentRenderer'
import PlaceholderDropzone from '../components/PlaceholderDropzone'
import TreeNodeRenderer from '../components/TreeNodeRenderer'
import type {EnhancedTreeItem} from '../types'

export default function getCommonTreeProps({
  placeholder,
}: {
  placeholder: {
    title: string
    subtitle?: string
  }
}): Partial<ReactSortableTreeProps<EnhancedTreeItem>> {
  return {
    theme: {
      nodeContentRenderer: NodeContentRenderer,
      placeholderRenderer: (props: any) => <PlaceholderDropzone {...placeholder} {...props} />,
      treeNodeRenderer: TreeNodeRenderer,
      style: {height: '100%'},
      innerStyle: undefined,
      scaffoldBlockPxWidth: 44,
    },
  }
}
