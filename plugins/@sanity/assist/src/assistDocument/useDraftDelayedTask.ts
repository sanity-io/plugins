import {useCallback, useEffect, useState} from 'react'
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
 * Runs `task` once the document has a real write target in the Content Lake.
 *
 * After publish the drafts perspective shows a virtual draft with no `drafts.*`
 * document behind it. When that happens the hook sends an empty form `onChange`:
 * Studio's `patch.execute` still runs `createIfNotExists` for the draft even with
 * no patches, and the resulting edit action creates it server side. The task then
 * waits until that commit has both started and finished, because the optimistic
 * `editState.draft` appears before the draft exists remotely.
 */
export function useDraftDelayedTask<T>(args: DraftDelayedTaskArgs<T>) {
  const {documentOnChange, isDocAssistable, isSyncing = false, task} = args
  const [queued, setQueued] = useState<QueuedTask<T> | null>(null)

  useEffect(() => {
    if (!queued) {
      return
    }

    if (queued.phase === 'materializing') {
      if (isSyncing) {
        // Studio started the create/patch commit; wait for it to finish
        // oxlint-disable-next-line react/set-state-in-effect
        setQueued({...queued, phase: 'awaiting-sync'})
      }
      return
    }

    if (isSyncing) {
      return
    }

    if (isDocAssistable) {
      task(queued.args)
      setQueued(null)
      return
    }

    if (queued.attempts >= MAX_MATERIALIZATION_ATTEMPTS) {
      setQueued(null)
      return
    }
    try {
      documentOnChange(PatchEvent.from([]))
    } catch {
      // Studio throws for read-only documents. Drop the task instead of the tree.
      setQueued(null)
      return
    }
    setQueued({...queued, phase: 'materializing', attempts: queued.attempts + 1})
  }, [queued, isDocAssistable, isSyncing, task, documentOnChange])

  return useCallback(
    (taskArgs: T) => {
      if (isDocAssistable && !isSyncing) {
        task(taskArgs)
        return
      }
      setQueued({args: taskArgs, phase: 'awaiting-sync', attempts: 0})
    },
    [isDocAssistable, isSyncing, task],
  )
}
