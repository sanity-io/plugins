import {useCallback, useEffect, useRef, useState} from 'react'
import {type ObjectSchemaType, PatchEvent, type SanityDocument, unset} from 'sanity'

import {useRunInstruction} from '../assistLayout/RunInstructionProvider'

/**
 * Same pseudo field Studio injects in document-pair `serverOperations/patch`
 * (`packages/sanity/src/core/store/document/document-pair/serverOperations/patch.ts`)
 * and in `checkoutPair.toActions` when a transaction would otherwise be empty.
 *
 * Do not invent a different name — the Actions API path is built around this one.
 */
export const EMPTY_ACTION_GUARD_PSEUDO_FIELD = '_empty_action_guard_pseudo_field_'

/**
 * How long to wait for an empty `onChange` to start creating the draft
 * (`useSyncState` / `editState.draft`) before falling back to Studio's
 * empty-action-guard unset.
 */
const EMPTY_ONCHANGE_FALLBACK_MS = 500

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

/**
 * Empty form `onChange`. Studio's `patch.execute` still `createIfNotExists`s
 * `drafts.*` from published when no draft snapshot exists, even if `patches`
 * is empty — the form pane always calls `patch.execute(toMutationPatches(event.patches))`.
 */
export function createDraftMaterializationEvent(): PatchEvent {
  return PatchEvent.from([])
}

/**
 * Fallback used only if the empty `onChange` does not materialize a draft.
 * Unsets Studio's empty-action-guard pseudo field so the document-store patch
 * path is guaranteed to be a non-empty transaction.
 */
export function createDraftMaterializationFallbackEvent(): PatchEvent {
  return PatchEvent.from([unset([EMPTY_ACTION_GUARD_PSEUDO_FIELD])])
}

export function canRunQueuedAssistWrite(isDocAssistable: boolean, isSyncing = false): boolean {
  return isDocAssistable && !isSyncing
}

/**
 * True when we already fired an empty `onChange`, the draft is still missing,
 * and no mutation is in flight — so Studio did not create the draft for us.
 */
export function shouldFallbackToEmptyActionGuard(
  isDocAssistable: boolean,
  isSyncing: boolean,
  alreadyTriedFallback: boolean,
): boolean {
  return !alreadyTriedFallback && needsDraftMaterialization(isDocAssistable) && !isSyncing
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
  const didFallbackRef = useRef(false)

  useEffect(() => {
    if (queuedArgs && canRunQueuedAssistWrite(isDocAssistable, isSyncing)) {
      task(queuedArgs)
      didFallbackRef.current = false
      // oxlint-disable-next-line react/set-state-in-effect
      setQueuedArgs(undefined)
    }
  }, [queuedArgs, isDocAssistable, isSyncing, task])

  useEffect(() => {
    let timer: number | undefined

    if (!queuedArgs) {
      didFallbackRef.current = false
    } else if (
      shouldFallbackToEmptyActionGuard(isDocAssistable, Boolean(isSyncing), didFallbackRef.current)
    ) {
      timer = window.setTimeout(() => {
        didFallbackRef.current = true
        documentOnChange(createDraftMaterializationFallbackEvent())
      }, EMPTY_ONCHANGE_FALLBACK_MS)
    }

    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer)
      }
    }
  }, [queuedArgs, isDocAssistable, isSyncing, documentOnChange])

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
