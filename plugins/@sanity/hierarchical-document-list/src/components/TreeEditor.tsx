// oxlint-disable typescript/no-unsafe-type-assertion - legacy code will be lint-cleaned in a follow-up PR
import {
  SortableTreeWithoutDndContext as SortableTree,
  type TreeItem,
} from '@nosferatu500/react-sortable-tree'
import {AddCircleIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Spinner, Stack, Text, Tooltip} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'
import type {PatchEvent} from 'sanity'

import useAllItems from '../hooks/useAllItems'
import useLocalTree from '../hooks/useLocalTree'
import {TreeOperationsContext} from '../hooks/useTreeOperations'
import useTreeOperationsProvider from '../hooks/useTreeOperationsProvider'
import type {Optional, StoredTreeItem, TreeDeskStructureProps} from '../types'
import getCommonTreeProps from '../utils/getCommonTreeProps'
import getTreeHeight from '../utils/getTreeHeight'
import {getUnaddedItems} from '../utils/treeData'
import type {HandleMovedNodeData} from '../utils/treePatches'
import DocumentInNode from './DocumentInNode'
import {TreeEditorErrorBoundary} from './TreeEditorErrorBoundary'

interface TreeEditorProps {
  tree: StoredTreeItem[]
  onChange: (patch: PatchEvent) => void
  options: Optional<TreeDeskStructureProps, 'documentId'>
  patchPrefix?: string
}

/**
 * The loaded tree users interact with
 */
function TreeEditor(props: TreeEditorProps) {
  const {status: allItemsStatus, allItems} = useAllItems(props.options)
  const unAddedItems = getUnaddedItems({tree: props.tree, allItems})

  const {localTree, handleVisibilityToggle} = useLocalTree({
    tree: props.tree,
    allItems,
  })

  const operations = useTreeOperationsProvider({
    patchPrefix: props.patchPrefix,
    onChange: props.onChange,
    localTree,
  })

  const [context, setContext] = useState<HTMLElement | null>(null)
  const [treeViewHeight, setTreeViewHeight] = useState<string>('')

  const documentId = props.options.documentId

  const updateTreeViewHeight = useCallback(() => {
    const el = document.querySelector<HTMLElement>(`#${documentId} [data-tree-row]`)
    const rowHeight = el?.offsetHeight || 51
    setTreeViewHeight(getTreeHeight(localTree, rowHeight))
  }, [documentId, localTree])

  useEffect(() => {
    // Wait for dom to load before (re)calculating the tree height.
    const timeout = setTimeout(updateTreeViewHeight)
    return () => clearTimeout(timeout)
  }, [updateTreeViewHeight])

  const onMoveNode = useCallback(
    // The tree nodes are always our own LocalTreeItem objects
    (data: unknown) => operations.handleMovedNode(data as HandleMovedNodeData),
    [operations],
  )

  const treeProps = useMemo(
    () =>
      getCommonTreeProps({
        placeholder: {
          title: 'Add items from the list below',
        },
      }),
    [],
  )

  const operationContext = useMemo(
    () => ({...operations, allItemsStatus}),
    [operations, allItemsStatus],
  )

  return (
    <TreeEditorErrorBoundary>
      {/*Use this Box-wrapper to get a context Element to prevent DndProvider to have to HTML% backend at the same time https://github.com/react-dnd/react-dnd/issues/186#issuecomment-978206387 */}
      <Box id={documentId} ref={setContext}>
        {context ? (
          <DndProvider backend={HTML5Backend} options={{rootElement: context}}>
            <TreeOperationsContext.Provider value={operationContext}>
              <Stack gap={4} paddingTop={4}>
                <Card
                  style={{minHeight: treeViewHeight}}
                  // Only include borderBottom if there's something to show in unadded items
                  borderBottom={allItemsStatus !== 'success' || unAddedItems?.length > 0}
                >
                  <SortableTree
                    maxDepth={props.options.maxDepth}
                    onChange={doNothingOnChange}
                    onVisibilityToggle={handleVisibilityToggle}
                    canDrop={canDrop}
                    onMoveNode={onMoveNode}
                    // Stable keys keep row identity (and their DOM nodes) intact while
                    // rows are repositioned during a drag
                    getNodeKey={getNodeKey}
                    treeData={localTree}
                    // The tree renders inside a virtualized list which requires
                    // a definite height (percentages would resolve to 0)
                    style={treeViewHeight ? {height: treeViewHeight} : undefined}
                    {...treeProps}
                  />
                </Card>

                {allItemsStatus === 'success' && unAddedItems?.length > 0 && (
                  <Stack gap={1} paddingX={2} paddingTop={3}>
                    <Stack gap={2} paddingX={2} paddingBottom={3}>
                      <Text size={2} as="h2" weight="semibold">
                        Add more items
                      </Text>
                      <Text size={1} muted>
                        Only published documents are shown.
                      </Text>
                    </Stack>
                    {unAddedItems.map((item) => (
                      <DocumentInNode
                        key={item.publishedId || item.draftId}
                        item={item}
                        action={
                          <Tooltip
                            portal
                            placement="left"
                            content={
                              <Box padding={2}>
                                <Text size={1}>Add to list</Text>
                              </Box>
                            }
                          >
                            <Button
                              onClick={() => {
                                operations.addItem(item)
                              }}
                              mode="bleed"
                              icon={AddCircleIcon}
                              style={{cursor: 'pointer'}}
                            />
                          </Tooltip>
                        }
                      />
                    ))}
                  </Stack>
                )}
                {allItemsStatus === 'loading' && (
                  <Flex padding={4} align={'center'} justify={'center'}>
                    <Spinner size={3} muted />
                  </Flex>
                )}
                {allItemsStatus === 'error' && (
                  <Flex padding={4} align={'center'} justify={'center'}>
                    <Text size={2} weight="semibold">
                      Something went wrong when loading documents
                    </Text>
                  </Flex>
                )}
              </Stack>
            </TreeOperationsContext.Provider>
          </DndProvider>
        ) : null}
      </Box>
    </TreeEditorErrorBoundary>
  )
}

function canDrop({nextPath, prevPath}: {nextPath: number[]; prevPath: number[]}) {
  const insideItself =
    nextPath.length >= prevPath.length &&
    prevPath.every((pathIndex, index) => nextPath[index] === pathIndex)
  return !insideItself
}

const doNothingOnChange = () => {
  // Do nothing. onMoveNode will do all the work
}

const getNodeKey = (data: {node: TreeItem}) => data.node['_key'] as string

export default TreeEditor
