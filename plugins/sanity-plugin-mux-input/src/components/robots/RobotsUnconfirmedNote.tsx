import {Box, Button} from '@sanity/ui'

import {workflowLabel} from '../../robots/catalog'
import {formatTimeOfDay} from '../../robots/format'
import type {PendingCreateRow} from '../../robots/records'
import {RobotsNote} from './RobotsNote'

const NO_NAMES: Record<string, string> = {}

function unconfirmedText(rows: PendingCreateRow[], directiveNames: Record<string, string>): string {
  const [only] = rows
  const isDirective = only?.pending.kind === 'directive-run'
  const refusal = isDirective
    ? 'Mux refuses another run of that directive on this video while one is going.'
    : 'Mux refuses an identical run while one is going.'
  if (!only || rows.length > 1) {
    return `Mux hasn’t confirmed ${rows.length} ${isDirective ? 'directive runs' : 'runs'} on this video. They may already be running and billing, so nothing was retried. ${refusal}`
  }
  const what = isDirective
    ? `the run of ${directiveNames[only.pending.directiveId ?? ''] ?? only.pending.directiveId}`
    : `the ${workflowLabel(only.pending.workflow ?? '')} run`
  return `Mux hasn’t confirmed ${what}, requested at ${formatTimeOfDay(only.pending.requestedAt)}. It may already be running and billing, so nothing was retried. ${refusal}`
}

/** The note the Not confirmed rows point to. Its button clears exactly those rows. */
export function RobotsUnconfirmedNote({
  rows,
  directiveNames = NO_NAMES,
  onClear,
}: {
  rows: PendingCreateRow[]
  directiveNames?: Record<string, string>
  onClear: () => void
}) {
  if (rows.length === 0) return null
  return (
    <RobotsNote
      tone="caution"
      action={
        <Box>
          <Button
            text="Nothing is running — let me try again"
            mode="ghost"
            fontSize={1}
            padding={2}
            onClick={onClear}
          />
        </Box>
      }
    >
      {unconfirmedText(rows, directiveNames)}
    </RobotsNote>
  )
}
