import {useCallback, useMemo, useState} from 'react'
import {getDraftId, getVersionId, type ObjectSchemaType, usePerspective, useSchema} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {useAiPaneRouter} from '../../assistInspector/helpers'
import {useAiAssistanceConfig} from '../../assistLayout/AiAssistanceConfigContext'
import {fieldPathParam, type InstructionTask} from '../../types'
import type {AssistDocumentContextValue} from '../AssistDocumentContext'
import {isDocAssistable} from '../RequestRunInstructionProvider'
import {useStudioAssistDocument} from './useStudioAssistDocument'

export function useAssistDocumentContextValue(documentId: string, documentType: string) {
  const schema = useSchema()

  const {getFieldRefs, getFieldRefsByTypePath} = useAiAssistanceConfig()
  const documentSchemaType = useMemo(() => {
    // oxlint-disable-next-line no-unsafe-type-assertion
    const schemaType = schema.get(documentType) as ObjectSchemaType | undefined
    if (!schemaType) {
      throw new Error(`Schema type "${documentType}" not found`)
    }
    return schemaType
  }, [documentType, schema])

  const {fieldRefs, fieldRefsByTypePath} = useMemo(() => {
    return {
      fieldRefs: getFieldRefs(documentType),
      fieldRefsByTypePath: getFieldRefsByTypePath(documentType),
    }
  }, [getFieldRefs, getFieldRefsByTypePath, documentType])

  const {
    openInspector,
    closeInspector,
    inspector,
    onChange: documentOnChange,
    editState,
  } = useDocumentPane()
  const {selectedReleaseId} = usePerspective()
  const {draft, published, version} = editState || {}

  const assistableDocumentId = selectedReleaseId
    ? getVersionId(documentId, selectedReleaseId)
    : documentSchemaType.liveEdit
      ? documentId
      : getDraftId(documentId)

  const documentIsNew = selectedReleaseId ? !version?._id : !draft?._id && !published?._id
  const documentIsAssistable = selectedReleaseId
    ? !!version
    : isDocAssistable(documentSchemaType, published, draft)

  const {params} = useAiPaneRouter()
  const selectedPath = params[fieldPathParam]

  const assistDocument = useStudioAssistDocument({
    documentId: assistableDocumentId,
    schemaType: documentSchemaType,
  })
  const {syntheticTasks, addSyntheticTask, removeSyntheticTask} =
    useSyntheticTasks(assistableDocumentId)

  const value: AssistDocumentContextValue = useMemo(() => {
    const base = {
      assistableDocumentId,
      documentSchemaType,
      documentIsNew,
      documentIsAssistable,
      openInspector,
      closeInspector,
      inspector,
      documentOnChange,
      selectedPath,
      syntheticTasks,
      addSyntheticTask,
      removeSyntheticTask,
      fieldRefs,
      fieldRefsByTypePath,
    }
    if (!assistDocument) {
      return {...base, loading: true, assistDocument: undefined}
    }
    return {
      ...base,
      loading: false,
      assistDocument: assistDocument,
    }
  }, [
    assistDocument,
    documentIsAssistable,
    assistableDocumentId,
    documentSchemaType,
    documentIsNew,
    openInspector,
    closeInspector,
    inspector,
    documentOnChange,
    selectedPath,
    syntheticTasks,
    addSyntheticTask,
    removeSyntheticTask,
    fieldRefs,
    fieldRefsByTypePath,
  ])

  return value
}

function useSyntheticTasks(assistableDocumentId: string) {
  const [syntheticTasksState, setSyntheticTasksState] = useState<{
    assistableDocumentId: string
    tasks: InstructionTask[]
  }>(() => ({assistableDocumentId, tasks: []}))

  if (syntheticTasksState.assistableDocumentId !== assistableDocumentId) {
    setSyntheticTasksState({assistableDocumentId, tasks: []})
  }

  const syntheticTasks =
    syntheticTasksState.assistableDocumentId === assistableDocumentId
      ? syntheticTasksState.tasks
      : []

  const addSyntheticTask = useCallback(
    (task: InstructionTask) => {
      setSyntheticTasksState((current) => ({
        assistableDocumentId,
        tasks: [
          ...(current.assistableDocumentId === assistableDocumentId ? current.tasks : []),
          task,
        ],
      }))
    },
    [assistableDocumentId],
  )
  const removeSyntheticTask = useCallback(
    (task: InstructionTask) => {
      setSyntheticTasksState((current) => {
        if (current.assistableDocumentId !== assistableDocumentId) {
          return {assistableDocumentId, tasks: []}
        }
        return {
          assistableDocumentId,
          tasks: current.tasks.filter((t) => task._key !== t._key),
        }
      })
    },
    [assistableDocumentId],
  )

  return {
    syntheticTasks,
    addSyntheticTask,
    removeSyntheticTask,
  }
}
