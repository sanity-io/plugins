import type {EditStateFor} from 'sanity'

import {useRunInstruction} from '../assistLayout/RunInstructionProvider'
import {type DraftDelayedTaskArgs, useDraftDelayedTask} from './useDraftDelayedTask'

export function isDocAssistable(
  writeDocumentId: string | undefined,
  editState: Pick<EditStateFor, 'draft' | 'published' | 'version'> | null | undefined,
) {
  // Read the edit state, not `targetDocumentState.siblings`: siblings come from
  // the preview store and lag the commit that materializes the document, while
  // useDraftDelayedTask needs the optimistic snapshot to appear before sync ends.
  if (!writeDocumentId || !editState) {
    return false
  }
  return [editState.draft, editState.published, editState.version].some(
    (document) => document?._id === writeDocumentId,
  )
}

export function useRequestRunInstruction(args: Omit<DraftDelayedTaskArgs<never>, 'task'>) {
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
