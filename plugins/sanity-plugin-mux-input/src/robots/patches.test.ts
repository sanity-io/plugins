import type {SanityClient} from 'sanity'
import {describe, expect, test, vi} from 'vitest'

import {robotsMutations, robotsPatchOperations, writeRobotsFields} from './patches'
import {
  addPendingCreate,
  applyRobotsJobs,
  newPendingJobCreate,
  removePendingCreates,
  type RobotsDocumentState,
} from './records'
import type {RobotsJob} from './types'

const ASSET = 'asset-1'

const job = (id: string, changes: Partial<RobotsJob> = {}): RobotsJob => ({
  id,
  workflow: 'summarize',
  status: 'processing',
  created_at: 100,
  ...changes,
})

const doc = (state: Partial<RobotsDocumentState> = {}): RobotsDocumentState => ({
  assetId: ASSET,
  ...state,
})

describe('robotsPatchOperations', () => {
  test('writes nothing when nothing changed', () => {
    const state = applyRobotsJobs(doc(), [job('a')], ASSET)
    expect(robotsPatchOperations(state, applyRobotsJobs(state, [job('a')], ASSET))).toEqual([])
  })

  test('inserts new items after the last one, creating the array if missing', () => {
    const next = applyRobotsJobs(doc(), [job('a')], ASSET)
    expect(robotsPatchOperations(doc(), next)).toEqual([
      {setIfMissing: {robotsJobs: []}, insert: {after: 'robotsJobs[-1]', items: next.robotsJobs}},
    ])
  })

  test('sets changed items and unsets removed ones by key', () => {
    const pending = newPendingJobCreate('summarize')
    const current = addPendingCreate(applyRobotsJobs(doc(), [job('a')], ASSET), pending, ASSET)
    const next = removePendingCreates(
      applyRobotsJobs(current, [job('a', {status: 'completed'})], ASSET),
      () => true,
    )
    const [operations] = robotsPatchOperations(current, next)
    expect(Object.keys(operations?.set ?? {})).toEqual(['robotsJobs[_key=="a"]'])
    expect(operations?.unset).toEqual([`robotsPendingCreates[_key=="${pending.requestId}"]`])
  })

  test('never touches data or filename', () => {
    const current = {...doc(), data: {thumbnail_time: 3}, filename: 'Kept'} as RobotsDocumentState
    const next = {...current, data: {thumbnail_time: 9}, filename: 'Changed'} as RobotsDocumentState
    expect(robotsPatchOperations(current, next)).toEqual([])
  })

  test('sets thumbTime and outputs when they change', () => {
    const next = {...doc(), thumbTime: 12.5, robotsOutputs: {_type: 'mux.robotsOutputs' as const}}
    expect(robotsPatchOperations(doc(), next)).toEqual([
      {set: {robotsOutputs: {_type: 'mux.robotsOutputs'}, thumbTime: 12.5}},
    ])
  })
})

describe('robotsMutations', () => {
  test('guards the first patch of the transaction with the revision', () => {
    const mutations = robotsMutations('doc-1', 'rev-1', [{set: {a: 1}}, {unset: ['b']}])
    expect(mutations).toEqual([
      {patch: {id: 'doc-1', ifRevisionID: 'rev-1', set: {a: 1}}},
      {patch: {id: 'doc-1', unset: ['b']}},
    ])
  })
})

describe('writeRobotsFields', () => {
  const conflict = Object.assign(new Error('Revision mismatch'), {statusCode: 409})

  function fakeClient(documents: RobotsDocumentState[], mutate = vi.fn()) {
    const getDocument = vi.fn()
    for (const [index, document] of documents.entries()) {
      getDocument.mockResolvedValueOnce({_id: 'doc-1', _rev: `rev-${index}`, ...document})
    }
    return {client: {getDocument, mutate} as unknown as SanityClient, getDocument, mutate}
  }

  const addJob = (state: RobotsDocumentState) => applyRobotsJobs(state, [job('a')], ASSET)

  test('merges onto a fresh read and retries on a revision conflict', async () => {
    const mutate = vi.fn().mockRejectedValueOnce(conflict).mockResolvedValueOnce({})
    const {client, getDocument} = fakeClient([doc(), doc()], mutate)
    await expect(writeRobotsFields(client, 'doc-1', ASSET, addJob)).resolves.toBe(true)
    expect(getDocument).toHaveBeenCalledTimes(2)
    expect(mutate.mock.calls[1]?.[0][0].patch.ifRevisionID).toBe('rev-1')
  })

  test('gives up after three conflicts', async () => {
    const mutate = vi.fn().mockRejectedValue(conflict)
    const {client} = fakeClient([doc(), doc(), doc()], mutate)
    await expect(writeRobotsFields(client, 'doc-1', ASSET, addJob)).rejects.toBe(conflict)
    expect(mutate).toHaveBeenCalledTimes(3)
  })

  test('skips the write when nothing changes or the document holds another asset', async () => {
    const unchanged = fakeClient([addJob(doc())])
    await expect(writeRobotsFields(unchanged.client, 'doc-1', ASSET, addJob)).resolves.toBe(false)
    const swapped = fakeClient([doc({assetId: 'other'})])
    await expect(writeRobotsFields(swapped.client, 'doc-1', ASSET, addJob)).resolves.toBe(false)
    expect(unchanged.mutate).not.toHaveBeenCalled()
    expect(swapped.mutate).not.toHaveBeenCalled()
  })
})
