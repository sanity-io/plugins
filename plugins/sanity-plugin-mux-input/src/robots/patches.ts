import {dequal} from 'dequal/lite'
import type {SanityClient} from 'sanity'

import type {RobotsDocumentState} from './records'

/**
 * Turns a merge result into one keyed write on `mux.videoAsset`. Only Robots fields and
 * `thumbTime` are ever touched; `data` and `filename` belong to the asset refresh and editors.
 */

const KEYED_ARRAYS = ['robotsJobs', 'robotsDirectiveRuns', 'robotsPendingCreates'] as const

interface PatchOperations {
  setIfMissing?: Record<string, unknown[]>
  insert?: {after: string; items: unknown[]}
  set?: Record<string, unknown>
  unset?: string[]
}

type KeyedItem = {_key: string}

/**
 * The keyed patches that turn `current` into `next`. One patch holds only one insert, so each
 * array with new items gets its own.
 */
export function robotsPatchOperations(
  current: RobotsDocumentState,
  next: RobotsDocumentState,
): PatchOperations[] {
  const set: Record<string, unknown> = {}
  const unset: string[] = []
  const inserts: PatchOperations[] = []

  for (const field of KEYED_ARRAYS) {
    const before: KeyedItem[] = current[field] ?? []
    const after: KeyedItem[] = next[field] ?? []
    if (before === after) continue
    const beforeByKey = new Map(before.map((item) => [item._key, item]))
    const afterKeys = new Set(after.map((item) => item._key))
    const path = (key: string) => `${field}[_key=="${key}"]`

    const added = after.filter((item) => !beforeByKey.has(item._key))
    for (const item of after) {
      const previous = beforeByKey.get(item._key)
      if (previous && !dequal(previous, item)) set[path(item._key)] = item
    }
    for (const item of before) {
      if (!afterKeys.has(item._key)) unset.push(path(item._key))
    }
    if (added.length > 0) {
      inserts.push({setIfMissing: {[field]: []}, insert: {after: `${field}[-1]`, items: added}})
    }
  }

  if (next.robotsOutputs && !dequal(current.robotsOutputs, next.robotsOutputs)) {
    set['robotsOutputs'] = next.robotsOutputs
  }
  if (next.thumbTime !== undefined && next.thumbTime !== current.thumbTime) {
    set['thumbTime'] = next.thumbTime
  }

  const main: PatchOperations = {
    ...(Object.keys(set).length > 0 && {set}),
    ...(unset.length > 0 && {unset}),
  }
  return Object.keys(main).length > 0 ? [main, ...inserts] : inserts
}

interface PatchMutation {
  patch: PatchOperations & {id: string; ifRevisionID?: string}
}

export function robotsMutations(
  documentId: string,
  revision: string,
  operations: PatchOperations[],
): PatchMutation[] {
  // One transaction: the first patch's revision check guards all of them.
  return operations.map((ops, index) => ({
    patch: {id: documentId, ...(index === 0 && {ifRevisionID: revision}), ...ops},
  }))
}

const MAX_ATTEMPTS = 3

function isRevisionConflict(error: unknown): boolean {
  return (error as {statusCode?: unknown} | null)?.statusCode === 409
}

/**
 * Fetches the latest document, applies `mutate` to it and writes the difference, retrying on a
 * revision conflict. Skips the write when `mutate` changes nothing or the document now holds
 * another asset. Resolves to whether it wrote.
 */
export async function writeRobotsFields(
  client: SanityClient,
  documentId: string,
  assetId: string,
  mutate: (current: RobotsDocumentState) => RobotsDocumentState,
): Promise<boolean> {
  for (let attempt = 1; ; attempt++) {
    const document = await client.getDocument<RobotsDocumentState>(documentId)
    if (!document || document.assetId !== assetId) return false

    const operations = robotsPatchOperations(document, mutate(document))
    if (operations.length === 0) return false

    try {
      await client.mutate(robotsMutations(documentId, document._rev, operations), {
        returnDocuments: false,
      })
      return true
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS || !isRevisionConflict(error)) throw error
    }
  }
}
