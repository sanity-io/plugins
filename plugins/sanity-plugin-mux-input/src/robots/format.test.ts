import {describe, expect, test} from 'vitest'

import {formatOffsetMs, nodeStateDetail, runStatusNote} from './format'

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
    expect(nodeStateDetail({status: 'waiting_for_resources'})).toBe('Waiting for resources')
    expect(nodeStateDetail({status: 'dispatched', job_id: 'job-1'})).toBe('Dispatched')
  })

  test('explain a partial run, and only that', () => {
    expect(runStatusNote('partial')).toBe('Some workflows finished and others failed.')
    expect(runStatusNote('completed')).toBeUndefined()
    expect(runStatusNote(undefined)).toBeUndefined()
  })
})

test('offsets read as m:ss', () => {
  expect(formatOffsetMs(65_500)).toBe('1:05')
  expect(formatOffsetMs(undefined)).toBe('—')
})
