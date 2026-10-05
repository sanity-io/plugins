import type {SanityClient} from 'sanity'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {getAsset} from '../actions/assets'
import * as robotsApi from '../actions/robots'
import {RobotsRequestError} from '../actions/robots'
import {resetRobotsCapabilityCache} from './capability'
import type {RobotsDocumentState} from './records'
import {RobotsSyncStore} from './sync'
import type {RobotsJob} from './types'

vi.mock('../actions/robots', async (importOriginal) => {
  const original = await importOriginal<typeof import('../actions/robots')>()
  return {
    ...original,
    listRobotsJobs: vi.fn(),
    getRobotsJob: vi.fn(),
    startRobotsJob: vi.fn(),
    listRobotsDirectiveRuns: vi.fn(),
    getRobotsDirectiveRun: vi.fn(),
  }
})
vi.mock('../actions/assets', () => ({
  getAsset: vi.fn(async () => ({data: {id: 'asset-1', status: 'ready', tracks: []}})),
}))

const api = vi.mocked(robotsApi)
const ASSET = 'asset-1'

type Doc = RobotsDocumentState & {_id: string; _rev: string} & Record<string, unknown>
type Patch = {
  id: string
  ifRevisionID?: string
  setIfMissing?: Record<string, unknown[]>
  insert?: {after: string; items: unknown[]}
  set?: Record<string, unknown>
  unset?: string[]
}

const KEYED_PATH = /^(\w+)\[_key=="(.+)"\]$/

/** A document store just big enough for the patches the store sends. */
function fakeContentLake(initial: RobotsDocumentState) {
  let revision = 0
  const doc: Doc = {_id: 'doc-1', _rev: 'rev-0', ...initial}
  const mutations: Patch[][] = []
  const mutate = vi.fn(async (batch: {patch: Patch}[]) => {
    mutations.push(batch.map(({patch}) => patch))
    for (const {patch} of batch) {
      if (patch.ifRevisionID && patch.ifRevisionID !== doc._rev) {
        throw Object.assign(new Error('Revision mismatch'), {statusCode: 409})
      }
      for (const [field, value] of Object.entries(patch.setIfMissing ?? {})) doc[field] ??= value
      if (patch.insert) {
        const field = patch.insert.after.replace('[-1]', '')
        doc[field] = [...(doc[field] as unknown[]), ...patch.insert.items]
      }
      for (const [path, value] of Object.entries(patch.set ?? {})) {
        const [, field, key] = KEYED_PATH.exec(path) ?? []
        if (field) {
          doc[field] = (doc[field] as {_key: string}[]).map((item) =>
            item._key === key ? value : item,
          )
        } else doc[path] = value
      }
      for (const path of patch.unset ?? []) {
        const [, field = '', key] = KEYED_PATH.exec(path) ?? []
        doc[field] = (doc[field] as {_key: string}[]).filter((item) => item._key !== key)
      }
    }
    doc._rev = `rev-${++revision}`
    return {}
  })
  // What the asset refresh sets, outside the Robots fields.
  const assetWrites: Record<string, unknown>[] = []
  const client = {
    config: () => ({projectId: 'p', dataset: 'd'}),
    getDocument: vi.fn(async () => structuredClone(doc)),
    mutate,
    patch: () => ({
      set: (fields: Record<string, unknown>) => ({
        commit: async () => {
          assetWrites.push(fields)
          return {}
        },
      }),
    }),
  } as unknown as SanityClient
  return {client, doc, mutations, assetWrites}
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

const job = (id: string, changes: Partial<RobotsJob> = {}): RobotsJob => ({
  id,
  workflow: 'summarize',
  status: 'processing',
  created_at: Math.floor(Date.now() / 1000),
  ...changes,
})

describe('RobotsSyncStore', () => {
  let unregister: (() => void) | undefined

  beforeEach(() => {
    resetRobotsCapabilityCache()
    api.listRobotsJobs.mockResolvedValue({data: []})
    api.listRobotsDirectiveRuns.mockResolvedValue({data: []})
  })

  afterEach(() => {
    unregister?.()
    vi.clearAllMocks()
  })

  function subscribe(lake: ReturnType<typeof fakeContentLake>) {
    const store = new RobotsSyncStore(lake.client, 'doc-1', ASSET)
    const subscription = store.register(lake.client)
    subscription.update({document: lake.doc, defaultDirectiveIds: []})
    unregister = subscription.unregister
    return store
  }

  test('reads nothing until something subscribes, then records every job it reads', async () => {
    const lake = fakeContentLake({assetId: ASSET})
    api.listRobotsJobs.mockResolvedValue({data: [job('j1')]})
    const store = new RobotsSyncStore(lake.client, 'doc-1', ASSET)
    await flush()
    expect(api.listRobotsJobs).not.toHaveBeenCalled()

    const subscription = store.register(lake.client)
    subscription.update({document: lake.doc, defaultDirectiveIds: []})
    unregister = subscription.unregister
    await flush()
    await flush()

    expect(store.getSnapshot().capability).toEqual({state: 'enabled'})
    expect(lake.doc.robotsJobs?.map((record) => record.id)).toEqual(['j1'])
  })

  test('decides capability from the job list and caches it for the session', async () => {
    const lake = fakeContentLake({assetId: ASSET})
    api.listRobotsJobs.mockRejectedValue(
      new RobotsRequestError('No robots scope', {
        status: 401,
        type: 'unauthorized',
        muxAnswered: true,
      }),
    )
    const store = subscribe(lake)
    await flush()
    expect(store.getSnapshot().capability).toEqual({state: 'scope-missing'})

    const next = subscribe(fakeContentLake({assetId: ASSET}))
    expect(next.getSnapshot().capability).toEqual({state: 'scope-missing'})
    expect(api.listRobotsJobs).toHaveBeenCalledTimes(1)
  })

  test('saves the placeholder before creating, then swaps it for the job', async () => {
    const lake = fakeContentLake({assetId: ASSET})
    const store = subscribe(lake)
    await flush()
    api.startRobotsJob.mockImplementation(async () => {
      // The placeholder is on the document before anything is sent.
      expect(lake.doc.robotsPendingCreates).toHaveLength(1)
      return job('created')
    })
    const notify = vi.fn()

    await store.startJob('summarize', {asset_id: ASSET}, notify)

    expect(api.startRobotsJob).toHaveBeenCalledTimes(1)
    expect(lake.doc.robotsPendingCreates).toEqual([])
    expect(lake.doc.robotsJobs?.map((record) => record.id)).toEqual(['created'])
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({status: 'success'}))
  })

  test('a refused create removes its placeholder and is never retried', async () => {
    const lake = fakeContentLake({assetId: ASSET})
    const store = subscribe(lake)
    await flush()
    api.startRobotsJob.mockRejectedValue(
      new RobotsRequestError('Not on your plan.', {
        status: 403,
        type: 'robots_workflow_not_available',
        muxAnswered: true,
      }),
    )
    const notify = vi.fn()

    await store.startJob('translate-audio', {asset_id: ASSET}, notify)
    await flush()

    expect(api.startRobotsJob).toHaveBeenCalledTimes(1)
    expect(lake.doc.robotsPendingCreates).toEqual([])
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({status: 'error', description: 'Not on your plan.'}),
    )
  })

  test('an unknown outcome keeps the placeholder, so Run stays blocked', async () => {
    const lake = fakeContentLake({assetId: ASSET})
    const store = subscribe(lake)
    await flush()
    api.startRobotsJob.mockRejectedValue(new RobotsRequestError('Bad Gateway', {status: 502}))
    const notify = vi.fn()

    await store.startJob('summarize', {asset_id: ASSET}, notify)
    await flush()

    expect(lake.doc.robotsPendingCreates).toHaveLength(1)
    expect(store.getSnapshot().localJobCreate?.phase).toBe('unconfirmed')
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({status: 'warning'}))
  })

  test('refreshes the asset once a job completes, and writes it only when it changed', async () => {
    const asset = {id: ASSET, status: 'ready', thumbnail_time: 12, tracks: []}
    const completed = job('j1', {status: 'completed'})
    api.listRobotsJobs.mockResolvedValue({data: [completed]})
    api.getRobotsJob.mockResolvedValue({data: completed})

    vi.mocked(getAsset).mockResolvedValueOnce({data: asset} as never)
    const unchanged = fakeContentLake({assetId: ASSET, status: 'ready', data: asset})
    subscribe(unchanged)
    await flush()
    await flush()
    expect(getAsset).toHaveBeenCalledTimes(1)
    expect(unchanged.assetWrites).toEqual([])
    unregister?.()

    const withTrack = {...asset, tracks: [{id: 't1', type: 'text'}]}
    vi.mocked(getAsset).mockResolvedValueOnce({data: withTrack} as never)
    const changed = fakeContentLake({assetId: ASSET, status: 'ready', data: asset})
    subscribe(changed)
    await flush()
    await flush()
    expect(changed.assetWrites).toEqual([
      {status: 'ready', data: {...withTrack, tracks: [{id: 't1', type: 'text', _key: 't1'}]}},
    ])
  })

  test('sends nothing when the placeholder cannot be saved', async () => {
    const lake = fakeContentLake({assetId: 'another-asset'})
    const store = subscribe(lake)
    await flush()
    const notify = vi.fn()

    await store.startJob('summarize', {asset_id: ASSET}, notify)

    expect(api.startRobotsJob).not.toHaveBeenCalled()
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({status: 'error'}))
  })
})
