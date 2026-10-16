import {isVersionId, type ObjectSchemaType, type TargetDocumentState} from 'sanity'

import {useRunInstruction} from '../assistLayout/RunInstructionProvider'
import {type DraftDelayedTaskArgs, useDraftDelayedTask} from './useDraftDelayedTask'

export function isDocAssistable(
  documentSchemaType: ObjectSchemaType,
  targetDocumentState: TargetDocumentState,
  selectedReleaseId: string | undefined,
  documentId?: string,
) {
  // A real snapshot must already exist in the Content Lake. `variant-missing`
  // can still advertise a draft id via getAssistWriteDocumentId; that id is
  // used to materialize the document, and only then does this become true.
  if (targetDocumentState.status !== 'ready') {
    return false
  }
  // If a release is selected, or the pane is already on a version document
  // with a version sibling, the target is the version. Variant document ids
  // are also version ids; those have no release sibling and fall through.
  if (
    selectedReleaseId ||
    (documentId && isVersionId(documentId) && targetDocumentState.siblings.version)
  ) {
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
