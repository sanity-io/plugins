import {isAssetId, isSanityFileAsset} from '@sanity/asset-utils'
import type {SanityAssetDocument, SanityClient} from '@sanity/client'
import {ArrowRightIcon} from '@sanity/icons/ArrowRight'
import {LaunchIcon} from '@sanity/icons/Launch'
import {SearchIcon} from '@sanity/icons/Search'
import {extractWithPath} from '@sanity/mutator'
import {
  Card,
  Container,
  Text,
  Box,
  Button,
  Label,
  Stack,
  Select,
  Flex,
  Checkbox,
  type CardTone,
  useTheme,
  Spinner,
} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {dset} from 'dset'
import {type ChangeEvent, Fragment, useEffect, useEffectEvent, useMemo, useState} from 'react'
import {
  useClient,
  Preview,
  useSchema,
  useWorkspaces,
  type WorkspaceSummary,
  type SanityDocument,
} from 'sanity'

import {stickyStyles, createInitialMessage} from '../helpers'
import {getDocumentsInArray} from '../helpers/getDocumentsInArray'
import type {PluginConfig} from '../types'
import Feedback from './Feedback'
import SelectButtons from './SelectButtons'
import StatusBadge, {type MessageTypes} from './StatusBadge'

export type DuplicatorProps = {
  docs: SanityDocument[]
  token: string
  pluginConfig: Required<PluginConfig>
  onDuplicated?: () => Promise<void>
}

export type PayloadItem = {
  doc: SanityDocument
  include: boolean
  status?: keyof MessageTypes
  hasDraft?: boolean
}

type WorkspaceOption = WorkspaceSummary & {
  disabled: boolean
}

type Message = {
  text: string
  tone: CardTone
}

function isAssetDocument(doc: SanityDocument): doc is SanityDocument & SanityAssetDocument {
  return isAssetId(doc._id)
}

// Run an async function over every item with a maximum concurrency
async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items]

  async function work(): Promise<void> {
    const item = queue.shift()

    if (item === undefined) {
      return undefined
    }

    await fn(item)

    return work()
  }

  const workers = Array.from({length: Math.min(limit, queue.length)}, () => work())

  await Promise.all(workers)
}

type SetMessage = (msg: Message) => void

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

// Pull a human-readable description out of a Sanity mutation error.
// Prefer the richest text available: item-level descriptions (which carry the
// "references non-existent document" phrasing) over a possibly-generic top-level
// `details.description` like "Mutation(s) failed with N error(s)".
function getErrorDescription(err: unknown): string {
  if (!isRecord(err)) {
    return ''
  }

  const details = err['details']
  const itemDescriptions: string[] = []

  if (isRecord(details) && isUnknownArray(details['items'])) {
    for (const item of details['items']) {
      if (isRecord(item) && isRecord(item['error'])) {
        const itemDescription = item['error']['description']

        if (typeof itemDescription === 'string' && itemDescription) {
          itemDescriptions.push(itemDescription)
        }
      }
    }
  }

  if (itemDescriptions.length) {
    return itemDescriptions.join('\n')
  }

  const message = err['message']

  if (typeof message === 'string' && message) {
    return message
  }

  if (isRecord(details)) {
    const description = details['description']

    if (typeof description === 'string') {
      return description
    }
  }

  return ''
}

function isReferenceMutationError(err: unknown): boolean {
  if (!isRecord(err)) {
    return false
  }

  const details = err['details']

  // Most reliable: structured mutation item type from the Content Lake API
  if (isRecord(details) && isUnknownArray(details['items'])) {
    for (const item of details['items']) {
      if (isRecord(item) && isRecord(item['error'])) {
        if (item['error']['type'] === 'documentReferenceDoesNotExistError') {
          return true
        }

        const itemDescription = item['error']['description']

        if (
          typeof itemDescription === 'string' &&
          (itemDescription.toLowerCase().includes('references non-existent document') ||
            itemDescription.toLowerCase().includes('reference non-existent'))
        ) {
          return true
        }
      }
    }
  }

  const description = getErrorDescription(err).toLowerCase()

  return (
    description.includes('references non-existent document') ||
    description.includes('reference non-existent')
  )
}

// Collect the _id's of referenced documents that are missing at the destination,
// reading both the structured error payload and the human-readable description
function getMissingReferenceIds(err: unknown, description: string): string[] {
  const missingIds: string[] = []

  const details = isRecord(err) ? err['details'] : undefined
  const rawItems = isRecord(details) ? details['items'] : undefined
  const items = isUnknownArray(rawItems) ? rawItems : []

  for (const item of items) {
    if (isRecord(item)) {
      const error = item['error']

      if (isRecord(error)) {
        // Sanity returns `referenceID`; keep the other spellings as fallbacks
        const refId = error['referenceID'] ?? error['referencedId'] ?? error['referenceId']

        if (typeof refId === 'string' && !missingIds.includes(refId)) {
          missingIds.push(refId)
        }
      }
    }
  }

  const refRegex = /references non-existent document [`'"]?([^`'"\s)]+)[`'"]?/gi
  let match = refRegex.exec(description)

  while (match !== null) {
    const id = match[1]

    if (id && !missingIds.includes(id)) {
      missingIds.push(id)
    }

    match = refRegex.exec(description)
  }

  return missingIds
}

// Commit documents individually so a single failing document doesn't block the rest.
// Runs sequentially (concurrency 1) so referenced documents can land before the
// documents that point at them.
async function commitOneByOne(
  docs: SanityDocument[],
  client: SanityClient,
  setMessage: SetMessage,
  onSuccess: () => void,
): Promise<void> {
  let successCount = 0
  let failCount = 0

  await mapWithConcurrency(docs, 1, async (doc) => {
    try {
      const tx = client.transaction()
      tx.createOrReplace(doc)
      await tx.commit()
      successCount += 1
    } catch (commitErr) {
      failCount += 1
      console.error(`Failed to duplicate document "${doc._id}"`, commitErr)
    }
  })

  if (failCount === 0) {
    setMessage({tone: 'positive', text: 'Duplication complete!'})
    onSuccess()

    return
  }

  setMessage({
    tone: 'critical',
    text: `Duplication finished with ${failCount} error(s). ${successCount} document(s) duplicated successfully.`,
  })

  if (successCount > 0) {
    onSuccess()
  }
}

type ReferenceErrorOptions = {
  err: unknown
  transactionDocs: SanityDocument[]
  originClient: SanityClient
  destinationClient: SanityClient
  pluginConfig: Required<PluginConfig>
  token: string
  setMessage: SetMessage
  onSuccess: () => void
  /** Caps recursive recovery so a pathological reference loop can't hang forever */
  depth?: number
  /** Document ids the user explicitly deselected — never auto-commit these during recovery */
  excludedIds?: Set<string>
}

// Upload a recovered asset to the destination, rewriting url/path for the new dataset
async function uploadAssetForRecovery(
  doc: SanityDocument & SanityAssetDocument,
  destinationClient: SanityClient,
  token: string,
): Promise<{docs: SanityDocument[]; svgMap?: {old: string; new: string}}> {
  const typeIsFile = isSanityFileAsset(doc)
  const downloadUrl = typeIsFile ? doc.url : `${doc.url}?dlRaw=true`
  const downloadConfig = typeIsFile ? {} : {headers: {Authorization: `Bearer ${token}`}}

  const res = await fetch(downloadUrl, downloadConfig)

  if (!res.ok) {
    throw new Error(
      `Failed to download asset "${doc._id}" from origin (${res.status} ${res.statusText})`,
    )
  }

  const assetData = await res.blob()
  const assetDoc = await destinationClient.assets.upload(typeIsFile ? `file` : `image`, assetData, {
    filename: doc.originalFilename,
  })

  return {
    docs: [assetDoc, {...doc, url: assetDoc.url, path: assetDoc.path}],
    svgMap: doc.extension === 'svg' ? {old: doc._id, new: assetDoc._id} : undefined,
  }
}

// Rewrite _ref values that point at remapped SVG asset ids.
// Clones each doc so caller-held / payload objects are not mutated.
function remapSvgRefs(
  docs: SanityDocument[],
  svgMaps: {old: string; new: string}[],
): SanityDocument[] {
  if (!svgMaps.length) {
    return docs
  }

  return docs.map((original) => {
    const references = extractWithPath(`.._ref`, original)

    if (!references.length) {
      return original
    }

    const doc = structuredClone(original)

    references.forEach((ref) => {
      const newRefValue = svgMaps.find((asset) => asset.old === ref.value)?.new

      if (newRefValue) {
        dset(doc, ref.path.join('.'), newRefValue)
      }
    })

    return doc
  })
}

// Order docs so referenced documents come before the documents that point at
// them. Used by the sequential one-by-one fallback where commit order matters.
function orderDocsDependenciesFirst(docs: SanityDocument[]): SanityDocument[] {
  const byId = new Map(docs.map((doc) => [doc._id, doc]))
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const ordered: SanityDocument[] = []

  function visit(id: string): void {
    if (visited.has(id) || visiting.has(id)) {
      return
    }

    const doc = byId.get(id)

    if (!doc) {
      return
    }

    visiting.add(id)

    for (const ref of extractWithPath(`.._ref`, doc)) {
      if (typeof ref.value === 'string') {
        visit(ref.value)
      }
    }

    visiting.delete(id)
    visited.add(id)
    ordered.push(doc)
  }

  for (const doc of docs) {
    visit(doc._id)
  }

  return ordered
}

// When a transaction fails because of missing references, fetch the referenced
// documents (and their transitive refs) from the origin — respecting
// pluginConfig.filter — upload any assets, then retry. Falls back to one-by-one
// commits if the retry still fails.
async function handleReferenceError(options: ReferenceErrorOptions): Promise<void> {
  const {
    err,
    transactionDocs,
    originClient,
    destinationClient,
    pluginConfig,
    token,
    setMessage,
    onSuccess,
    depth = 0,
    excludedIds = new Set(),
  } = options
  const description = getErrorDescription(err)
  const missingIds = getMissingReferenceIds(err, description)

  // If the only missing refs are ones the user deselected, surface that instead of
  // silently re-committing them
  const autoFetchIds = missingIds.filter((id) => !excludedIds.has(id))
  const blockedIds = missingIds.filter((id) => excludedIds.has(id))

  if (blockedIds.length && !autoFetchIds.length) {
    setMessage({
      tone: 'critical',
      text: `Duplication failed because deselected document(s) are still referenced: ${blockedIds.join(', ')}. Re-select them or remove the references.`,
    })

    return
  }

  if (!missingIds.length || depth >= 5) {
    // Couldn't parse the missing _id's (or we hit the recursion cap) — retry each document on its own
    setMessage({tone: 'default', text: 'Retrying documents one by one...'})
    await commitOneByOne(
      orderDocsDependenciesFirst(transactionDocs),
      destinationClient,
      setMessage,
      onSuccess,
    )

    return
  }

  setMessage({
    tone: 'default',
    text: `Fetching ${autoFetchIds.length} missing referenced document(s) and retrying...`,
  })

  let missingDocs: SanityDocument[] = []

  try {
    // Recursively gather referenced docs (and apply pluginConfig.filter), same
    // as the "Gather References" path — so nested refs aren't left behind
    missingDocs = await getDocumentsInArray({
      fetchIds: autoFetchIds,
      client: originClient,
      pluginConfig,
    })
  } catch (fetchErr) {
    setMessage({
      tone: 'critical',
      text:
        (fetchErr instanceof Error ? fetchErr.message : '') || description || 'Duplication Failed',
    })

    return
  }

  if (!missingDocs.length) {
    setMessage({tone: 'default', text: 'Retrying documents one by one...'})
    await commitOneByOne(
      orderDocsDependenciesFirst(transactionDocs),
      destinationClient,
      setMessage,
      onSuccess,
    )

    return
  }

  // Don't re-commit documents already in the failed transaction, or ones the
  // user explicitly deselected (including transitive refs of those)
  const existingIds = new Set(transactionDocs.map((doc) => doc._id))
  // Reverse so transitive refs (appended last by getDocumentsInArray) are processed first
  const newMissingDocs = [...missingDocs]
    .reverse()
    .filter((doc) => !existingIds.has(doc._id) && !excludedIds.has(doc._id))

  // Nothing new to add — retrying the same transaction would just loop until the depth cap
  if (!newMissingDocs.length) {
    setMessage({tone: 'default', text: 'Retrying documents one by one...'})
    await commitOneByOne(
      orderDocsDependenciesFirst(transactionDocs),
      destinationClient,
      setMessage,
      onSuccess,
    )

    return
  }

  setMessage({tone: 'default', text: `Duplicating ${newMissingDocs.length} missing document(s)...`})

  const svgMaps: {old: string; new: string}[] = []

  // Process with the same concurrency limit as the main duplication path, while
  // writing into index slots so dependency-first order is preserved
  const recoveredChunks: SanityDocument[][] = Array.from({length: newMissingDocs.length}, () => [])

  try {
    await mapWithConcurrency(
      newMissingDocs.map((doc, index) => ({doc, index})),
      3,
      async ({doc, index}) => {
        if (!isAssetDocument(doc)) {
          recoveredChunks[index] = [doc]

          return
        }

        const {docs, svgMap} = await uploadAssetForRecovery(doc, destinationClient, token)
        recoveredChunks[index] = docs

        if (svgMap) {
          svgMaps.push(svgMap)
        }
      },
    )
  } catch (uploadErr) {
    setMessage({
      tone: 'critical',
      text:
        (uploadErr instanceof Error ? uploadErr.message : '') ||
        description ||
        'Duplication Failed',
    })

    return
  }

  const recoveredDocs = recoveredChunks.flat()

  // Remap SVG _ref's in both recovered and original transaction docs
  const remappedRecoveredDocs = remapSvgRefs(recoveredDocs, svgMaps)
  const remappedTransactionDocs = remapSvgRefs(transactionDocs, svgMaps)

  // Put recovered (referenced) docs first so sequential commits land
  // dependencies before the documents that point at them
  const allDocs = orderDocsDependenciesFirst([...remappedRecoveredDocs, ...remappedTransactionDocs])

  const retryTransaction = destinationClient.transaction()
  allDocs.forEach((doc) => retryTransaction.createOrReplace(doc))

  try {
    await retryTransaction.commit()
    setMessage({tone: 'positive', text: 'Duplication complete!'})
    onSuccess()
  } catch (retryErr) {
    if (isReferenceMutationError(retryErr)) {
      // Another layer of missing refs — recurse with the expanded set
      await handleReferenceError({
        ...options,
        err: retryErr,
        transactionDocs: allDocs,
        depth: depth + 1,
      })

      return
    }

    setMessage({tone: 'default', text: 'Retrying documents one by one...'})
    await commitOneByOne(allDocs, destinationClient, setMessage, onSuccess)
  }
}

export default function Duplicator(props: DuplicatorProps) {
  const {docs, token, pluginConfig, onDuplicated} = props
  const theme = useTheme()
  const isDarkMode = getTheme_v2({sanity: theme.sanity}).color._dark

  // Prepare origin (this Studio) client
  const originClient = useClient({apiVersion: pluginConfig.apiVersion})

  const schema = useSchema()

  // Create list of dataset options
  // and set initial value of dropdown
  const workspaces = useWorkspaces()
  const workspacesOptions: WorkspaceOption[] = workspaces.map((workspace) => ({
    ...workspace,
    disabled:
      workspace.dataset === originClient.config().dataset &&
      workspace.projectId === originClient.config().projectId,
  }))

  const [destination, setDestination] = useState<WorkspaceOption | null>(
    workspaces.length ? (workspacesOptions.find((space) => !space.disabled) ?? null) : null,
  )
  const [message, setMessage] = useState<Message | null>(null)
  const [payload, setPayload] = useState<PayloadItem[]>([])

  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isGathering, setIsGathering] = useState(false)
  const [progress, setProgress] = useState<[number, number]>([0, 0])

  // References found in the initial docs
  const initialRefsCount = useMemo(
    () => docs.reduce((acc, doc) => acc + extractWithPath(`.._ref`, doc).length, 0),
    [docs],
  )
  const hasReferences = initialRefsCount > 0
  const initialMessage: Message | null = hasReferences
    ? {tone: `caution`, text: createInitialMessage(docs.length, initialRefsCount)}
    : null
  const displayMessage = message ?? initialMessage

  // Check if payload documents exist at destination
  async function updatePayloadStatuses(payloadActual: PayloadItem[], dest: WorkspaceOption | null) {
    if (!payloadActual.length || !dest?.name) {
      return
    }

    const payloadIds = payloadActual.map(({doc}) => doc._id)
    const destinationClient = originClient.withConfig({
      dataset: dest.dataset,
      projectId: dest.projectId,
    })
    const destinationData = await destinationClient.fetch<SanityDocument[]>(
      `*[_id in $payloadIds]{ _id, _updatedAt }`,
      {payloadIds},
    )

    setPayload(
      payloadActual.map((item) => {
        const existingDoc = destinationData.find((doc) => doc._id === item.doc._id)
        let status: keyof MessageTypes = 'CREATE'

        if (existingDoc?._updatedAt && item.doc._updatedAt) {
          if (existingDoc._updatedAt === item.doc._updatedAt) {
            // Exact same document exists at destination
            // We don't compare by _rev because that is updated in a transaction
            status = `EXISTS`
          } else {
            status =
              new Date(existingDoc._updatedAt) > new Date(item.doc._updatedAt)
                ? // Document at destination is newer
                  `OVERWRITE`
                : // Document at destination is older
                  `UPDATE`
          }
        }

        return {...item, status}
      }),
    )
  }

  // Build the initial payload and check statuses at the current destination
  const initializePayload = useEffectEvent((nextDocs: SanityDocument[]) => {
    const initialPayload: PayloadItem[] = nextDocs.map((doc) => ({include: true, doc}))
    updatePayloadStatuses(initialPayload, destination).catch(console.error)
  })

  // Sync the payload with the docs prop and the destination dataset.
  // setPayload only runs after fetching document statuses from the
  // destination resolves, not synchronously within the effect.
  // See: https://github.com/facebook/react/issues/34743
  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler
    initializePayload(docs)
  }, [docs])

  function handleCheckbox(_id: string) {
    setPayload((current) =>
      current.map((item) => (item.doc._id === _id ? {...item, include: !item.include} : item)),
    )
  }

  // Find and recursively follow references beginning with this document
  async function handleReferences() {
    setIsGathering(true)

    try {
      const docIds = docs.map((doc) => doc._id)

      const payloadDocs = await getDocumentsInArray({
        fetchIds: docIds,
        client: originClient,
        pluginConfig,
      })
      const draftDocs = await getDocumentsInArray({
        fetchIds: docIds.map((id) => `drafts.${id}`),
        client: originClient,
        projection: `{_id}`,
        pluginConfig,
      })
      const draftDocsIds = new Set(draftDocs.map(({_id}) => _id))

      // Shape it up
      const payloadShaped: PayloadItem[] = payloadDocs.map((doc) => ({
        doc,
        // Include this in the transaction?
        include: true,
        // Does it exist at the destination?
        status: undefined,
        // Does it have any drafts?
        hasDraft: draftDocsIds.has(`drafts.${doc._id}`),
      }))

      setPayload(payloadShaped)
      updatePayloadStatuses(payloadShaped, destination).catch(console.error)
    } catch (err) {
      console.error(err)
    }

    setIsGathering(false)
  }

  // Duplicate payload to destination dataset
  async function handleDuplicate() {
    if (!destination) {
      return
    }

    setIsDuplicating(true)

    const assetsCount = payload.filter(({doc, include}) => include && isAssetId(doc._id)).length
    let currentProgress = 0
    setProgress([currentProgress, assetsCount])

    setMessage({text: 'Duplicating...', tone: `transparent`})

    const destinationClient = originClient.withConfig({
      apiVersion: pluginConfig.apiVersion,
      dataset: destination.dataset,
      projectId: destination.projectId,
    })

    const transactionDocs: SanityDocument[] = []
    const svgMaps: {old: string; new: string}[] = []

    // Upload assets and then add to transaction
    async function processDoc(doc: SanityDocument): Promise<void> {
      if (!isAssetDocument(doc)) {
        transactionDocs.push(doc)

        return
      }

      // Download and upload asset
      // Get the *original* image with this dlRaw param to create the same deterministic _id
      const typeIsFile = isSanityFileAsset(doc)
      const downloadUrl = typeIsFile ? doc.url : `${doc.url}?dlRaw=true`
      const downloadConfig = typeIsFile ? {} : {headers: {Authorization: `Bearer ${token}`}}

      const res = await fetch(downloadUrl, downloadConfig)
      const assetData = await res.blob()

      const options = {filename: doc.originalFilename}
      const assetDoc = await destinationClient.assets.upload(
        typeIsFile ? `file` : `image`,
        assetData,
        options,
      )

      // SVG _id's need remapping before transaction
      if (doc.extension === 'svg') {
        svgMaps.push({old: doc._id, new: assetDoc._id})
      }

      // This adds the newly created asset document to the transaction but ...
      // it doesn't have some of the original asset's metadata like `altText` or `title`
      transactionDocs.push(assetDoc)

      // So the original `doc` is added to the transaction as well below
      // However, we don't want to retain the original `url` or `path` values
      // because these strings contain the origin's dataset name
      transactionDocs.push({...doc, url: assetDoc.url, path: assetDoc.path})

      currentProgress += 1
      setMessage({
        text: `Duplicating ${currentProgress}/${assetsCount} Assets`,
        tone: 'default',
      })
      setProgress([currentProgress, assetsCount])
    }

    try {
      const payloadIncludedDocs = payload.filter((item) => item.include).map((item) => item.doc)

      // Promises are limited to three at once
      await mapWithConcurrency(payloadIncludedDocs, 3, processDoc)
    } catch (err) {
      console.error(err)
      setIsDuplicating(false)
      setProgress([0, 0])
      setMessage({tone: 'critical', text: `Duplication Failed`})

      return
    }

    // Remap SVG references to new _id's
    const transactionDocsMapped = transactionDocs.map((doc) => {
      const expr = `.._ref`
      const references = extractWithPath(expr, doc)

      if (!references.length) {
        return doc
      }

      // For every found _ref, search for an SVG asset _id and update
      references.forEach((ref) => {
        const newRefValue = svgMaps.find((asset) => asset.old === ref.value)?.new

        if (newRefValue) {
          const refPath = ref.path.join('.')

          dset(doc, refPath, newRefValue)
        }
      })

      return doc
    })

    // Create transaction
    const transaction = destinationClient.transaction()

    transactionDocsMapped.forEach((doc) => {
      transaction.createOrReplace(doc)
    })

    const onCommitSuccess = () => {
      updatePayloadStatuses(payload, destination).catch(console.error)
    }

    try {
      await transaction.commit()
      setMessage({tone: 'positive', text: 'Duplication complete!'})

      onCommitSuccess()
    } catch (err) {
      if (isReferenceMutationError(err)) {
        await handleReferenceError({
          err,
          transactionDocs: transactionDocsMapped,
          originClient,
          destinationClient,
          pluginConfig,
          token,
          setMessage,
          onSuccess: onCommitSuccess,
          excludedIds: new Set(payload.filter((item) => !item.include).map((item) => item.doc._id)),
        })
      } else {
        const description = getErrorDescription(err)
        setMessage({
          tone: 'critical',
          text: description || `Duplication Failed`,
        })
      }
    }

    setIsDuplicating(false)
    setProgress([0, 0])
    if (onDuplicated) {
      try {
        await onDuplicated()
      } catch (error) {
        const text = error instanceof Error ? error.message : String(error)
        setMessage({tone: 'critical', text: `Error in onDuplicated hook: ${text}`})
      }
    }
  }

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    if (!workspacesOptions.length) {
      return
    }

    const targeted = workspacesOptions.find((space) => space.name === e.currentTarget.value)

    if (targeted) {
      setDestination(targeted)
      updatePayloadStatuses(payload, targeted).catch(console.error)
    }
  }

  const payloadCount = payload.length
  const firstSvgIndex = payload.findIndex(({doc}) => doc['extension'] === 'svg')
  const selectedDocumentsCount = payload.filter(
    (item) => item.include && !isAssetId(item.doc._id),
  ).length
  const selectedAssetsCount = payload.filter(
    (item) => item.include && isAssetId(item.doc._id),
  ).length
  const selectedTotal = selectedDocumentsCount + selectedAssetsCount
  const destinationTitle = destination?.title ?? destination?.name
  const hasMultipleProjectIds =
    new Set(workspacesOptions.map((space) => space?.projectId).filter(Boolean)).size > 1

  const headingText = [selectedTotal, `/`, payloadCount, `Documents and Assets selected`].join(` `)

  const buttonTextParts = [`Duplicate`]

  if (selectedDocumentsCount > 1) {
    buttonTextParts.push(
      String(selectedDocumentsCount),
      selectedDocumentsCount === 1 ? `Document` : `Documents`,
    )
  }

  if (selectedAssetsCount > 1) {
    buttonTextParts.push(
      `and`,
      String(selectedAssetsCount),
      selectedAssetsCount === 1 ? `Asset` : `Assets`,
    )
  }

  if (originClient.config().projectId !== destination?.projectId) {
    buttonTextParts.push(`between Projects`)
  }

  buttonTextParts.push(`to`, String(destinationTitle))

  const buttonText = buttonTextParts.join(` `)

  if (workspacesOptions.length < 2) {
    return (
      <Feedback tone="critical">
        <code>sanity.config.ts</code> must contain at least two Workspaces to use this plugin.
      </Feedback>
    )
  }

  return (
    <Container width={1}>
      <Card border>
        <Stack>
          <Card padding={4} style={stickyStyles(isDarkMode)}>
            <Stack gap={4}>
              <Flex gap={3}>
                <Stack style={{flex: 1}} gap={3}>
                  <Label>Duplicate from</Label>
                  <Select readOnly value={workspacesOptions.find((space) => space.disabled)?.name}>
                    {workspacesOptions
                      .filter((space) => space.disabled)
                      .map((space) => (
                        <option key={space.name} value={space.name} disabled={space.disabled}>
                          {space.title ?? space.name}
                          {hasMultipleProjectIds ? ` (${space.projectId})` : ``}
                        </option>
                      ))}
                  </Select>
                </Stack>
                <Box padding={4} paddingTop={5} paddingBottom={0}>
                  <Text size={3}>
                    <ArrowRightIcon />
                  </Text>
                </Box>
                <Stack style={{flex: 1}} gap={3}>
                  <Label>To Destination</Label>
                  <Select onChange={handleChange}>
                    {workspacesOptions.map((space) => (
                      <option key={space.name} value={space.name} disabled={space.disabled}>
                        {space.title ?? space.name}
                        {hasMultipleProjectIds ? ` (${space.projectId})` : ``}
                        {space.disabled ? ` (Current)` : ``}
                      </option>
                    ))}
                  </Select>
                </Stack>
              </Flex>

              {isDuplicating && (
                <Card border radius={2}>
                  <Card
                    style={{
                      width: '100%',
                      transform: `scaleX(${progress[0] / progress[1]})`,
                      transformOrigin: 'left',
                      transition: 'transform .2s ease',
                      boxSizing: 'border-box',
                    }}
                    padding={1}
                    tone="positive"
                  />
                </Card>
              )}
              {payload.length > 0 && (
                <>
                  <Label>{headingText}</Label>
                  <SelectButtons payload={payload} setPayload={setPayload} />
                </>
              )}
            </Stack>
          </Card>
          <Card borderTop padding={4}>
            <Stack gap={3}>
              {displayMessage && (
                <Card padding={3} radius={2} shadow={1} tone={displayMessage.tone}>
                  <Text size={1}>{displayMessage.text}</Text>
                </Card>
              )}
              {payload.length > 0 ? (
                <Stack>
                  {payload.map(({doc, include, status, hasDraft}, index) => {
                    const schemaType = schema.get(doc._type)

                    return (
                      <Fragment key={doc._id}>
                        <Flex align="center">
                          <Checkbox checked={include} onChange={() => handleCheckbox(doc._id)} />
                          <Box flex={1} paddingX={3}>
                            {schemaType ? (
                              <Preview value={doc} schemaType={schemaType} />
                            ) : (
                              <Card tone="caution">Invalid schema type</Card>
                            )}
                          </Box>
                          <Flex align="center" gap={2}>
                            {hasDraft ? <StatusBadge status="UNPUBLISHED" isAsset={false} /> : null}
                            <StatusBadge status={status} isAsset={isAssetId(doc._id)} />
                          </Flex>
                        </Flex>
                        {doc['extension'] === 'svg' && index === firstSvgIndex && (
                          <Card padding={3} radius={2} shadow={1} tone="caution">
                            <Text size={1}>
                              Due to how SVGs are sanitized after first uploaded, duplicated SVG
                              assets may have new <code>_id</code>'s at the destination. The newly
                              generated <code>_id</code> will be the same in each duplication, but
                              it will never be the same <code>_id</code> as the first time this
                              Asset was uploaded. References to the asset will be updated to use the
                              new <code>_id</code>.
                            </Text>
                          </Card>
                        )}
                      </Fragment>
                    )
                  })}
                </Stack>
              ) : (
                <Flex padding={4} align="center" justify="center">
                  <Spinner />
                </Flex>
              )}
              <Stack gap={2}>
                {hasReferences && (
                  <Button
                    fontSize={2}
                    padding={4}
                    tone="positive"
                    mode="ghost"
                    icon={SearchIcon}
                    onClick={() => void handleReferences()}
                    text="Gather References"
                    disabled={isDuplicating || !selectedTotal || isGathering}
                  />
                )}
                <Button
                  fontSize={2}
                  padding={4}
                  tone="positive"
                  icon={LaunchIcon}
                  onClick={() => void handleDuplicate()}
                  text={buttonText}
                  disabled={isDuplicating || !selectedTotal || isGathering}
                />
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </Card>
    </Container>
  )
}
