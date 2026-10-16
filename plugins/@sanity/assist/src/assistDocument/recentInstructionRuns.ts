import {useEffect} from 'react'
import {typed, useClient} from 'sanity'

import {randomKey} from '../_lib/randomKey'
import {maxHistoryVisibilityMs} from '../constants'
import {assistTasksStatusId} from '../helpers/ids'
import type {AssistTasksStatus, InstructionTask} from '../types'

export interface RecentInstructionRun {
  id: string
  documentId: string
  path: string
  typePath?: string
  instructionKey: string
  title?: string
  requestedAt: number
}

/**
 * Custom instruction runs succeed without `title` or `instructionKey` on the
 * task document (built-in actions such as image description still write both).
 * The completion toast and run history resolve the label from those fields, so
 * a custom instruction otherwise shows up as "Untitled".
 *
 * The run request already knows the instruction. Remember it here, copy it
 * onto the task the studio is showing, and write the same fields back once the
 * task has finished so a later session can still read them.
 */

const STORAGE_KEY = 'sanity.assist.recent-instruction-runs'
const STARTED_CLOCK_SKEW_MS = 15_000
const START_WINDOW_MS = 60_000
const MAX_REMEMBERED_RUNS = 50

const backfilledTaskIds = new Set<string>()
let memory: RecentInstructionRun[] | undefined

export function recordRecentInstructionRun(run: Omit<RecentInstructionRun, 'id'>): string {
  const next = remember({...run, id: randomKey(12)})
  return next.id
}

export function discardRecentInstructionRun(id: string) {
  const current = getRecentInstructionRuns()
  const next = current.filter((run) => run.id !== id)
  if (next.length === current.length) return
  memory = next
  persist(next)
}

export function getRecentInstructionRuns(): RecentInstructionRun[] {
  const merged = mergeRuns(memory ?? [], readStorage())
  memory = fresh(merged)
  return memory
}

export function enrichInstructionTasks(
  tasks: InstructionTask[],
  runs: RecentInstructionRun[],
  documentId: string,
): InstructionTask[] {
  const matches = matchRecentInstructionRuns(tasks, runs, documentId)
  if (matches.size === 0) return tasks
  return tasks.map((task) => {
    const run = matches.get(task._key)
    if (!run) return task
    return {
      ...task,
      instructionKey: task.instructionKey ?? run.instructionKey,
      title: task.title ?? run.title,
    }
  })
}

function matchRecentInstructionRuns(
  tasks: InstructionTask[],
  runs: RecentInstructionRun[],
  documentId: string,
): Map<string, RecentInstructionRun> {
  const statusId = assistTasksStatusId(documentId)
  const available = runs
    .filter((run) => assistTasksStatusId(run.documentId) === statusId)
    .toSorted((a, b) => a.requestedAt - b.requestedAt)
  const matches = new Map<string, RecentInstructionRun>()

  const pending = tasks
    .filter((task) => task.started && !task.instructionKey && !task.title)
    .toSorted((a, b) => new Date(a.started ?? 0).getTime() - new Date(b.started ?? 0).getTime())

  for (const task of pending) {
    const started = new Date(task.started ?? 0).getTime()
    if (!Number.isFinite(started)) continue
    const index = findRunIndex(available, task, started)
    if (index === -1) continue
    const run = available[index]
    if (!run) continue
    available.splice(index, 1)
    matches.set(task._key, run)
  }

  return matches
}

export function useBackfillInstructionTaskMeta(
  documentId: string,
  tasks: InstructionTask[] | undefined,
) {
  const client = useClient({apiVersion: '2023-01-01'})

  useEffect(() => {
    if (!documentId || !tasks?.length) return

    const matches = matchRecentInstructionRuns(tasks, getRecentInstructionRuns(), documentId)
    const patch: Record<string, string> = {}
    const ids: string[] = []

    for (const [taskKey, run] of matches) {
      if (!isSafeKey(taskKey)) continue
      const task = tasks.find((item) => item._key === taskKey)
      if (!task?.ended) continue

      const id = `${assistTasksStatusId(documentId)}:${taskKey}`
      if (backfilledTaskIds.has(id)) continue
      backfilledTaskIds.add(id)
      ids.push(id)

      const base = `${typed<keyof AssistTasksStatus>('tasks')}[_key=="${taskKey}"]`
      if (!task.instructionKey) {
        patch[`${base}.${typed<keyof InstructionTask>('instructionKey')}`] = run.instructionKey
      }
      if (!task.title && run.title) {
        patch[`${base}.${typed<keyof InstructionTask>('title')}`] = run.title
      }
    }

    if (Object.keys(patch).length === 0) return

    void client
      .patch(assistTasksStatusId(documentId))
      .set(patch)
      .commit()
      .catch((error: unknown) => {
        for (const id of ids) backfilledTaskIds.delete(id)
        console.error(error)
      })
  }, [client, documentId, tasks])
}

function findRunIndex(runs: RecentInstructionRun[], task: InstructionTask, started: number) {
  const exact = runs.findIndex((run) => run.path === task.path && withinWindow(run, started))
  if (exact !== -1) return exact
  return runs.findIndex(
    (run) =>
      !!run.typePath &&
      run.typePath !== run.path &&
      run.typePath === task.path &&
      withinWindow(run, started),
  )
}

function withinWindow(run: RecentInstructionRun, started: number) {
  return (
    started >= run.requestedAt - STARTED_CLOCK_SKEW_MS &&
    started - run.requestedAt <= START_WINDOW_MS
  )
}

function remember(run: RecentInstructionRun) {
  const next = fresh(mergeRuns(getRecentInstructionRuns(), [run]))
  memory = next
  persist(next)
  return run
}

function fresh(runs: RecentInstructionRun[], now = Date.now()) {
  return runs
    .filter((run) => now - run.requestedAt < maxHistoryVisibilityMs)
    .toSorted((a, b) => a.requestedAt - b.requestedAt)
    .slice(-MAX_REMEMBERED_RUNS)
}

function mergeRuns(left: RecentInstructionRun[], right: RecentInstructionRun[]) {
  const byId = new Map<string, RecentInstructionRun>()
  for (const run of [...left, ...right]) byId.set(run.id, run)
  return [...byId.values()]
}

function readStorage(): RecentInstructionRun[] {
  try {
    if (typeof localStorage === 'undefined') return []
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isRecentInstructionRun)
  } catch {
    return []
  }
}

function persist(runs: RecentInstructionRun[]) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs))
  } catch {
    // Private mode or a full quota. The in-memory list still covers this tab.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isRecentInstructionRun(value: unknown): value is RecentInstructionRun {
  if (!isRecord(value)) return false
  return (
    typeof value['id'] === 'string' &&
    typeof value['documentId'] === 'string' &&
    typeof value['path'] === 'string' &&
    typeof value['instructionKey'] === 'string' &&
    typeof value['requestedAt'] === 'number' &&
    (value['title'] === undefined || typeof value['title'] === 'string') &&
    (value['typePath'] === undefined || typeof value['typePath'] === 'string')
  )
}

function isSafeKey(key: string) {
  return /^[A-Za-z0-9_-]+$/.test(key)
}
