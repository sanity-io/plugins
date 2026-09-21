// @vitest-environment jsdom
import {act, renderHook} from '@testing-library/react'
import {PatchEvent} from 'sanity'
import {describe, expect, test, vi} from 'vitest'

import {useDraftDelayedTask} from './useDraftDelayedTask'

interface DocumentState {
  isDocAssistable: boolean
  isSyncing?: boolean
}

const TASK_ARGS = {path: 'featuredImage.alt', documentId: 'drafts.article-1'}

function setup(initial: DocumentState) {
  const task = vi.fn()
  const documentOnChange = vi.fn()
  const hook = renderHook(
    (state: DocumentState) => useDraftDelayedTask({...state, task, documentOnChange}),
    {initialProps: initial},
  )
  const request = () => act(() => hook.result.current(TASK_ARGS))
  const update = (state: DocumentState) => hook.rerender(state)
  return {task, documentOnChange, request, update}
}

function expectEmptyOnChange(documentOnChange: ReturnType<typeof vi.fn>, times: number) {
  expect(documentOnChange).toHaveBeenCalledTimes(times)
  for (const [event] of documentOnChange.mock.calls) {
    expect(event).toBeInstanceOf(PatchEvent)
    expect(event.patches).toEqual([])
  }
}

describe('useDraftDelayedTask', () => {
  test('runs synchronously when a real draft exists and nothing is syncing', () => {
    const {task, documentOnChange, request} = setup({isDocAssistable: true, isSyncing: false})

    request()

    expect(task).toHaveBeenCalledExactlyOnceWith(TASK_ARGS)
    expect(documentOnChange).not.toHaveBeenCalled()
  })

  test('materializes a missing draft with an empty onChange and runs after the commit finishes', () => {
    const {task, documentOnChange, request, update} = setup({isDocAssistable: false})

    request()
    expectEmptyOnChange(documentOnChange, 1)
    expect(task).not.toHaveBeenCalled()

    update({isDocAssistable: true, isSyncing: true})
    expect(task).not.toHaveBeenCalled()
    expectEmptyOnChange(documentOnChange, 1)

    update({isDocAssistable: true, isSyncing: false})
    expect(task).toHaveBeenCalledExactlyOnceWith(TASK_ARGS)
  })

  test('does not run on an optimistic draft before a commit has been observed', () => {
    const {task, request, update} = setup({isDocAssistable: false})

    request()
    update({isDocAssistable: true, isSyncing: false})
    expect(task).not.toHaveBeenCalled()

    update({isDocAssistable: true, isSyncing: true})
    update({isDocAssistable: true, isSyncing: false})
    expect(task).toHaveBeenCalledExactlyOnceWith(TASK_ARGS)
  })

  test('waits for an existing draft to finish syncing without another onChange', () => {
    const {task, documentOnChange, request, update} = setup({
      isDocAssistable: true,
      isSyncing: true,
    })

    request()
    expect(documentOnChange).not.toHaveBeenCalled()
    expect(task).not.toHaveBeenCalled()

    update({isDocAssistable: true, isSyncing: false})
    expect(task).toHaveBeenCalledExactlyOnceWith(TASK_ARGS)
    expect(documentOnChange).not.toHaveBeenCalled()
  })

  test('re-materializes when the draft disappears while the task is queued', () => {
    const {task, documentOnChange, request, update} = setup({
      isDocAssistable: true,
      isSyncing: true,
    })

    request()
    // the sync that was in flight was a publish: the draft is gone once it lands
    update({isDocAssistable: false, isSyncing: false})
    expectEmptyOnChange(documentOnChange, 1)
    expect(task).not.toHaveBeenCalled()

    update({isDocAssistable: true, isSyncing: true})
    update({isDocAssistable: true, isSyncing: false})
    expect(task).toHaveBeenCalledExactlyOnceWith(TASK_ARGS)
  })

  test('gives up after two materialization attempts', () => {
    const {task, documentOnChange, request, update} = setup({isDocAssistable: false})

    request()
    expectEmptyOnChange(documentOnChange, 1)

    update({isDocAssistable: false, isSyncing: true})
    update({isDocAssistable: false, isSyncing: false})
    expectEmptyOnChange(documentOnChange, 2)

    update({isDocAssistable: false, isSyncing: true})
    update({isDocAssistable: false, isSyncing: false})
    expectEmptyOnChange(documentOnChange, 2)

    // the queue was dropped: a draft showing up later does not run the stale task
    update({isDocAssistable: true, isSyncing: false})
    expect(task).not.toHaveBeenCalled()
  })

  test('drops the task when Studio refuses the onChange (read-only document)', () => {
    const {task, documentOnChange, request, update} = setup({isDocAssistable: false})
    documentOnChange.mockImplementation(() => {
      throw new Error('Attempted to patch a read-only document')
    })

    expect(() => request()).not.toThrow()
    expect(documentOnChange).toHaveBeenCalledTimes(1)

    update({isDocAssistable: true, isSyncing: false})
    expect(task).not.toHaveBeenCalled()
  })

  test('the latest request replaces a queued one', () => {
    const {task, request, update} = setup({isDocAssistable: true, isSyncing: true})

    request()
    request()

    update({isDocAssistable: true, isSyncing: false})
    expect(task).toHaveBeenCalledTimes(1)
  })
})
