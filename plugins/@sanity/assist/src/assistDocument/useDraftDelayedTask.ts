import {useCallback, useEffect, useEffectEvent, useRef} from 'react'
import {PatchEvent} from 'sanity'

export interface DraftDelayedTaskArgs<T> {
  documentOnChange: (event: PatchEvent) => void
  /**
   * True when a real write target exists: a `drafts.*` snapshot, the selected
   * release version, or the published document for live-edit types.
   */
  isDocAssistable: boolean
  /**
   * True while the document store has an in-flight commit. A queued task waits
   * for it so the assist backend never patches a document that only exists
   * optimistically in the Studio.
   */
  isSyncing?: boolean
  task: (args: T) => void
}

interface DocumentSignals {
  isDocAssistable: boolean
  isSyncing: boolean
}

type Phase = 'materializing' | 'awaiting-sync'

interface QueuedTask<T> {
  args: T
  phase: Phase
  attempts: number
}

/**
 * One attempt is the normal case. The second covers a draft that disappeared
 * (published, discarded, deleted remotely) while the task was queued.
 */
const MAX_MATERIALIZATION_ATTEMPTS = 2

/**
 * Advances a queued task one step for the given document signals and returns
 * the queue afterwards. Under unchanged signals a second call is a no-op, so the
 * caller can invoke it on every signal change without bookkeeping.
 */
function advance<T>(
  queued: QueuedTask<T> | null,
  {isDocAssistable, isSyncing}: DocumentSignals,
  {documentOnChange, task}: Pick<DraftDelayedTaskArgs<T>, 'documentOnChange' | 'task'>,
): QueuedTask<T> | null {
  if (!queued) {
    return null
  }

  if (queued.phase === 'materializing') {
    // Studio started the create/patch commit; wait for it to finish
    return isSyncing ? {...queued, phase: 'awaiting-sync'} : queued
  }

  if (isSyncing) {
    return queued
  }

  if (isDocAssistable) {
    task(queued.args)
    return null
  }

  if (queued.attempts >= MAX_MATERIALIZATION_ATTEMPTS) {
    return null
  }
  try {
    documentOnChange(PatchEvent.from([]))
  } catch {
    // Studio throws for read-only documents. Drop the task instead of the tree.
    return null
  }
  return {...queued, phase: 'materializing', attempts: queued.attempts + 1}
}

/**
 * Runs `task` once the document has a real write target in the Content Lake.
 *
 * After publish the drafts perspective shows a virtual draft with no `drafts.*`
 * document behind it. When that happens the hook sends an empty form `onChange`:
 * Studio's `patch.execute` still runs `createIfNotExists` for the draft even with
 * no patches, and the resulting edit action creates it server side. The task then
 * waits until that commit has both started and finished, because the optimistic
 * `editState.draft` appears before the draft exists remotely.
 *
 * The queue is never rendered, so it lives in a ref. The effect below only
 * reacts to the two document signals; nothing it does can re-trigger it.
 */
export function useDraftDelayedTask<T>(args: DraftDelayedTaskArgs<T>) {
  const {documentOnChange, isDocAssistable, isSyncing = false, task} = args
  const queuedRef = useRef<QueuedTask<T> | null>(null)

  const advanceQueue = useEffectEvent((signals: DocumentSignals) => {
    queuedRef.current = advance(queuedRef.current, signals, {documentOnChange, task})
  })

  useEffect(() => {
    advanceQueue({isDocAssistable, isSyncing})
  }, [isDocAssistable, isSyncing])

  return useCallback(
    (taskArgs: T) => {
      if (isDocAssistable && !isSyncing) {
        task(taskArgs)
        return
      }
      queuedRef.current = advance(
        {args: taskArgs, phase: 'awaiting-sync', attempts: 0},
        {isDocAssistable, isSyncing},
        {documentOnChange, task},
      )
    },
    [isDocAssistable, isSyncing, documentOnChange, task],
  )
}
