import {formatSeconds} from '../util/formatSeconds'
import {workflowLabel} from './catalog'
import type {RobotsDirectiveRunStatus, RobotsNodeState} from './types'

export const EM_DASH = '—'

/** Robots timestamps are Unix seconds. */
export function formatTimestamp(seconds?: number): string {
  return seconds ? new Date(seconds * 1000).toLocaleString() : EM_DASH
}

export function formatTimeOfDay(seconds: number): string {
  return new Date(seconds * 1000).toLocaleTimeString()
}

export function formatOffset(seconds: unknown): string {
  return typeof seconds === 'number' ? formatSeconds(seconds) : EM_DASH
}

export function formatOffsetMs(ms: unknown): string {
  return typeof ms === 'number' ? formatSeconds(ms / 1000) : EM_DASH
}

/**
 * A media time from a v1 field in seconds or its v0 counterpart in milliseconds. Read by key,
 * never by version, so a time is never converted twice.
 */
export function formatMediaTime(seconds: unknown, ms: unknown): string {
  return typeof seconds === 'number' ? formatOffset(seconds) : formatOffsetMs(ms)
}

/** `start_time`–`end_time` (v1, seconds) or `start_ms`–`end_ms` (v0). */
export function formatMediaSpan(row: Record<string, unknown>): string {
  const start = formatMediaTime(row['start_time'], row['start_ms'])
  const end = formatMediaTime(row['end_time'], row['end_ms'])
  return `${start} – ${end}`
}

/** A model's 0–1 score, at the two decimals Mux reports. */
export function formatScore(score: unknown): string {
  return typeof score === 'number' ? score.toFixed(2) : EM_DASH
}

export function formatText(value: unknown): string {
  return value === undefined || value === null || value === '' ? EM_DASH : String(value)
}

export function asRows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
    : []
}

export function asStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : []
}

/** What a directive run's step says beside its status. */
export function nodeStateDetail(node: RobotsNodeState): string {
  if (node.reason) return node.reason
  if (node.source_workflows?.length) {
    return `Waiting on ${node.source_workflows.map(workflowLabel).join(', ')}`
  }
  // Binding reference ids, which the directive's author named: shown as they are.
  if (node.source_bindings?.length) return `Waiting on ${node.source_bindings.join(', ')}`
  if (node.status === 'waiting_for_resources') return 'Waiting for a resource, such as captions'
  if (node.status === 'dispatched') return 'Dispatched'
  return EM_DASH
}

/** How many steps a run has, before Mux has listed any. */
export function stepCountLabel(count: number): string {
  if (count === 0) return 'No steps yet'
  return count === 1 ? '1 step' : `${count} steps`
}

/** A run status that needs words beside its badge. */
export function runStatusNote(status: RobotsDirectiveRunStatus | undefined): string | undefined {
  if (status === 'partial') return 'Some workflows finished and others failed.'
  // A directive whose workflows read captions stalls on a video that has none.
  if (status === 'waiting') {
    return 'Waiting for something this video doesn’t have yet, such as a caption track. The run goes on once it’s there.'
  }
  return undefined
}
