import type {ObjectSchemaType, TargetDocumentState} from 'sanity'

import {useRunInstruction} from '../assistLayout/RunInstructionProvider'
import {type DraftDelayedTaskArgs, useDraftDelayedTask} from './useDraftDelayedTask'

export function isDocAssistable(
  documentSchemaType: ObjectSchemaType,
  targetDocumentState: TargetDocumentState,
  selectedReleaseId: string | undefined,
) {
  // Wait until target is resolved and ready, any other state is considered not assistable
  if (targetDocumentState.status !== 'ready') {
    return false
  }
  // If a release is selected, the target is always the version.
  if (selectedReleaseId) {
    return Boolean(targetDocumentState.siblings.version)
  }
  // If the document is live-edit, the target is always the published document.
  if (documentSchemaType.liveEdit) {
    return Boolean(targetDocumentState.siblings.published)
  }
  // Else the target is the draft document.
  return Boolean(targetDocumentState.siblings.draft)
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
