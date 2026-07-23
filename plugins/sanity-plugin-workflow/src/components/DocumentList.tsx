import {Draggable} from '@hello-pangea/dnd'
import {useMemo} from 'react'
import type {CurrentUser} from 'sanity'
import type {UserExtended} from 'sanity-plugin-utils'

import {filterItemsAndSort} from '../helpers/filterItemsAndSort'
import type {SanityDocumentWithMetadata, State} from '../types'
import {DocumentCard} from './DocumentCard'

type DocumentListProps = {
  data: SanityDocumentWithMetadata[]
  invalidDocumentIds: string[]
  patchingIds: string[]
  selectedSchemaTypes: string[]
  selectedUserIds: string[]
  state: State
  states: State[]
  toggleInvalidDocumentId: (documentId: string, action: 'ADD' | 'REMOVE') => void
  user: CurrentUser | null
  userList: UserExtended[]
  userRoleCanDrop: boolean
}

export default function DocumentList(props: DocumentListProps) {
  const {
    // oxlint-disable-next-line no-useless-default-assignment
    data = [],
    invalidDocumentIds,
    patchingIds,
    selectedSchemaTypes,
    selectedUserIds,
    state,
    states,
    toggleInvalidDocumentId,
    user,
    userList,
    userRoleCanDrop,
  } = props

  const dataFiltered = useMemo(() => {
    return data.length
      ? filterItemsAndSort(data, state.id, selectedUserIds, selectedSchemaTypes)
      : []
  }, [data, selectedSchemaTypes, selectedUserIds, state.id])

  if (!data.length || !dataFiltered.length) {
    return null
  }

  return (
    <div
      style={{
        height: `100%`,
        overflow: 'auto',
        // Smooths scrollbar behaviour
        overflowAnchor: 'none',
        scrollBehavior: 'auto',
        paddingTop: 1,
      }}
    >
      <div style={{width: '100%'}}>
        {dataFiltered.map((item, index) => {
          const {documentId, assignees} = item?._metadata ?? {}

          if (!documentId) {
            return null
          }

          const isInvalid = invalidDocumentIds.includes(documentId)
          const meInAssignees = user?.id ? assignees?.includes(user.id) : false
          const isDragDisabled =
            patchingIds.includes(documentId) ||
            !userRoleCanDrop ||
            isInvalid ||
            !(state.requireAssignment ? state.requireAssignment && meInAssignees : true)

          return (
            <Draggable
              key={documentId}
              draggableId={documentId}
              index={index}
              isDragDisabled={isDragDisabled}
            >
              {(draggableProvided, draggableSnapshot) => (
                <div
                  ref={draggableProvided.innerRef}
                  {...draggableProvided.draggableProps}
                  {...draggableProvided.dragHandleProps}
                  style={draggableProvided.draggableProps.style}
                >
                  <DocumentCard
                    userRoleCanDrop={userRoleCanDrop}
                    isDragDisabled={isDragDisabled}
                    isPatching={patchingIds.includes(documentId)}
                    isDragging={draggableSnapshot.isDragging}
                    item={item}
                    toggleInvalidDocumentId={toggleInvalidDocumentId}
                    userList={userList}
                    states={states}
                  />
                </div>
              )}
            </Draggable>
          )
        })}
      </div>
    </div>
  )
}
