import {Badge, type BadgeTone} from '@sanity/ui'

import type {PendingCreateRowPhase} from '../../robots/records'
import type {RobotsDirectiveRunStatus, RobotsJobStatus, RobotsNodeStatus} from '../../robots/types'

/** One table for all four kinds, so equivalent states share a tone. */
const TONES: Record<'job' | 'run' | 'node' | 'create', Record<string, BadgeTone>> = {
  job: {
    pending: 'default',
    processing: 'primary',
    completed: 'positive',
    errored: 'critical',
    cancelled: 'default',
  } satisfies Record<RobotsJobStatus, BadgeTone>,
  run: {
    pending: 'default',
    dispatching: 'primary',
    running: 'primary',
    waiting: 'default',
    completed: 'positive',
    partial: 'caution',
    errored: 'critical',
  } satisfies Record<RobotsDirectiveRunStatus, BadgeTone>,
  node: {
    dispatched: 'primary',
    failed: 'critical',
    waiting_for_resources: 'default',
    waiting_for_source_workflow: 'default',
  } satisfies Record<RobotsNodeStatus, BadgeTone>,
  create: {starting: 'primary', unconfirmed: 'caution'} satisfies Record<
    PendingCreateRowPhase,
    BadgeTone
  >,
}

/** Create phases are the plugin's own, not Mux statuses, so they get proper labels. */
const CREATE_LABELS: Record<string, string> = {starting: 'Starting…', unconfirmed: 'Not confirmed'}

export function RobotsStatusBadge({
  kind,
  status,
}: {
  kind: keyof typeof TONES
  status?: string | undefined
}) {
  const value = status ?? (kind === 'run' ? 'pending' : 'unknown')
  const label = kind === 'create' ? (CREATE_LABELS[value] ?? value) : value.replaceAll('_', ' ')
  return (
    <Badge tone={TONES[kind][value] ?? 'default'} fontSize={1} padding={2}>
      {label}
    </Badge>
  )
}
