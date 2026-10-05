import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronUpIcon} from '@sanity/icons/ChevronUp'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {useState} from 'react'

import {workflowLabel} from '../../robots/catalog'
import {EM_DASH, formatTimestamp, nodeStateDetail, runStatusNote} from '../../robots/format'
import {type PendingCreateRow, runTableRows} from '../../robots/records'
import type {RobotsDirectiveRun, RobotsNodeState} from '../../robots/types'
import {RobotsNote} from './RobotsNote'
import {RobotsStatusBadge} from './RobotsStatusBadge'

function NodeStates({
  nodeStates,
  viewableJobIds,
  onViewJob,
}: {
  nodeStates: RobotsNodeState[]
  viewableJobIds: ReadonlySet<string>
  onViewJob: (jobId: string) => void
}) {
  return (
    <Stack gap={2}>
      {nodeStates.map((node, index) => (
        <Flex key={node.job_id ?? node.reference_id ?? index} align="center" gap={3} wrap="wrap">
          <Box flex={1} style={{minWidth: '8rem'}}>
            <Text size={1}>
              {node.workflow_name
                ? workflowLabel(node.workflow_name)
                : (node.reference_id ?? `Step ${index + 1}`)}
            </Text>
          </Box>
          <RobotsStatusBadge kind="node" status={node.status} />
          {node.job_id && viewableJobIds.has(node.job_id) ? (
            <Button
              text="View job"
              mode="bleed"
              fontSize={1}
              padding={2}
              onClick={() => onViewJob(node.job_id!)}
            />
          ) : (
            <Text size={1} muted>
              {nodeStateDetail(node)}
            </Text>
          )}
        </Flex>
      ))}
    </Stack>
  )
}

function RunRow({
  run,
  name,
  viewableJobIds,
  onViewJob,
}: {
  run: RobotsDirectiveRun
  name: string
  viewableJobIds: ReadonlySet<string>
  onViewJob: (jobId: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const nodeStates = run.node_states ?? []
  return (
    <Card padding={3} radius={2} border>
      <Stack gap={3}>
        <Flex align="center" gap={3} wrap="wrap">
          <Stack gap={2} flex={1} style={{minWidth: '10rem'}}>
            <Text size={1} weight="semibold" style={{wordBreak: 'break-word'}}>
              {name}
            </Text>
            <Text size={1} muted>
              {formatTimestamp(run.started_at)} · {nodeStates.length} steps
            </Text>
          </Stack>
          <RobotsStatusBadge kind="run" status={run.status} />
          <Button
            icon={isExpanded ? ChevronUpIcon : ChevronDownIcon}
            mode="bleed"
            padding={2}
            aria-label={isExpanded ? 'Hide steps' : 'Show steps'}
            disabled={nodeStates.length === 0}
            onClick={() => setIsExpanded(!isExpanded)}
          />
        </Flex>
        {runStatusNote(run.status) && (
          <Text size={1} muted>
            {runStatusNote(run.status)}
          </Text>
        )}
        {isExpanded && (
          <NodeStates
            nodeStates={nodeStates}
            viewableJobIds={viewableJobIds}
            onViewJob={onViewJob}
          />
        )}
      </Stack>
    </Card>
  )
}

export function RobotsDirectiveRunTable({
  runs,
  pendingRows,
  directiveNames,
  pointsToNote,
  isLoading,
  viewableJobIds,
  onViewJob,
}: {
  runs: RobotsDirectiveRun[]
  pendingRows: PendingCreateRow[]
  directiveNames: Record<string, string>
  pointsToNote: boolean
  isLoading: boolean
  /** Jobs the panel lists, which a dispatched step can open. */
  viewableJobIds: ReadonlySet<string>
  onViewJob: (jobId: string) => void
}) {
  const rows = runTableRows(pendingRows, runs)
  const nameOf = (directiveId?: string) =>
    directiveNames[directiveId ?? ''] ?? directiveId ?? EM_DASH

  if (rows.length === 0) {
    return (
      <RobotsNote>
        {isLoading ? 'Loading directive runs…' : 'No directive runs for this video yet.'}
      </RobotsNote>
    )
  }

  return (
    <Stack gap={2}>
      {rows.map((row) =>
        row.pending ? (
          <Card key={row.key} padding={3} radius={2} border tone="transparent">
            <Flex align="center" gap={3} wrap="wrap">
              <Stack gap={2} flex={1} style={{minWidth: '10rem'}}>
                <Text size={1} weight="semibold" style={{wordBreak: 'break-word'}}>
                  {nameOf(row.pending.pending.directiveId)}
                </Text>
                <Text size={1} muted>
                  Requested {formatTimestamp(row.pending.pending.requestedAt)}
                </Text>
              </Stack>
              <RobotsStatusBadge kind="create" status={row.pending.phase} />
              <Text size={1} muted>
                {row.pending.phase === 'unconfirmed' && pointsToNote
                  ? 'See the note above'
                  : 'Waiting for Mux'}
              </Text>
            </Flex>
          </Card>
        ) : (
          <RunRow
            key={row.key}
            run={row.item}
            name={nameOf(row.item.directive_id)}
            viewableJobIds={viewableJobIds}
            onViewJob={onViewJob}
          />
        ),
      )}
    </Stack>
  )
}
