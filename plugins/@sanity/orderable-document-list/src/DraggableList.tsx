import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
  type DraggableLocation,
} from '@hello-pangea/dnd'
import {Box, Card, useToast} from '@sanity/ui'
import {useEffect, useState, useMemo, useCallback, type CSSProperties} from 'react'
import type {PatchOperations} from 'sanity'
import {usePaneRouter} from 'sanity/structure'

import {Document} from './Document'
import {useSanityClient} from './helpers/client'
import {ORDER_FIELD_NAME} from './helpers/constants'
import {reorderDocuments} from './helpers/reorderDocuments'
import type {SanityDocumentWithOrder} from './types'

interface ListSetting {
  isDuplicate: boolean
  isGhosting: boolean
  isDragging: boolean
  isSelected: boolean
}

interface DragResultLike {
  draggableId: string
  source: DraggableLocation
  destination: DraggableLocation | null
}

export interface DraggableListProps {
  data: SanityDocumentWithOrder[]
  listIsUpdating: boolean
  setListIsUpdating: (val: boolean) => void
}

const getItemStyle = (
  draggableStyle: CSSProperties | undefined,
  itemIsUpdating: boolean,
): CSSProperties => ({
  userSelect: 'none',
  transition: 'opacity 500ms ease-in-out',
  opacity: itemIsUpdating ? 0.2 : 1,
  pointerEvents: itemIsUpdating ? 'none' : undefined,
  ...draggableStyle,
})

const cardTone = (settings: ListSetting) => {
  const {isDuplicate, isGhosting, isDragging, isSelected} = settings

  if (isGhosting) return 'transparent'
  if (isDragging || isSelected) return 'primary'
  if (isDuplicate) return 'caution'

  return undefined
}

export function DraggableList({data, listIsUpdating, setListIsUpdating}: DraggableListProps) {
  const toast = useToast()
  const router = usePaneRouter()
  const {groupIndex, routerPanesState} = router

  const currentDoc = routerPanesState[groupIndex + 1]?.[0]?.id || false

  // Maintains local state order before transaction completes
  const [orderedData, setOrderedData] = useState<SanityDocumentWithOrder[]>(data)
  const displayedData = listIsUpdating ? orderedData : data

  const [draggingId, setDraggingId] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>(currentDoc ? [currentDoc] : [])

  const clearSelected = useCallback(() => setSelectedIds([]), [setSelectedIds])

  const handleSelect = useCallback(
    (clickedId: string, index: number, nativeEvent: MouseEvent) => {
      const isSelected = selectedIds.includes(clickedId)
      const selectMultiple = nativeEvent.shiftKey
      const isUsingWindows = navigator.appVersion.indexOf('Win') !== -1
      const selectAdditional = isUsingWindows ? nativeEvent.ctrlKey : nativeEvent.metaKey

      let updatedIds: string[] = []

      // No modifier keys pressed during click:
      // - update selected to just this one
      // - open document
      if (!selectMultiple && !selectAdditional) {
        return setSelectedIds([clickedId])
      }

      // If shift key was held, prevent default to avoid new window opening
      if (selectMultiple) {
        nativeEvent.preventDefault()
      }

      // Shift key was held, add id's between last selected and this one
      // ...before adding this one
      if (selectMultiple && !isSelected) {
        const lastSelectedId = selectedIds[selectedIds.length - 1] ?? clickedId
        const lastSelectedIndex = displayedData.findIndex((item) => item._id === lastSelectedId)

        const firstSelected = index < lastSelectedIndex ? index : lastSelectedIndex
        const lastSelected = index > lastSelectedIndex ? index : lastSelectedIndex

        const betweenIds = displayedData
          .filter((_, itemIndex) => itemIndex > firstSelected && itemIndex < lastSelected)
          .map((item) => item._id)

        updatedIds = [...selectedIds, ...betweenIds, clickedId]
      } else if (isSelected) {
        // Toggle off a single id
        updatedIds = selectedIds.filter((id) => id !== clickedId)
      } else {
        // Toggle on a single id
        updatedIds = [...selectedIds, clickedId]
      }

      return setSelectedIds(updatedIds)
    },
    [displayedData, selectedIds],
  )

  const client = useSanityClient()

  const transactPatches = useCallback(
    async (patches: [string, PatchOperations][], message: string) => {
      const transaction = client.transaction()

      patches.forEach(([docId, ops]) => {
        transaction.patch(docId, ops)
      })

      try {
        const updated = await transaction.commit({
          visibility: 'sync',
          tag: 'orderable-document-list.reorder',
        })
        clearSelected()
        setDraggingId('')
        setListIsUpdating(false)
        toast.push({
          title: `${
            updated.results.length === 1 ? '1 document' : `${updated.results.length} documents`
          } reordered`,
          status: 'success',
          description: message,
        })
      } catch {
        setDraggingId('')
        setListIsUpdating(false)
        toast.push({
          title: 'Reordering failed',
          status: 'error',
        })
      }
    },
    [client, clearSelected, setListIsUpdating, toast],
  )

  const handleDragEnd = useCallback(
    (result: DragResultLike | undefined, entities: SanityDocumentWithOrder[]) => {
      setDraggingId('')

      const {source, destination, draggableId} = result ?? {}

      // Don't do anything if nothing changed
      if (source?.index === destination?.index) return

      // Don't do anything if we don't have the entitites
      if (!entities.length || !draggableId || !source || !destination) return

      // A document can be dragged without being one-of-many-selected
      const effectedIds = selectedIds.length > 0 ? selectedIds : [draggableId]

      // Don't do anything if we don't have ids to effect
      if (effectedIds.length === 0) return

      // Update state to update styles + prevent data refetching
      setListIsUpdating(true)
      setSelectedIds(effectedIds)

      const {newOrder, patches, message} = reorderDocuments({
        entities,
        selectedIds: effectedIds,
        source,
        destination,
      })

      // Update local state
      if (newOrder.length > 0) {
        setOrderedData(newOrder)
      }

      // Transact new order patches
      if (patches.length > 0) {
        void transactPatches(patches, message)
      }
    },
    [selectedIds, transactPatches, setListIsUpdating],
  )

  const handleDragStart = useCallback(
    (start: {draggableId: string}) => {
      const id = start.draggableId
      const selected = selectedIds.includes(id)

      // if dragging an item that is not selected - unselect all items
      if (!selected) clearSelected()

      setDraggingId(id)
    },
    [selectedIds, clearSelected],
  )

  // Move one document up or down one place, by fake invoking the drag function
  const incrementIndex = useCallback(
    (shiftFrom: number, shiftTo: number, id: string, entities: SanityDocumentWithOrder[]) => {
      const result: DragResultLike = {
        draggableId: id,
        source: {droppableId: 'documentSortZone', index: shiftFrom},
        destination: {droppableId: 'documentSortZone', index: shiftTo},
      }

      return handleDragEnd(result, entities)
    },
    [handleDragEnd],
  )

  const onWindowKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearSelected()
      }
    },
    [clearSelected],
  )

  useEffect(() => {
    window.addEventListener('keydown', onWindowKeyDown)

    return () => {
      window.removeEventListener('keydown', onWindowKeyDown)
    }
  }, [onWindowKeyDown])

  // Find all items with duplicate order field
  const duplicateOrders = useMemo(() => {
    if (displayedData.length === 0) return []

    const orderField = displayedData.map((item) => item[ORDER_FIELD_NAME])

    return orderField.filter((item, index) => orderField.indexOf(item) !== index)
  }, [displayedData])

  const onDragEnd = useCallback(
    (result: DropResult) => handleDragEnd(result, displayedData),
    [displayedData, handleDragEnd],
  )

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={onDragEnd}>
      <Droppable droppableId="documentSortZone">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {displayedData.map((item, index) => (
              <Draggable
                key={`${item._id}-${item[ORDER_FIELD_NAME]}`}
                draggableId={item._id}
                index={index}
              >
                {(innerProvided, innerSnapshot) => {
                  const isSelected = selectedIds.includes(item._id)
                  const isDragging = innerSnapshot.isDragging
                  const isGhosting = Boolean(!isDragging && draggingId && isSelected)
                  const isUpdating = listIsUpdating && isSelected
                  const isDisabled = !item[ORDER_FIELD_NAME]
                  const isDuplicate = duplicateOrders.includes(item[ORDER_FIELD_NAME])
                  const tone = cardTone({isDuplicate, isGhosting, isDragging, isSelected})
                  const selectedCount = selectedIds.length

                  const dragBadge = isDragging && selectedCount > 1 ? selectedCount : false

                  return (
                    <div
                      ref={innerProvided.innerRef}
                      {...innerProvided.draggableProps}
                      {...innerProvided.dragHandleProps}
                      style={
                        isDisabled
                          ? {opacity: 0.2, pointerEvents: 'none'}
                          : getItemStyle(innerProvided.draggableProps.style, isUpdating)
                      }
                    >
                      <Box paddingBottom={1}>
                        <Card
                          tone={tone}
                          shadow={isDragging ? 2 : undefined}
                          radius={2}
                          onClick={(e) => handleSelect(item._id, index, e.nativeEvent)}
                        >
                          <Document
                            doc={item}
                            entities={displayedData}
                            increment={incrementIndex}
                            index={index}
                            isFirst={index === 0}
                            isLast={index === displayedData.length - 1}
                            dragBadge={dragBadge}
                          />
                        </Card>
                      </Box>
                    </div>
                  )
                }}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
