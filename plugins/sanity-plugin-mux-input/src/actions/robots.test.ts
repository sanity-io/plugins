import {createClient} from '@sanity/client'
import {beforeEach, describe, expect, test} from 'vitest'

import {
  cancelRobotsJob,
  getRobotsDirectiveRun,
  getRobotsJob,
  listRobotsDirectiveRuns,
  listRobotsDirectives,
  listRobotsJobs,
  resetRobotsDirectiveVersions,
  startRobotsDirectiveRun,
  startRobotsJob,
} from './robots'

interface Reply {
  status: number
  body: unknown
}

/** Requests as the proxy routes see them: `METHOD /path` after the dataset. */
const calls: string[] = []
let replies: Record<string, Reply> = {}

const ok = (data: unknown): Reply => ({status: 200, body: {data}})
/** How the proxy forwards Mux's 404, with Mux's error under `mux`. */
const muxNotFound = (message: string): Reply => ({
  status: 404,
  body: {statusCode: 404, error: 'Not Found', message, mux: {type: 'not_found', message}},
})

// `resolveFetch` is an internal @sanity/client option that replaces the transport.
function fakeFetch(input: string, init?: {method?: string}) {
  const path = new URL(input).pathname.replace(/^\/v[^/]+\/addons\/mux\/robots\/production/, '')
  const call = `${init?.method ?? 'GET'} ${path}`
  calls.push(call)
  const reply = replies[call] ?? {status: 418, body: {message: `Unexpected ${call}`}}
  return Promise.resolve(
    new Response(JSON.stringify(reply.body), {
      status: reply.status,
      headers: {'content-type': 'application/json'},
    }),
  )
}

const client = createClient({
  projectId: 'abc123',
  dataset: 'production',
  apiVersion: '2024-03-05',
  useCdn: false,
  withCredentials: true,
  resolveFetch: () => fakeFetch,
})

const v0Link = (path: string) => ({self: {href: `/robots/v0/${path}`}})
const v1Link = (path: string) => ({self: {href: `/robots/v1/${path}`}})

beforeEach(() => {
  calls.length = 0
  replies = {}
  resetRobotsDirectiveVersions()
})

describe('jobs', () => {
  test('are listed and started on v1', async () => {
    replies['GET /v1/jobs'] = ok([])
    replies['POST /v1/jobs/analyze-structure'] = {
      status: 202,
      body: {data: {id: 'rjob_1', workflow: 'analyze-structure', status: 'pending'}},
    }

    await listRobotsJobs(client, {assetId: 'asset-1', limit: 100})
    await startRobotsJob(client, 'analyze-structure', {asset_id: 'asset-1'})

    expect(calls).toEqual(['GET /v1/jobs', 'POST /v1/jobs/analyze-structure'])
  })

  test('are read and cancelled on the version their link names', async () => {
    const v0Job = {
      id: 'rjob_a',
      workflow: 'summarize' as const,
      _links: v0Link('jobs/summarize/rjob_a'),
    }
    const v1Job = {
      id: 'rjob_b',
      workflow: 'summarize' as const,
      _links: v1Link('jobs/summarize/rjob_b'),
    }
    replies['GET /jobs/summarize/rjob_a'] = ok(v0Job)
    replies['POST /jobs/rjob_a/cancel'] = ok(v0Job)
    replies['GET /v1/jobs/summarize/rjob_b'] = ok(v1Job)

    await getRobotsJob(client, v0Job)
    await cancelRobotsJob(client, v0Job)
    await getRobotsJob(client, v1Job)

    expect(calls).toEqual([
      'GET /jobs/summarize/rjob_a',
      'POST /jobs/rjob_a/cancel',
      'GET /v1/jobs/summarize/rjob_b',
    ])
  })

  test('without a link are tried on v1, then on v0 after Mux’s 404', async () => {
    replies['GET /v1/jobs/summarize/rjob_old'] = muxNotFound('Job not found')
    replies['GET /jobs/summarize/rjob_old'] = ok({id: 'rjob_old'})

    const response = await getRobotsJob(client, {id: 'rjob_old', workflow: 'summarize'})

    expect(response.data?.id).toBe('rjob_old')
    expect(calls).toEqual(['GET /v1/jobs/summarize/rjob_old', 'GET /jobs/summarize/rjob_old'])
  })

  test('are not looked for on v0 when the proxy itself has no v1 route', async () => {
    replies['GET /v1/jobs/summarize/rjob_1'] = {
      status: 404,
      body: {statusCode: 404, error: 'Not Found', message: 'Not Found'},
    }

    await expect(getRobotsJob(client, {id: 'rjob_1', workflow: 'summarize'})).rejects.toMatchObject(
      {status: 404, muxAnswered: false},
    )
    expect(calls).toEqual(['GET /v1/jobs/summarize/rjob_1'])
  })

  test('of a workflow only v0 has are read on v0 alone', async () => {
    replies['GET /jobs/find-scenes/rjob_scenes'] = muxNotFound('Job not found')

    await expect(
      getRobotsJob(client, {id: 'rjob_scenes', workflow: 'find-scenes'}),
    ).rejects.toMatchObject({status: 404, muxAnswered: true})
    expect(calls).toEqual(['GET /jobs/find-scenes/rjob_scenes'])
  })
})

describe('directives', () => {
  test('are listed on v1, and their runs read on the version each one has', async () => {
    replies['GET /v1/directives'] = ok([
      {id: 'dir_v0', name: 'Old', _links: v0Link('directives/dir_v0')},
      {id: 'dir_v1', name: 'New', _links: v1Link('directives/dir_v1')},
    ])
    replies['GET /directives/dir_v0/runs'] = ok([{run_id: 'run_a', subject_id: 'asset-1'}])
    replies['GET /v1/directives/dir_v1/runs'] = ok([
      {id: 'run_b', directive_id: 'dir_v1', subject_id: 'asset-1'},
    ])

    await listRobotsDirectives(client, {limit: 100})
    const v0Runs = await listRobotsDirectiveRuns(client, 'dir_v0', {limit: 25})
    const v1Runs = await listRobotsDirectiveRuns(client, 'dir_v1', {limit: 25})

    expect(v0Runs.data).toEqual([{run_id: 'run_a', subject_id: 'asset-1'}])
    expect(v1Runs.data).toEqual([{run_id: 'run_b', directive_id: 'dir_v1', subject_id: 'asset-1'}])
    expect(calls).toEqual([
      'GET /v1/directives',
      'GET /directives/dir_v0/runs',
      'GET /v1/directives/dir_v1/runs',
    ])
  })

  test('no listing named are found on v1 or v0 once, then asked on that version alone', async () => {
    replies['GET /v1/directives/dir_x/runs'] = muxNotFound('Directive not found')
    replies['GET /directives/dir_x/runs'] = ok([])
    replies['GET /directives/dir_x/runs/run_1'] = ok({run_id: 'run_1'})

    await listRobotsDirectiveRuns(client, 'dir_x', {limit: 25})
    const run = await getRobotsDirectiveRun(client, 'dir_x', 'run_1')

    expect(run.data).toEqual({run_id: 'run_1'})
    expect(calls).toEqual([
      'GET /v1/directives/dir_x/runs',
      'GET /directives/dir_x/runs',
      'GET /directives/dir_x/runs/run_1',
    ])
  })

  test('are not pinned to v0 by a run Mux no longer has', async () => {
    replies['GET /v1/directives/dir_v1/runs/run_gone'] = muxNotFound('Run not found')
    replies['GET /directives/dir_v1/runs/run_gone'] = muxNotFound('Directive not found')
    replies['GET /v1/directives/dir_v1/runs'] = ok([])

    await expect(getRobotsDirectiveRun(client, 'dir_v1', 'run_gone')).rejects.toMatchObject({
      status: 404,
    })
    await listRobotsDirectiveRuns(client, 'dir_v1', {limit: 25})
    await listRobotsDirectiveRuns(client, 'dir_v1', {limit: 25})

    expect(calls).toEqual([
      'GET /v1/directives/dir_v1/runs/run_gone',
      'GET /directives/dir_v1/runs/run_gone',
      'GET /v1/directives/dir_v1/runs',
      'GET /v1/directives/dir_v1/runs',
    ])
  })

  test('are run on v1, reading the run id v1 calls `id`', async () => {
    replies['POST /v1/directives/dir_v1/runs'] = {
      status: 202,
      body: {
        data: {id: 'run_new', directive_id: 'dir_v1', subject_id: 'asset-1', status: 'pending'},
      },
    }

    const run = await startRobotsDirectiveRun(client, 'dir_v1', 'asset-1')

    expect(run).toEqual({
      run_id: 'run_new',
      directive_id: 'dir_v1',
      subject_id: 'asset-1',
      status: 'pending',
    })
    expect(calls).toEqual(['POST /v1/directives/dir_v1/runs'])
  })
})
