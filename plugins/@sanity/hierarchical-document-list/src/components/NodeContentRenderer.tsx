import {isDescendant} from '@nosferatu500/react-sortable-tree'
import {cyan, gray, red} from '@sanity/color'
import {ChevronDownIcon, ChevronRightIcon, DragHandleIcon} from '@sanity/icons'
import {Box, Button, Flex, Spinner} from '@sanity/ui'
import {useMemo} from 'react'
import {styled} from 'styled-components'

const Root = styled.div`
  // Adapted from react-sortable-tree/style.css
  &[data-landing='true'] > *,
  &[data-cancel='true'] > * {
    opacity: 0 !important;
  }
  &[data-landing='true']::before,
  &[data-cancel='true']::before {
    background-color: ${cyan[50].hex};
    border: 2px dashed ${gray[400].hex};
    border-radius: 3px;
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: -1;
  }

  &[data-cancel='true']::before {
    background-color: ${red[50].hex};
  }
`

/**
 * Customization of react-sortable-tree's default node.
 * Created in order to use Sanity UI for styles.
 * Reference: https://github.com/frontend-collective/react-sortable-tree/blob/master/src/node-renderer-default.js
 */
const NodeContentRenderer: any = (props: any) => {
  const {
    node,
    path,
    treeIndex,
    canDrag = false,
    canDrop,
    connectDragSource,
    connectDragPreview,
    toggleChildrenVisibility,
    draggedNode,
    didDrop,
    isDragging,
  } = props
  const nodeTitle = node.title
  const Handle = useMemo(() => {
    if (!canDrag) {
      return null
    }
    if (typeof node.children === 'function' && node.expanded) {
      // Show a loading symbol on the handle when the children are expanded
      //  and yet still defined by a function (a callback to fetch the children)
      return <Spinner />
    }

    const button = (
      <Button
        mode="bleed"
        paddingX={0}
        paddingY={1}
        style={{
          cursor: node.publishedId ? 'grab' : 'default',
          fontSize: '1.5625rem',
        }}
        data-ui="DragHandleButton"
        data-drag-handle={canDrag}
        disabled={!node.publishedId}
      >
        <DragHandleIcon style={{marginBottom: '-0.1em'}} />
      </Button>
    )

    // Don't allow editors to drag invalid documents
    if (!node.publishedId) {
      return <div>{button}</div>
    }

    // Show the handle used to initiate a drag-and-drop
    return <div ref={connectDragSource}>{button}</div>
  }, [canDrag, node, connectDragSource])

  const isDraggedDescendant = draggedNode && isDescendant(draggedNode, node)
  const isLandingPadActive = !didDrop && isDragging

  return (
    <Box style={{position: 'relative'}}>
      {toggleChildrenVisibility &&
        node.children &&
        (node.children.length > 0 || typeof node.children === 'function') && (
          <div
            style={{
              position: 'absolute',
              left: '-2px',
              top: '40%',
              transform: 'translate(-100%, -50%)',
            }}
          >
            <Button
              aria-label={node.expanded ? 'Collapse' : 'Expand'}
              icon={
                node.expanded ? (
                  <ChevronDownIcon color={gray[200].hex} />
                ) : (
                  <ChevronRightIcon color={gray[200].hex} />
                )
              }
              mode="bleed"
              fontSize={2}
              padding={1}
              type="button"
              onClick={() =>
                toggleChildrenVisibility?.({
                  node,
                  path,
                  treeIndex,
                })
              }
            />
          </div>
        )}

      <div ref={connectDragPreview}>
        <Root
          data-landing={isLandingPadActive}
          data-cancel={isLandingPadActive && !canDrop}
          style={{
            opacity: isDraggedDescendant ? 0.5 : 1,
          }}
        >
          <Flex align="center">
            {Handle}
            {typeof nodeTitle === 'function' ? nodeTitle({node, path, treeIndex}) : nodeTitle}
          </Flex>
        </Root>
      </div>
    </Box>
  )
}

export default NodeContentRenderer
