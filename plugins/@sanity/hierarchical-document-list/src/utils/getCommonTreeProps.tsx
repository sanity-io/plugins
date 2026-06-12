import type {SortableTree} from '@nosferatu500/react-sortable-tree'
import type {ComponentProps} from 'react'

import NodeContentRenderer from '../components/NodeContentRenderer'
import PlaceholderDropzone from '../components/PlaceholderDropzone'
import TreeNodeRenderer from '../components/TreeNodeRenderer'

type ReactSortableTreeProps = ComponentProps<typeof SortableTree>

export default function getCommonTreeProps({
  placeholder,
}: {
  placeholder: {
    title: string
    subtitle?: string
  }
}): Partial<ReactSortableTreeProps> {
  return {
    theme: {
      nodeContentRenderer: NodeContentRenderer,
      placeholderRenderer: (props: any) => <PlaceholderDropzone {...placeholder} {...props} />,
      treeNodeRenderer: TreeNodeRenderer,
      style: {height: '100%'},
      innerStyle: undefined,
      scaffoldBlockPxWidth: 44,
      slideRegionSize: 100,
    },
  }
}
