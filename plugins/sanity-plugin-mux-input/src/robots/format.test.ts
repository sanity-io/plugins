import {describe, expect, test} from 'vitest'

import {
  formatMediaSpan,
  formatMediaTime,
  formatOffsetMs,
  nodeStateDetail,
  runStatusNote,
  stepCountLabel,
} from './format'

describe('directive run steps', () => {
  test('say why a step failed or what it waits on', () => {
    expect(nodeStateDetail({status: 'failed', reason: 'Asset has no captions'})).toBe(
      'Asset has no captions',
    )
    expect(
      nodeStateDetail({
        status: 'waiting_for_source_workflow',
        source_workflows: ['generate-premium-captions'],
      }),
    ).toBe('Waiting on Generate premium captions')
    expect(
      nodeStateDetail({status: 'waiting_for_source_bindings', source_bindings: ['captions_en']}),
    ).toBe('Waiting on captions_en')
    expect(nodeStateDetail({status: 'waiting_for_resources'})).toBe(
      'Waiting for a resource, such as captions',
    )
    expect(nodeStateDetail({status: 'dispatched', job_id: 'job-1'})).toBe('Dispatched')
  })

  test('are counted in words, before Mux lists any', () => {
    expect(stepCountLabel(0)).toBe('No steps yet')
    expect(stepCountLabel(1)).toBe('1 step')
    expect(stepCountLabel(3)).toBe('3 steps')
  })

  test('explain a partial or waiting run, and only those', () => {
    expect(runStatusNote('partial')).toBe('Some workflows finished and others failed.')
    expect(runStatusNote('waiting')).toContain('such as a caption track')
    expect(runStatusNote('completed')).toBeUndefined()
    expect(runStatusNote(undefined)).toBeUndefined()
  })
})

test('offsets read as m:ss', () => {
  expect(formatOffsetMs(65_500)).toBe('1:05')
  expect(formatOffsetMs(undefined)).toBe('—')
})

describe('media times', () => {
  test('read v1 seconds and v0 milliseconds by key, never converting twice', () => {
    expect(formatMediaTime(65.5, undefined)).toBe('1:05')
    expect(formatMediaTime(undefined, 65_500)).toBe('1:05')
    expect(formatMediaTime(0, 999_000)).toBe('0:00')
    expect(formatMediaTime(undefined, undefined)).toBe('—')
  })

  test('spans read either version', () => {
    expect(formatMediaSpan({start_time: 0.033, end_time: 12})).toBe('0:00 – 0:12')
    expect(formatMediaSpan({start_ms: 61_000, end_ms: 75_000})).toBe('1:01 – 1:15')
  })
})
