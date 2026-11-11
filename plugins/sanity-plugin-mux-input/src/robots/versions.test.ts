import {describe, expect, test} from 'vitest'

import {v0DirectiveIds} from '../hooks/useRobotsDirectives'
import {jobVersions, linkedVersion} from './versions'

const link = (href: string) => ({_links: {self: {href}}})

describe('linkedVersion', () => {
  test('reads the version from a list summary’s self link', () => {
    expect(linkedVersion(link('/robots/v0/jobs/summarize/rjob_1'))).toBe('v0')
    expect(linkedVersion(link('/robots/v1/directives/dir_1'))).toBe('v1')
  })

  test('names none for a missing or unexpected link', () => {
    expect(linkedVersion({})).toBeUndefined()
    expect(linkedVersion(link('/video/v1/assets/abc'))).toBeUndefined()
    expect(linkedVersion(link('/robots/v2/jobs/summarize/rjob_1'))).toBeUndefined()
  })
})

describe('jobVersions', () => {
  test('a listed job is read on its own version only', () => {
    expect(jobVersions({workflow: 'summarize', ...link('/robots/v0/jobs/summarize/j')})).toEqual([
      'v0',
    ])
    expect(jobVersions({workflow: 'summarize', ...link('/robots/v1/jobs/summarize/j')})).toEqual([
      'v1',
    ])
  })

  test('a job without a link is tried on v1 first, and find-scenes on v0 only', () => {
    expect(jobVersions({workflow: 'summarize'})).toEqual(['v1', 'v0'])
    expect(jobVersions({workflow: 'find-scenes'})).toEqual(['v0'])
  })
})

describe('v0DirectiveIds', () => {
  test('names the listed directives made with v0', () => {
    expect(
      v0DirectiveIds({
        status: 'loaded',
        isComplete: true,
        directives: [
          {id: 'old', ...link('/robots/v0/directives/old')},
          {id: 'new', ...link('/robots/v1/directives/new')},
          {id: 'unknown'},
        ],
      }),
    ).toEqual(['old'])
  })

  test('names none until the listing loads', () => {
    expect(v0DirectiveIds({status: 'pending'})).toEqual([])
    expect(v0DirectiveIds({status: 'failed'})).toEqual([])
  })
})
