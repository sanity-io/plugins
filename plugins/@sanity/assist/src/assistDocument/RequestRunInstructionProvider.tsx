import {useCallback, useEffect, useState} from 'react'
import {type ObjectSchemaType, PatchEvent, type SanityDocument, unset} from 'sanity'

import {useRunInstruction} from '../assistLayout/RunInstructionProvider'

/**
 * Dummy path sent through form `onChange` so Studio's document-store `patch`
 * operation materializes a real `drafts.*` document from published values.
 *
 * After publish, the drafts perspective can still display published values
 * (a virtual draft) while `editState.draft` is null. A normal editor edit
 * goes through the same create-if-not-exists path; Studio uses
 * `_empty_action_guard_pseudo_field_` for that.
 */
export const FORCE_DOCUMENT_CREATION_FIELD = '_force_document_creation'

export interface DraftDelayedTaskArgs<T> {
  documentOnChange: (event: PatchEvent) => void
  // indicates if the document is a draft or liveEditable currently
  isDocAssistable: boolean
  /**
   * When true, a queued write waits until the in-flight draft create/patch
   * has committed so the assist backend can patch `drafts.*` in the Content Lake.
   */
  isSyncing?: boolean
  task: (args: T) => void
}

export function isDocAssistable(
  documentSchemaType: ObjectSchemaType,
  published?: SanityDocument | null,
  draft?: SanityDocument | null,
) {
  return !!(documentSchemaType.liveEdit ? published : draft)
}

export function needsDraftMaterialization(isDocAssistable: boolean): boolean {
  return !isDocAssistable
}

export function createDraftMaterializationEvent(): PatchEvent {
  return PatchEvent.from([unset([FORCE_DOCUMENT_CREATION_FIELD])])
}

export function canRunQueuedAssistWrite(isDocAssistable: boolean, isSyncing = false): boolean {
  return isDocAssistable && !isSyncing
}

/**
 * Decides whether a write can run now or must wait for a real draft.
 * Only calls `documentOnChange` when no write target exists yet.
 */
export function prepareAssistWrite(args: {
  isDocAssistable: boolean
  isSyncing?: boolean
  documentOnChange: (event: PatchEvent) => void
}): 'run' | 'queue' {
  if (needsDraftMaterialization(args.isDocAssistable)) {
    args.documentOnChange(createDraftMaterializationEvent())
    return 'queue'
  }
  if (args.isSyncing) {
    return 'queue'
  }
  return 'run'
}

export function useRequestRunInstruction(args: {
  documentOnChange: (event: PatchEvent) => void
  // indicates if the document is a draft or liveEditable currently
  isDocAssistable: boolean
  isSyncing?: boolean
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
  const {documentOnChange, isDocAssistable, isSyncing, task} = args

  const [queuedArgs, setQueuedArgs] = useState<T | undefined>(undefined)

  useEffect(() => {
    if (queuedArgs && canRunQueuedAssistWrite(isDocAssistable, isSyncing)) {
      task(queuedArgs)
      // oxlint-disable-next-line react/set-state-in-effect
      setQueuedArgs(undefined)
    }
  }, [queuedArgs, isDocAssistable, isSyncing, task])

  return useCallback(
    (taskArgs: T) => {
      if (prepareAssistWrite({isDocAssistable, isSyncing, documentOnChange}) === 'run') {
        task(taskArgs)
        return
      }
      setQueuedArgs(taskArgs)
    },
    [isDocAssistable, isSyncing, documentOnChange, task],
  )
}
