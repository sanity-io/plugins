import type {ObjectSchemaType, TargetDocumentState} from 'sanity'

import {useRunInstruction} from '../assistLayout/RunInstructionProvider'
import {type DraftDelayedTaskArgs, useDraftDelayedTask} from './useDraftDelayedTask'

export function isDocAssistable(
  documentSchemaType: ObjectSchemaType,
  targetDocumentState: TargetDocumentState,
  selectedReleaseId: string | undefined,
) {
  // A real snapshot must already exist in the Content Lake. `variant-missing`
  // can still advertise a draft id via getAssistWriteDocumentId; that id is
  // used to materialize the document, and only then does this become true.
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
