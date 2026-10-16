import {describe, expect, test} from 'vitest'

import {instructionTaskTypeName, type InstructionTask} from '../types'
import {enrichInstructionTasks, type RecentInstructionRun} from './recentInstructionRuns'

const started = '2026-10-16T14:04:14.281Z'
const requestedAt = Date.parse('2026-10-16T14:04:14.000Z')

function task(overrides: Partial<InstructionTask> = {}): InstructionTask {
  return {
    _key: 'c3ccc1a7b1ef',
    _type: instructionTaskTypeName,
    path: 'title',
    started,
    ended: '2026-10-16T14:04:15.670Z',
    reason: 'success',
    startedByUserId: 'p8xDvUMxC',
    ...overrides,
  }
}

function run(overrides: Partial<RecentInstructionRun> = {}): RecentInstructionRun {
  return {
    id: 'run-1',
    documentId: 'drafts.doc-1',
    path: 'title',
    instructionKey: '41bd3b6bbff7',
    title: 'Create title from body',
    requestedAt,
    ...overrides,
  }
}

describe('enrichInstructionTasks', () => {
  test('copies the instruction title and key onto a custom instruction task', () => {
    const [enriched] = enrichInstructionTasks([task()], [run()], 'doc-1')

    expect(enriched).toMatchObject({
      title: 'Create title from body',
      instructionKey: '41bd3b6bbff7',
    })
  })

  test('matches a release run only to that release document', () => {
    const releaseRun = run({documentId: 'versions.release.doc-1'})

    const [onRelease] = enrichInstructionTasks([task()], [releaseRun], 'versions.release.doc-1')
    const [onPublished] = enrichInstructionTasks([task()], [releaseRun], 'doc-1')

    expect(onRelease?.title).toBe('Create title from body')
    expect(onPublished?.title).toBeUndefined()
  })

  test('leaves built-in tasks that already have a title alone', () => {
    const caption = task({
      _key: 'caption',
      path: 'featuredImage.alt',
      instructionKey: '__generate-caption',
      title: 'Generate caption',
    })

    const [enriched] = enrichInstructionTasks(
      [caption],
      [run({path: 'featuredImage.alt', title: 'Create title from body'})],
      'doc-1',
    )

    expect(enriched).toMatchObject({
      title: 'Generate caption',
      instructionKey: '__generate-caption',
    })
  })

  test('does not use a run from another document', () => {
    const [enriched] = enrichInstructionTasks(
      [task()],
      [run({documentId: 'drafts.other'})],
      'doc-1',
    )

    expect(enriched?.title).toBeUndefined()
    expect(enriched?.instructionKey).toBeUndefined()
  })

  test('assigns two runs on the same path to tasks in start order', () => {
    const firstStarted = '2026-10-16T14:04:14.281Z'
    const secondStarted = '2026-10-16T14:04:20.281Z'
    const tasks = [
      task({_key: 'second', started: secondStarted}),
      task({_key: 'first', started: firstStarted}),
    ]
    const runs = [
      run({
        id: 'later',
        title: 'Improve',
        instructionKey: 'later-key',
        requestedAt: Date.parse('2026-10-16T14:04:20.000Z'),
      }),
      run({
        id: 'earlier',
        title: 'Create title from body',
        instructionKey: 'earlier-key',
        requestedAt: Date.parse('2026-10-16T14:04:14.000Z'),
      }),
    ]

    const enriched = enrichInstructionTasks(tasks, runs, 'doc-1')

    expect(enriched.find((item) => item._key === 'first')).toMatchObject({
      title: 'Create title from body',
      instructionKey: 'earlier-key',
    })
    expect(enriched.find((item) => item._key === 'second')).toMatchObject({
      title: 'Improve',
      instructionKey: 'later-key',
    })
  })

  test('falls back to the type path when the task path is not the concrete path', () => {
    const [enriched] = enrichInstructionTasks(
      [task({path: 'items[_key:item].title'})],
      [
        run({
          path: 'items[_key=="abc"].title',
          typePath: 'items[_key:item].title',
        }),
      ],
      'doc-1',
    )

    expect(enriched?.title).toBe('Create title from body')
  })

  test('prefers an exact path match over an older type-path match', () => {
    const [enriched] = enrichInstructionTasks(
      [task()],
      [
        run({
          id: 'typed',
          path: 'items[_key=="abc"].title',
          typePath: 'title',
          title: 'Wrong instruction',
          instructionKey: 'wrong',
          requestedAt: requestedAt - 1_000,
        }),
        run({id: 'exact', title: 'Create title from body'}),
      ],
      'doc-1',
    )

    expect(enriched?.title).toBe('Create title from body')
  })

  test('ignores a run that started too long before the task', () => {
    const [enriched] = enrichInstructionTasks(
      [task()],
      [run({requestedAt: Date.parse(started) - 61_000})],
      'doc-1',
    )

    expect(enriched?.title).toBeUndefined()
  })

  test('accepts a small clock skew where the task timestamp precedes the click', () => {
    const [enriched] = enrichInstructionTasks(
      [task()],
      [run({requestedAt: Date.parse(started) + 5_000})],
      'doc-1',
    )

    expect(enriched?.title).toBe('Create title from body')
  })
})
