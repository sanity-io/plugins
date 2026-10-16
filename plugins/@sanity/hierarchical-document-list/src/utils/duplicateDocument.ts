import type {NodeProps} from '../types'
import {unprefixId} from './idUtils'
import {getDuplicateItemPatch} from './treePatches'

const OMITTED_FIELDS = new Set(['_id', '_rev', '_createdAt', '_updatedAt', '_system'])

/**
 * JSON document shape copied when duplicating a referenced document.
 * Index signature covers schema fields without pulling in the full document type.
 */
export interface DuplicableDocument {
  _id: string
  _type: string
  _rev?: string
  _createdAt?: string
  _updatedAt?: string
  _system?: unknown
  [key: string]: unknown
}

export interface DocumentDuplicationClient {
  getDocument: (id: string) => Promise<DuplicableDocument | null | undefined>
  create: (document: DuplicableDocument) => Promise<DuplicableDocument>
}

function buildDuplicatedDocument(
  source: DuplicableDocument,
  newPublishedId: string,
  options: {liveEdit: boolean},
): DuplicableDocument {
  const cloned = structuredClone(source)
  const duplicate: DuplicableDocument = {
    _id: options.liveEdit ? newPublishedId : `drafts.${newPublishedId}`,
    _type: cloned._type,
  }

  for (const [key, value] of Object.entries(cloned)) {
    if (OMITTED_FIELDS.has(key)) {
      continue
    }
    duplicate[key] = value
  }

  return duplicate
}

async function loadSourceDocument(
  client: DocumentDuplicationClient,
  referenceId: string,
): Promise<DuplicableDocument | undefined> {
  const publishedId = unprefixId(referenceId)
  if (!publishedId) {
    return undefined
  }

  const [draft, published] = await Promise.all([
    client.getDocument(`drafts.${publishedId}`),
    client.getDocument(publishedId),
  ])
  // Match Studio duplicate: unpublished edits win over the published snapshot.
  const source = draft ?? published ?? undefined
  if (!source?._id || !source._type) {
    return undefined
  }
  return source
}

/**
 * Creates a new document from the referenced node, then returns the tree patch
 * that inserts a node pointing at that new document.
 * Returns undefined when the source document cannot be loaded. Create failures throw.
 */
export async function duplicateHierarchyItem(args: {
  nodeProps: NodeProps
  client: DocumentDuplicationClient
  liveEdit: boolean
  newPublishedId: string
  key: string
}): Promise<unknown[] | undefined> {
  const referenceId = args.nodeProps.node.value?.reference?._ref
  if (!referenceId) {
    return undefined
  }

  const source = await loadSourceDocument(args.client, referenceId)
  if (!source) {
    return undefined
  }

  const document = buildDuplicatedDocument(source, args.newPublishedId, {
    liveEdit: args.liveEdit,
  })
  await args.client.create(document)

  return getDuplicateItemPatch(args.nodeProps, {
    referenceId: args.newPublishedId,
    key: args.key,
  })
}
