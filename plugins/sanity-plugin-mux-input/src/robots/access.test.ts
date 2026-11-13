import {describe, expect, test} from 'vitest'

import {canRunRobots, robotsRunnersOnlyNote} from './access'

const userWith = (...names: string[]) => ({
  roles: names.map((name) => ({name, title: name})),
})

describe('canRunRobots', () => {
  test('lets only administrators run by default', () => {
    expect(canRunRobots(userWith('administrator'), undefined)).toBe(true)
    expect(canRunRobots(userWith('editor'), undefined)).toBe(false)
  })

  test('an empty list opens it to everyone', () => {
    expect(canRunRobots(userWith('viewer'), [])).toBe(true)
  })

  test('honours custom roles', () => {
    expect(canRunRobots(userWith('editor', 'contributor'), ['editor'])).toBe(true)
    expect(canRunRobots(userWith('administrator'), ['editor'])).toBe(false)
  })

  test('no user means no', () => {
    expect(canRunRobots(null, [])).toBe(false)
    expect(canRunRobots(undefined, undefined)).toBe(false)
  })
})

describe('robotsRunnersOnlyNote', () => {
  test('names who can run', () => {
    expect(robotsRunnersOnlyNote(undefined)).toMatch(/^Only administrators can run Robots/)
    expect(robotsRunnersOnlyNote(['editor', 'administrator'])).toMatch(
      /^Only these roles can run Robots in this Studio: editor, administrator\./,
    )
  })
})
