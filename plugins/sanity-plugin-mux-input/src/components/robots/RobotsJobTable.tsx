import {Box, Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'

import {workflowLabel} from '../../robots/catalog'
import {formatTimestamp} from '../../robots/format'
import {
  jobTableRows,
  type PendingCreateRow,
  type RobotsJobDetailState,
  unitsCell,
} from '../../robots/records'
import type {RobotsJob} from '../../robots/types'
import {RobotsNote} from './RobotsNote'
import {RobotsStatusBadge} from './RobotsStatusBadge'

export interface RobotsJobTableProps {
  jobs: RobotsJob[]
  /** Job creates still pending, shown until each becomes its job. */
  pendingRows: PendingCreateRow[]
  detailedJobIds: ReadonlySet<string>
  failedDetailIds: ReadonlySet<string>
  loadingDetailIds: ReadonlySet<string>
  pendingDetailIds: ReadonlySet<string>
  cancellingJobIds: ReadonlySet<string>
  /** Absent for someone who can't run Robots: no row offers Cancel. */
  onCancel?: ((job: RobotsJob) => void) | undefined
  onViewOutput: (job: RobotsJob) => void
  onLoadDetail: (job: RobotsJob) => void
  /** Whether an unconfirmed row can point at the note above, which only runners see. */
  pointsToNote: boolean
  isLoading: boolean
}

export function detailStateOf(
  job: RobotsJob,
  detailedJobIds: ReadonlySet<string>,
  failedDetailIds: ReadonlySet<string>,
): RobotsJobDetailState {
  if (detailedJobIds.has(job.id)) return 'loaded'
  return failedDetailIds.has(job.id) ? 'unreadable' : 'unread'
}

function JobRow({job, ...props}: {job: RobotsJob} & RobotsJobTableProps) {
  const units = unitsCell(job, detailStateOf(job, props.detailedJobIds, props.failedDetailIds))
  const isLoadingUnits =
    props.loadingDetailIds.has(job.id) || (units.isLoadable && props.pendingDetailIds.has(job.id))
  const isRunning = job.status === 'pending' || job.status === 'processing'

  let action = (
    <Button
      text="View output"
      mode="ghost"
      fontSize={1}
      padding={2}
      onClick={() => props.onViewOutput(job)}
    />
  )
  if (isRunning) {
    action = props.onCancel ? (
      <Button
        text="Cancel"
        mode="ghost"
        tone="critical"
        fontSize={1}
        padding={2}
        loading={props.cancellingJobIds.has(job.id)}
        onClick={() => props.onCancel?.(job)}
      />
    ) : (
      <Text size={1} muted>
        Output appears when it finishes
      </Text>
    )
  } else if (job.status === 'cancelled') {
    action = (
      <Text size={1} muted>
        Cancelled before it produced output
      </Text>
    )
  }

  return (
    <Card padding={3} radius={2} border>
      <Flex align="center" gap={3} wrap="wrap">
        <Stack gap={2} flex={1} style={{minWidth: '10rem'}}>
          <Text size={1} weight="semibold">
            {workflowLabel(job.workflow)}
          </Text>
          <Flex align="center" gap={1} wrap="wrap">
            <Text size={1} muted>
              {formatTimestamp(job.created_at)} · AI units:
            </Text>
            {units.isLoadable ? (
              <Button
                text={isLoadingUnits ? 'Loading…' : units.label}
                mode="bleed"
                tone="primary"
                fontSize={1}
                padding={1}
                disabled={isLoadingUnits}
                onClick={() => props.onLoadDetail(job)}
              />
            ) : (
              <Text size={1} muted>
                {units.label}
              </Text>
            )}
          </Flex>
        </Stack>
        <RobotsStatusBadge kind="job" status={job.status} />
        <Box>{action}</Box>
      </Flex>
    </Card>
  )
}

function PendingRow({row, pointsToNote}: {row: PendingCreateRow; pointsToNote: boolean}) {
  return (
    <Card padding={3} radius={2} border tone="transparent">
      <Flex align="center" gap={3} wrap="wrap">
        <Stack gap={2} flex={1} style={{minWidth: '10rem'}}>
          <Text size={1} weight="semibold">
            {workflowLabel(row.pending.workflow ?? '')}
          </Text>
          <Text size={1} muted>
            Requested {formatTimestamp(row.pending.requestedAt)}
          </Text>
        </Stack>
        <RobotsStatusBadge kind="create" status={row.phase} />
        <Text size={1} muted>
          {row.phase === 'unconfirmed' && pointsToNote ? 'See the note above' : 'Waiting for Mux'}
        </Text>
      </Flex>
    </Card>
  )
}

/** The jobs on this video, newest first, with the creates still waiting for Mux. */
export function RobotsJobTable(props: RobotsJobTableProps) {
  if (props.isLoading) {
    return (
      <Flex align="center" gap={2} padding={3}>
        <Spinner muted />
        <Text size={1} muted>
          Loading Robots jobs…
        </Text>
      </Flex>
    )
  }

  const rows = jobTableRows(props.pendingRows, props.jobs)
  if (rows.length === 0) return <RobotsNote>No Robots jobs have run on this video yet.</RobotsNote>

  return (
    <Stack gap={2}>
      {rows.map((row) =>
        row.pending ? (
          <PendingRow key={row.key} row={row.pending} pointsToNote={props.pointsToNote} />
        ) : (
          <JobRow key={row.key} job={row.item} {...props} />
        ),
      )}
    </Stack>
  )
}
