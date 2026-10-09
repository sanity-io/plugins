import {describe, expect, test} from 'vitest'

import {
  activeJobs,
  addPendingCreate,
  applyDirectiveRuns,
  applyRobotsJobs,
  applyThumbnail,
  hasUnfinishedRobotsWork,
  jobsNeedingDetail,
  jobsWithHistory,
  matchPendingCreates,
  mergeJobRecords,
  newPendingDirectiveRunCreate,
  newPendingJobCreate,
  pendingCreateRows,
  polledDirectiveIds,
  removePendingCreates,
  resolvePendingCreatesFromReads,
  resolvePendingJobCreate,
  type RobotsDocumentState,
  thumbnailJobsToApply,
  unitsCell,
} from './records'
import type {RobotsDirectiveRun, RobotsJob} from './types'

const ASSET = 'asset-1'
const NOW_S = 1_800_000_000
const NOW_MS = NOW_S * 1000

const job = (id: string, changes: Partial<RobotsJob> = {}): RobotsJob => ({
  id,
  workflow: 'summarize',
  status: 'completed',
  created_at: NOW_S - 60,
  ...changes,
})

const summarized = (id: string, completedAt: number, title: string) =>
  job(id, {
    updated_at: completedAt,
    parameters: {asset_id: ASSET},
    outputs: {title, description: 'A video', tags: ['a']},
  })

const doc = (state: Partial<RobotsDocumentState> = {}): RobotsDocumentState => ({
  assetId: ASSET,
  ...state,
})

describe('job records', () => {
  test('appends new jobs and updates known ones, keyed by job id', () => {
    const first = mergeJobRecords(undefined, [job('a', {status: 'processing'})])
    expect(first).toEqual([
      {
        _key: 'a',
        _type: 'mux.robotsJob',
        id: 'a',
        workflow: 'summarize',
        status: 'processing',
        created_at: NOW_S - 60,
      },
    ])
    const second = mergeJobRecords(first, [job('a'), job('b')])
    expect(second?.map((record) => [record.id, record.status])).toEqual([
      ['a', 'completed'],
      ['b', 'completed'],
    ])
  })

  test('returns the same array when nothing changed', () => {
    const records = mergeJobRecords(undefined, [job('a')])
    expect(mergeJobRecords(records, [job('a')])).toBe(records)
  })

  test('a thinner list summary never erases units or an error learned from detail', () => {
    const detailed = mergeJobRecords(undefined, [
      job('a', {status: 'errored', units_consumed: 0, errors: [{message: 'No captions'}]}),
    ])
    const summary = mergeJobRecords(detailed, [job('a', {status: 'errored'})])
    expect(summary).toBe(detailed)
    expect(summary?.[0]).toMatchObject({units_consumed: 0, error: 'No captions'})
  })

  test('never removes a record, and skips ids that are unsafe as keys', () => {
    const records = mergeJobRecords(undefined, [job('a')])
    expect(mergeJobRecords(records, [job('b"]')])).toBe(records)
  })

  test('writes only onto the asset the jobs were read for', () => {
    const state = doc({assetId: 'other-asset'})
    expect(applyRobotsJobs(state, [job('a')], ASSET)).toBe(state)
  })
})

describe('outputs', () => {
  test('keep the newest completed summarize of this asset', () => {
    const state = applyRobotsJobs(
      doc(),
      [summarized('a', NOW_S - 30, 'Old'), summarized('b', NOW_S - 10, 'New')],
      ASSET,
    )
    expect(state.robotsOutputs?.summarize).toEqual({
      jobId: 'b',
      completedAt: NOW_S - 10,
      title: 'New',
      description: 'A video',
      tags: ['a'],
    })
  })

  test('break a tie on the greater job id, and read a missing time as oldest', () => {
    const tied = applyRobotsJobs(
      doc(),
      [summarized('b', NOW_S, 'B'), summarized('a', NOW_S, 'A')],
      ASSET,
    )
    expect(tied.robotsOutputs?.summarize?.jobId).toBe('b')
    const undated = applyRobotsJobs(
      doc(),
      [
        summarized('z', NOW_S, 'Dated'),
        job('y', {parameters: {asset_id: ASSET}, outputs: {title: 'x'}}),
      ],
      ASSET,
    )
    expect(undated.robotsOutputs?.summarize?.jobId).toBe('z')
  })

  test('ignore a job whose own parameters name another asset, or none', () => {
    const elsewhere = job('a', {parameters: {asset_id: 'other'}, outputs: {title: 'x'}})
    const summaryOnly = job('b', {outputs: {title: 'x'}})
    expect(applyRobotsJobs(doc(), [elsewhere, summaryOnly], ASSET).robotsOutputs).toBeUndefined()
  })

  test('keep moderate scores', () => {
    const moderated = job('m', {
      workflow: 'moderate',
      updated_at: NOW_S,
      parameters: {asset_id: ASSET},
      outputs: {exceeds_threshold: true, max_scores: {sexual: 0.1, violence: 0.9}},
    })
    expect(applyRobotsJobs(doc(), [moderated], ASSET).robotsOutputs).toEqual({
      _type: 'mux.robotsOutputs',
      moderate: {
        jobId: 'm',
        completedAt: NOW_S,
        exceedsThreshold: true,
        maxScores: {sexual: 0.1, violence: 0.9},
      },
    })
  })
})

describe('directive runs', () => {
  const run = (changes: Partial<RobotsDirectiveRun> = {}): RobotsDirectiveRun => ({
    run_id: 'run-1',
    directive_id: 'dir-1',
    subject_id: ASSET,
    status: 'running',
    started_at: NOW_S - 30,
    node_states: [{job_id: 'job-1'}],
    ...changes,
  })

  test('polling never adds a run; only a run started here is appended', () => {
    const state = doc()
    expect(applyDirectiveRuns(state, [run()], ASSET)).toBe(state)
    expect(applyDirectiveRuns(state, [run()], ASSET, {append: true}).robotsDirectiveRuns).toEqual([
      {
        _key: 'run-1',
        _type: 'mux.robotsDirectiveRun',
        runId: 'run-1',
        directiveId: 'dir-1',
        status: 'running',
        startedAt: NOW_S - 30,
        jobIds: ['job-1'],
      },
    ])
  })

  test('unions job ids rather than replacing them', () => {
    const recorded = applyDirectiveRuns(doc(), [run()], ASSET, {append: true})
    const later = applyDirectiveRuns(
      recorded,
      [run({status: 'completed', node_states: [{job_id: 'job-2'}]})],
      ASSET,
    )
    expect(later.robotsDirectiveRuns?.[0]).toMatchObject({
      status: 'completed',
      jobIds: ['job-1', 'job-2'],
    })
  })
})

describe('pending creates', () => {
  const pending = {...newPendingJobCreate('summarize', NOW_MS), requestId: 'req1', _key: 'req1'}

  test('are added once, keyed by request id, on the right asset only', () => {
    const state = addPendingCreate(doc(), pending, ASSET)
    expect(state.robotsPendingCreates).toEqual([pending])
    expect(addPendingCreate(state, pending, ASSET)).toBe(state)
    const other = doc({assetId: 'other'})
    expect(addPendingCreate(other, pending, ASSET)).toBe(other)
  })

  test('a 202 swaps the placeholder for the job record in one step', () => {
    const state = resolvePendingJobCreate(
      addPendingCreate(doc(), pending, ASSET),
      'req1',
      job('j'),
      ASSET,
    )
    expect(state.robotsPendingCreates).toEqual([])
    expect(state.robotsJobs?.map((record) => record.id)).toEqual(['j'])
  })

  test('keeps entries it cannot read when removing', () => {
    const unreadable = {_key: 'x', kind: 'mystery'} as never
    const state = removePendingCreates(
      doc({robotsPendingCreates: [pending, unreadable]}),
      () => true,
    )
    expect(state.robotsPendingCreates).toEqual([unreadable])
  })

  describe('matching', () => {
    test('resolves to the closest unrecorded job of the same workflow inside the window', () => {
      const jobs = [
        job('too-early', {created_at: NOW_S - 16}),
        job('near', {created_at: NOW_S + 5}),
        job('far', {created_at: NOW_S + 100}),
        job('other-workflow', {workflow: 'moderate', created_at: NOW_S}),
        job('too-late', {created_at: NOW_S + 121}),
      ]
      expect(matchPendingCreates([pending], jobs, [], doc())).toEqual(new Map([['req1', 'near']]))
    })

    test('never resolves to a job the document already recorded', () => {
      const state = applyRobotsJobs(doc(), [job('near', {created_at: NOW_S})], ASSET)
      expect(
        matchPendingCreates([pending], [job('near', {created_at: NOW_S})], [], state).size,
      ).toBe(0)
    })

    test('prefers the id this tab got back from its own create', () => {
      const jobs = [job('near', {created_at: NOW_S}), job('mine', {created_at: NOW_S + 60})]
      const links = new Map([['req1', 'mine']])
      expect(matchPendingCreates([pending], jobs, [], doc(), links).get('req1')).toBe('mine')
    })

    test('matches a directive run by directive and asset', () => {
      const runPending = {
        ...newPendingDirectiveRunCreate('dir-1', NOW_MS),
        requestId: 'r2',
        _key: 'r2',
      }
      const runs: RobotsDirectiveRun[] = [
        {run_id: 'elsewhere', directive_id: 'dir-1', subject_id: 'other', started_at: NOW_S},
        {run_id: 'here', directive_id: 'dir-1', subject_id: ASSET, started_at: NOW_S + 2},
      ]
      const state = addPendingCreate(doc(), runPending, ASSET)
      const resolved = resolvePendingCreatesFromReads(state, [], runs, ASSET)
      expect(resolved.robotsPendingCreates).toEqual([])
      expect(resolved.robotsDirectiveRuns?.map((record) => record.runId)).toEqual(['here'])
    })
  })

  describe('rows', () => {
    const base = {settled: new Set<string>(), links: new Map(), runs: [], state: doc()}

    test('read Starting… for 45 s, then Not confirmed', () => {
      const rows = (nowS: number) =>
        pendingCreateRows({...base, stored: [pending], jobs: [], nowS}).map((row) => row.phase)
      expect(rows(NOW_S + 44)).toEqual(['starting'])
      expect(rows(NOW_S + 45)).toEqual(['unconfirmed'])
    })

    test('read Not confirmed at once in the tab whose create has no answer', () => {
      const rows = pendingCreateRows({
        ...base,
        stored: [pending],
        local: {pending, phase: 'unconfirmed'},
        jobs: [],
        nowS: NOW_S,
      })
      expect(rows.map((row) => row.phase)).toEqual(['unconfirmed'])
    })

    test('disappear once their job is on screen, and when settled', () => {
      const shown = pendingCreateRows({
        ...base,
        stored: [pending],
        jobs: [job('near', {created_at: NOW_S})],
        nowS: NOW_S,
      })
      expect(shown).toEqual([])
      const settled = pendingCreateRows({
        ...base,
        settled: new Set(['req1']),
        stored: [pending],
        jobs: [],
        nowS: NOW_S,
      })
      expect(settled).toEqual([])
    })
  })
})

describe('polling', () => {
  test('active jobs are unfinished and younger than six hours', () => {
    const jobs = [
      job('done'),
      job('running', {status: 'processing'}),
      job('stale', {status: 'processing', created_at: NOW_S - 7 * 60 * 60}),
    ]
    expect(activeJobs(jobs, NOW_MS).map((entry) => entry.id)).toEqual(['running'])
  })

  test('the document says when work is in flight', () => {
    expect(hasUnfinishedRobotsWork(doc(), NOW_MS)).toBe(false)
    const running = applyRobotsJobs(doc(), [job('a', {status: 'pending'})], ASSET)
    expect(hasUnfinishedRobotsWork(running, NOW_MS)).toBe(true)
    const waiting = addPendingCreate(doc(), newPendingJobCreate('summarize', NOW_MS), ASSET)
    expect(hasUnfinishedRobotsWork(waiting, NOW_MS)).toBe(true)
  })

  test('reads detail for a few of the newest terminal jobs at a time', () => {
    const jobs = Array.from({length: 30}, (_, index) =>
      job(`j${index}`, {created_at: NOW_S + index}),
    )
    const batch = jobsNeedingDetail(jobs, new Set(['j29']))
    expect(batch.map((entry) => entry.id)).toEqual(['j28', 'j27', 'j26', 'j25', 'j24'])
  })
})

describe('polledDirectiveIds', () => {
  test('lists configured, recorded, pending and live directives, once each', () => {
    const recorded = applyDirectiveRuns(
      doc(),
      [{run_id: 'run-1', directive_id: 'dir-recorded', subject_id: ASSET}],
      ASSET,
      {append: true},
    )
    const state = addPendingCreate(recorded, newPendingDirectiveRunCreate('dir-pending'), ASSET)
    const live: RobotsDirectiveRun[] = [{run_id: 'run-2', directive_id: 'dir-live'}]
    expect(polledDirectiveIds(['dir-config', 'dir-live'], state, live)).toEqual([
      'dir-config',
      'dir-live',
      'dir-pending',
      'dir-recorded',
    ])
  })
})

describe('history', () => {
  test('recorded jobs Mux no longer lists still show', () => {
    const state = applyRobotsJobs(doc(), [job('old', {status: 'errored', errors: 'Failed'})], ASSET)
    const shown = jobsWithHistory([job('new')], state.robotsJobs)
    expect(shown.map((entry) => entry.id)).toEqual(['new', 'old'])
    expect(shown[1]?.errors).toEqual([{message: 'Failed'}])
  })
})

describe('unitsCell', () => {
  test.each([
    [job('a', {status: 'errored'}), 'unread', 'Not charged', false],
    [job('a', {units_consumed: 12}), 'unread', '12', false],
    [job('a', {status: 'processing'}), 'unread', 'Not counted yet', false],
    [job('a'), 'unreadable', 'Unavailable', false],
    [job('a'), 'loaded', 'Not reported', false],
    [job('a'), 'unread', 'Not loaded', true],
  ] as const)('%#: %s', (entry, detail, label, isLoadable) => {
    expect(unitsCell(entry, detail)).toEqual({label, isLoadable})
  })
})

describe('thumbnails', () => {
  const thumbnails = job('t', {
    workflow: 'find-best-thumbnails',
    updated_at: NOW_S - 10,
    parameters: {asset_id: ASSET, update_asset_thumbnail: true},
  })

  test('copies thumbnail_time into thumbTime once per job', () => {
    const recorded = applyRobotsJobs(doc({data: {thumbnail_time: 12.67}}), [thumbnails], ASSET)
    expect(thumbnailJobsToApply(recorded, [thumbnails], NOW_MS).map((entry) => entry.id)).toEqual([
      't',
    ])
    const applied = applyThumbnail(recorded, ['t'], ASSET)
    expect(applied.thumbTime).toBe(12.67)
    expect(applied.robotsJobs?.[0]?.thumbnailApplied).toBe(true)
    expect(thumbnailJobsToApply(applied, [thumbnails], NOW_MS)).toEqual([])
  })

  test('skips jobs that did not ask, old jobs, and a missing thumbnail_time', () => {
    const noAsk = {...thumbnails, parameters: {asset_id: ASSET}}
    const recorded = applyRobotsJobs(doc(), [thumbnails, noAsk], ASSET)
    expect(thumbnailJobsToApply(recorded, [noAsk], NOW_MS)).toEqual([])
    expect(thumbnailJobsToApply(recorded, [thumbnails], NOW_MS + 7 * 60 * 60 * 1000)).toEqual([])
    expect(applyThumbnail(recorded, ['t'], ASSET)).toBe(recorded)
  })
})
