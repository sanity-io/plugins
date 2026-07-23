import {useCallback, useEffect, useRef} from 'react'
import {type ObjectSchemaType, PatchEvent, type SanityDocument, unset} from 'sanity'

import {useRunInstruction} from '../assistLayout/RunInstructionProvider'

export interface DraftDelayedTaskArgs<T> {
  documentOnChange: (event: PatchEvent) => void
  // indicates if the document is a draft or liveEditable currently
  isDocAssistable: boolean
  task: (args: T) => void
}

export function isDocAssistable(
  documentSchemaType: ObjectSchemaType,
  published?: SanityDocument | null,
  draft?: SanityDocument | null,
) {
  return !!(documentSchemaType.liveEdit ? published : draft)
}

export function useRequestRunInstruction(args: {
  documentOnChange: (event: PatchEvent) => void
  // indicates if the document is a draft or liveEditable currently
  isDocAssistable: boolean
}) {
  const {runInstruction, instructionLoading} = useRunInstruction()
  const requestRunInstruction = useDraftDelayedTask({
    ...args,
    task: runInstruction,
  })

  return {
    instructionLoading,
    requestRunInstruction,
  }
}

/**
 * Ensures that the current document is a draft before running task
 */
export function useDraftDelayedTask<T>(args: DraftDelayedTaskArgs<T>) {
  const {documentOnChange, isDocAssistable, task} = args

  const queuedArgsRef = useRef<T | undefined>(undefined)

  const runQueuedTask = useCallback(() => {
    const queuedArgs = queuedArgsRef.current
    if (queuedArgs === undefined || !isDocAssistable) {
      return
    }
    queuedArgsRef.current = undefined
    task(queuedArgs)
  }, [isDocAssistable, task])

  useEffect(() => runQueuedTask(), [runQueuedTask])

  return useCallback(
    (taskArgs: T) => {
      // make a dummy edit: this will trigger the document/draft to be created
      documentOnChange(PatchEvent.from([unset(['_force_document_creation'])]))
      queuedArgsRef.current = taskArgs
      queueMicrotask(runQueuedTask)
    },
    [documentOnChange, runQueuedTask],
  )
}
