import {Children, type ReactElement, cloneElement} from 'react'

import TreeNodeRendererScaffold from './TreeNodeRendererScaffold'

/**
 * To prevent expand buttons from overflowing on the left, we add a minimum left padding to all entries
 */
const BASE_LEFT_PADDING = 10
const NESTING_PADDING = 14

const TreeNodeRenderer: any = (props: any) => {
  const {children, lowerSiblingCounts, connectDropTarget, isOver, draggedNode, canDrop} = props

  // Construct the scaffold representing the structure of the tree
  const scaffoldBlockCount = lowerSiblingCounts.length

  return (
    <div ref={connectDropTarget} style={props.style}>
      <div
        style={{
          // prettier-ignore
          paddingLeft: `${BASE_LEFT_PADDING + (NESTING_PADDING * scaffoldBlockCount)}px`,
        }}
      >
        {Children.map(children, (child) =>
          cloneElement(child as ReactElement<any>, {
            isOver,
            canDrop,
            draggedNode,
          }),
        )}
      </div>
      <TreeNodeRendererScaffold {...props} />
    </div>
  )
}

export default TreeNodeRenderer
