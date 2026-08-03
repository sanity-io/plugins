import {describe, expect, test} from 'vitest'

import {githubUrlToObject} from '../src/util/github-url'
import {outdent} from '../src/util/outdent'

describe('githubUrlToObject', () => {
  test('parses https github URLs', () => {
    expect(githubUrlToObject('https://github.com/sanity-io/plugins')).toEqual({
      user: 'sanity-io',
      repo: 'plugins',
    })
  })

  test('parses scp-style remotes', () => {
    expect(githubUrlToObject('git@github.com:sanity-io/plugins.git')).toEqual({
      user: 'sanity-io',
      repo: 'plugins',
    })
  })

  test('parses git+ssh remotes', () => {
    expect(githubUrlToObject('git+ssh://git@github.com/sanity-io/plugins.git')).toEqual({
      user: 'sanity-io',
      repo: 'plugins',
    })
  })

  test('returns undefined for non-github URLs', () => {
    expect(githubUrlToObject('https://gitlab.com/sanity-io/plugins')).toBeUndefined()
  })
})

describe('outdent', () => {
  test('strips common leading indentation', () => {
    expect(outdent`
      line1
        nested
      line3
    `).toBe('line1\n  nested\nline3')
  })

  test('does not eat content from under-indented lines', () => {
    // First content line has 4 spaces of indent; a later line has only 2.
    // Stripping must stop at whitespace — not consume "x" from the short line.
    expect(outdent`
    four
  x
    four
    `).toBe('four\nx\nfour')
  })
})
