import {formatSeconds} from '../util/formatSeconds'
import {workflowLabel} from './catalog'
import type {RobotsDirectiveRunStatus, RobotsNodeState} from './types'

/** Formatting shared by the Robots views. Every one renders an em dash for "no value". */

export const EM_DASH = '—'

/** Robots timestamps are Unix seconds. */
export function formatTimestamp(seconds?: number): string {
  return seconds ? new Date(seconds * 1000).toLocaleString() : EM_DASH
}

export function formatTimeOfDay(seconds: number): string {
  return new Date(seconds * 1000).toLocaleTimeString()
}

/** An offset in seconds, as `m:ss`. */
export function formatOffset(seconds: unknown): string {
  return typeof seconds === 'number' ? formatSeconds(seconds) : EM_DASH
}

/** An offset in milliseconds, as `m:ss`. */
export function formatOffsetMs(ms: unknown): string {
  return typeof ms === 'number' ? formatSeconds(ms / 1000) : EM_DASH
}

/** A model's 0–1 score, at the two decimals Mux reports. */
export function formatScore(score: unknown): string {
  return typeof score === 'number' ? score.toFixed(2) : EM_DASH
}

export function formatText(value: unknown): string {
  return value === undefined || value === null || value === '' ? EM_DASH : String(value)
}

/** An output key that should hold a list of objects. */
export function asRows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
    : []
}

/** An output key that should hold a list of strings. */
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
  if (node.status === 'waiting_for_resources') return 'Waiting for resources'
  if (node.status === 'dispatched') return 'Dispatched'
  return EM_DASH
}

/** A final run status that needs words beside its badge. */
export function runStatusNote(status: RobotsDirectiveRunStatus | undefined): string | undefined {
  return status === 'partial' ? 'Some workflows finished and others failed.' : undefined
}
