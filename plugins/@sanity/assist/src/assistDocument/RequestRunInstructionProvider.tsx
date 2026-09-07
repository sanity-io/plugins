import {useCallback, useEffect, useRef, useState} from 'react'
import {type ObjectSchemaType, PatchEvent, type SanityDocument} from 'sanity'

import {useRunInstruction} from '../assistLayout/RunInstructionProvider'

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

/**
 * Empty form `onChange`. Studio's `patch.execute` still `createIfNotExists`s
 * `drafts.*` from published when no draft snapshot exists, even if `patches`
 * is empty — the form pane always calls `patch.execute(toMutationPatches(event.patches))`.
 */
export function createDraftMaterializationEvent(): PatchEvent {
  return PatchEvent.from([])
}

export function canRunQueuedAssistWrite(
  isDocAssistable: boolean,
  isSyncing = false,
  options: {waitForCommit?: boolean} = {},
): boolean {
  if (!isDocAssistable || isSyncing) {
    return false
  }
  // After we ask Studio to create a missing draft, do not POST until a commit
  // has been observed. Optimistic `editState.draft` can flip assistable before
  // `drafts.*` exists in the Content Lake.
  return !options.waitForCommit
}

/**
 * Decides whether a write can run now or must wait for a real draft.
 * Only calls `documentOnChange` when no write target exists yet.
 * First attempt is an empty / no-op `onChange`.
 */
export function prepareAssistWrite(args: {
  isDocAssistable: boolean
  isSyncing?: boolean
  documentOnChange: (event: PatchEvent) => void
}): 'run' | 'queue' {
  if (!args.isDocAssistable) {
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
  const didFallbackRef = useRef(false)
  const pendingMaterializationRef = useRef(false)
  const sawCommitRef = useRef(false)

  useEffect(() => {
    if (queuedArgs && pendingMaterializationRef.current && isSyncing) {
      sawCommitRef.current = true
    }
    if (
      queuedArgs &&
      canRunQueuedAssistWrite(isDocAssistable, isSyncing, {
        waitForCommit: pendingMaterializationRef.current && !sawCommitRef.current,
      })
    ) {
      task(queuedArgs)
      didFallbackRef.current = false
      pendingMaterializationRef.current = false
      sawCommitRef.current = false
      setQueuedArgs(undefined)
    }
  }, [queuedArgs, isDocAssistable, isSyncing, task])

  return useCallback(
    (taskArgs: T) => {
      if (prepareAssistWrite({isDocAssistable, isSyncing, documentOnChange}) === 'run') {
        task(taskArgs)
        return
      }
      if (!isDocAssistable) {
        pendingMaterializationRef.current = true
        sawCommitRef.current = false
      }
      setQueuedArgs(taskArgs)
    },
    [isDocAssistable, isSyncing, documentOnChange, task],
  )
}
