import {PlayIcon} from '@sanity/icons/Play'
import {Box, Button, Flex, Select, Stack, Text} from '@sanity/ui'
import {useId, useState} from 'react'

import type {RobotsDirectiveListing} from '../../hooks/useRobotsDirectives'
import {ROBOTS_DIRECTIVES_DOCS_URL} from '../../robots/capability'
import type {PendingCreateRow} from '../../robots/records'
import type {RobotsDirective, RobotsDirectiveRun} from '../../robots/types'
import {RobotsDirectiveRunTable} from './RobotsDirectiveRunTable'
import {RobotsUnconfirmedNote} from './RobotsUnconfirmedNote'

function directivePrompt(listing: RobotsDirectiveListing, available: RobotsDirective[]): string {
  if (listing.status === 'pending') return 'Loading directives…'
  if (available.length > 0) return 'Select a directive'
  return listing.status === 'loaded'
    ? 'No directives in this Mux account'
    : 'Could not list directives'
}

/** Directive runs on this video, and, for runners, a way to start one. */
export function RobotsDirectivesSection({
  canRun,
  listing,
  configuredIds,
  directiveNames,
  runs,
  pendingRows,
  unconfirmedRows,
  isLoading,
  runDisabledReason,
  viewableJobIds,
  onRun,
  onClearUnconfirmed,
  onViewJob,
}: {
  canRun: boolean
  listing: RobotsDirectiveListing
  configuredIds: string[]
  directiveNames: Record<string, string>
  runs: RobotsDirectiveRun[]
  pendingRows: PendingCreateRow[]
  unconfirmedRows: PendingCreateRow[]
  isLoading: boolean
  runDisabledReason?: string | undefined
  viewableJobIds: ReadonlySet<string>
  onRun: (directiveId: string) => void
  onClearUnconfirmed: () => void
  onViewJob: (jobId: string) => void
}) {
  const id = useId()
  const [selectedId, setSelectedId] = useState('')
  // A failed listing falls back to the configured ids.
  const available: RobotsDirective[] =
    listing.status === 'loaded'
      ? listing.directives
      : listing.status === 'failed'
        ? configuredIds.map((directiveId) => ({id: directiveId}))
        : []
  // A choice the latest listing no longer offers is no choice: running it would be a 404.
  const chosenId = available.some((directive) => directive.id === selectedId) ? selectedId : ''

  return (
    <Stack gap={3}>
      <Stack gap={2}>
        <Text size={1} weight="semibold">
          Directives
        </Text>
        <Text size={1} muted>
          A directive runs several workflows in order.{' '}
          <a href={ROBOTS_DIRECTIVES_DOCS_URL} target="_blank" rel="noopener noreferrer">
            Author them in Mux
          </a>
          .
        </Text>
      </Stack>

      {canRun && (
        <>
          <Flex gap={2} align="center" wrap="wrap">
            <Box flex={1} style={{minWidth: '12rem'}}>
              <Select
                id={`robots-directive${id}`}
                aria-label="Directive"
                value={chosenId}
                disabled={available.length === 0}
                onChange={(event) => setSelectedId(event.currentTarget.value)}
              >
                <option value="">{directivePrompt(listing, available)}</option>
                {available.map((directive) => (
                  <option key={directive.id} value={directive.id}>
                    {directive.name || directive.id}
                  </option>
                ))}
              </Select>
            </Box>
            <Button
              icon={PlayIcon}
              text="Run directive"
              mode="ghost"
              disabled={!chosenId || !!runDisabledReason}
              title={runDisabledReason}
              onClick={() => onRun(chosenId)}
            />
          </Flex>
          <RobotsUnconfirmedNote
            rows={unconfirmedRows}
            directiveNames={directiveNames}
            onClear={onClearUnconfirmed}
          />
        </>
      )}

      <RobotsDirectiveRunTable
        runs={runs}
        pendingRows={pendingRows}
        directiveNames={directiveNames}
        pointsToNote={canRun}
        isLoading={isLoading}
        viewableJobIds={viewableJobIds}
        onViewJob={onViewJob}
      />
    </Stack>
  )
}
