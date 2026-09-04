import {getDraftId, getVersionId, type TargetDocumentState} from 'sanity'

/**
 * The document AI Assist reads from and writes to for the document pane.
 *
 * - `base` – the draft/published pair, or the selected release version. The id is derived from the
 *   published id and the selected perspective, like it was before variants existed.
 * - `variant` – a variant-scoped version (`versions.<scopeId>.<groupId>`). Variant scope ids are
 *   opaque and server-generated, so the id always comes from the resolved target: the existing
 *   variant document, or the draft id advertised by its published sibling when the draft variant
 *   does not exist yet. Editing the document creates it at that id.
 * - `unavailable` – a variant is selected, but the document has no version for it in the current
 *   perspective that could be edited or created, or the target is still resolving. Falling back to
 *   the base pair here would run instructions on the wrong document, so AI Assist is disabled
 *   instead.
 */
export type AssistTarget =
  | {kind: 'base'; documentId: string}
  | {kind: 'variant'; documentId: string}
  | {kind: 'unavailable'}

export interface ResolveAssistTargetOptions {
  /** Published id of the document in the pane */
  documentId: string
  liveEdit: boolean
  selectedReleaseId: string | undefined
  /**
   * The raw variant sticky param, set whenever a variant is requested. `undefined` when no variant
   * is selected and on Studio versions without variants.
   */
  selectedVariantName: string | undefined
  /**
   * `useDocumentPane().targetDocumentState`. `undefined` on Studio versions predating variants,
   * where the base pair (or release version) is the only possible target.
   */
  targetDocumentState: TargetDocumentState | undefined
}

const UNAVAILABLE: AssistTarget = {kind: 'unavailable'}

/**
 * The id AI Assist targets when no variant is involved: the selected release version, otherwise
 * the published document for live edit types and the draft for everything else.
 */
export function getBaseAssistDocumentId(
  options: Pick<ResolveAssistTargetOptions, 'documentId' | 'liveEdit' | 'selectedReleaseId'>,
): string {
  const {documentId, liveEdit, selectedReleaseId} = options
  if (selectedReleaseId) {
    return getVersionId(documentId, selectedReleaseId)
  }
  return liveEdit ? documentId : getDraftId(documentId)
}

export function resolveAssistTarget(options: ResolveAssistTargetOptions): AssistTarget {
  const {selectedVariantName, targetDocumentState} = options

  const base: AssistTarget = {kind: 'base', documentId: getBaseAssistDocumentId(options)}

  if (!targetDocumentState) {
    return base
  }

  switch (targetDocumentState.status) {
    case 'ready':
      if (!targetDocumentState.variant) {
        return base
      }
      return targetDocumentState.targetDocument
        ? {kind: 'variant', documentId: targetDocumentState.targetDocument._id}
        : UNAVAILABLE
    case 'variant-missing':
      return targetDocumentState.creatableTarget
        ? {kind: 'variant', documentId: targetDocumentState.creatableTarget.id}
        : UNAVAILABLE
    case 'variant-definition-document-not-found':
      return UNAVAILABLE
    case 'resolving':
      // Without a variant requested, resolving can only land on the base pair (or the selected
      // release version), so there is nothing to wait for.
      return selectedVariantName ? UNAVAILABLE : base
    default: {
      const exhaustive: never = targetDocumentState
      return exhaustive
    }
  }
}
