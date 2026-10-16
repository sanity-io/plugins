import type {EditStateFor} from 'sanity'

import {useRunInstruction} from '../assistLayout/RunInstructionProvider'
import {type DraftDelayedTaskArgs, useDraftDelayedTask} from './useDraftDelayedTask'

export function isDocAssistable(
  writeDocumentId: string | undefined,
  editState: Pick<EditStateFor, 'draft' | 'published' | 'version'> | null | undefined,
) {
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
