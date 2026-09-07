import {
  getDraftId,
  getVersionFromId,
  getVersionId,
  isVersionId,
  type TargetDocumentState,
  type VersionInfoDocumentStub,
} from 'sanity'

/**
 * The document AI Assist reads from and writes to for the document pane.
 *
 * - `base` – the draft/published pair, or the selected release version. The id is derived from the
 *   published id and the selected perspective, like it was before variants existed.
 * - `variant` – a variant-scoped version (`versions.<scopeId>.<groupId>`). Variant scope ids are
 *   opaque and server-generated, so the id always comes from the resolved target: the draft sibling
 *   in the current lane, the published sibling for live-edit, or the draft id advertised by the
 *   published sibling when the draft variant does not exist yet. Editing the document creates it
 *   at that id.
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

export interface AssistWriteTargetExistsOptions {
  liveEdit: boolean
  selectedReleaseId: string | undefined
  targetDocumentState: TargetDocumentState | undefined
  /** editState snapshots; used only when `targetDocumentState` has no siblings (Studio 5). */
  draft?: {_id?: string} | null
  published?: {_id?: string} | null
  version?: {_id?: string} | null
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

/**
 * Published/draft/release stubs for the current lane, or `undefined` while the target is still
 * resolving, the variant definition was not found, or Studio predates `targetDocumentState`.
 *
 * Duplicates Studio's `getTargetSiblings` so Assist does not import that helper by name (it is
 * missing on `sanity` ^5).
 */
function getAssistTargetSiblings(state: TargetDocumentState | undefined):
  | {
      published?: VersionInfoDocumentStub
      draft?: VersionInfoDocumentStub
      version?: VersionInfoDocumentStub
    }
  | undefined {
  if (state?.status === 'ready' || state?.status === 'variant-missing') {
    return state.siblings
  }
  return undefined
}

/**
 * The snapshot Assist must write: the release version when a release is selected, otherwise the
 * published document for live-edit types and the draft for everything else. Siblings are already
 * scoped to the current variant lane when one is selected.
 */
function getLaneWriteSibling(
  siblings: {
    published?: VersionInfoDocumentStub
    draft?: VersionInfoDocumentStub
    version?: VersionInfoDocumentStub
  },
  liveEdit: boolean,
  selectedReleaseId: string | undefined,
): VersionInfoDocumentStub | undefined {
  if (selectedReleaseId) {
    return siblings.version
  }
  if (liveEdit) {
    return siblings.published
  }
  return siblings.draft
}

function resolveVariantWriteDocumentId(
  state: Extract<TargetDocumentState, {status: 'ready'}>,
  liveEdit: boolean,
): string | undefined {
  const {siblings, targetDocument} = state
  if (siblings.draft) {
    return siblings.draft._id
  }
  if (liveEdit && siblings.published) {
    return siblings.published._id
  }
  return targetDocument?._id
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
      {
        const documentId = resolveVariantWriteDocumentId(targetDocumentState, options.liveEdit)
        return documentId ? {kind: 'variant', documentId} : UNAVAILABLE
      }
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

/**
 * Whether the write target already exists in the Content Lake.
 *
 * Uses lane siblings when `targetDocumentState` is resolved (`ready` / `variant-missing`): a present
 * sibling is the inventory, matching how Studio creates a draft variant from the published sibling.
 * Without siblings (Studio versions predating variants, or still resolving the base pair), falls
 * back to `editState` snapshots.
 */
export function assistWriteTargetExists(
  target: AssistTarget,
  options: AssistWriteTargetExistsOptions,
): boolean {
  if (target.kind === 'unavailable') {
    return false
  }

  const siblings = getAssistTargetSiblings(options.targetDocumentState)
  if (siblings) {
    return !!getLaneWriteSibling(siblings, options.liveEdit, options.selectedReleaseId)
  }

  if (options.selectedReleaseId) {
    return !!options.version?._id
  }
  return !!(options.liveEdit ? options.published : options.draft)
}

/**
 * True when the current lane has no published, draft, or version sibling (or, without siblings,
 * no matching `editState` snapshot).
 */
export function isAssistDocumentNew(options: AssistWriteTargetExistsOptions): boolean {
  const siblings = getAssistTargetSiblings(options.targetDocumentState)
  if (siblings) {
    return !siblings.published && !siblings.draft && !siblings.version
  }
  if (options.selectedReleaseId) {
    return !options.version?._id
  }
  return !options.draft?._id && !options.published?._id
}

/**
 * Scope id to pass to `useSyncState` for the write target. Reads `scopeId` / `creatableTarget`
 * from the pane state so a creatable draft variant is watched at the advertised id, not the base
 * pair. Falls back to the version segment of `writeDocumentId` on older Studios.
 *
 * Duplicates Studio's `getTargetScopeId` so Assist does not import that helper by name.
 */
export function getAssistWriteScopeId(
  targetDocumentState: TargetDocumentState | undefined,
  writeDocumentId: string,
): string | undefined {
  if (targetDocumentState?.status === 'ready') {
    return targetDocumentState.scopeId
  }
  if (targetDocumentState?.status === 'variant-missing') {
    return targetDocumentState.creatableTarget?.scopeId
  }
  return isVersionId(writeDocumentId) ? getVersionFromId(writeDocumentId) : undefined
}
