import {PlayIcon} from '@sanity/icons/Play'
import {Box, Flex, Select, Stack, Text} from '@sanity/ui'
import {useId, useState} from 'react'

import {type RobotsDirectiveListing, v0DirectiveIds} from '../../hooks/useRobotsDirectives'
import {ROBOTS_DIRECTIVES_DOCS_URL, ROBOTS_DIRECTIVES_MIGRATION_URL} from '../../robots/capability'
import type {PendingCreateRow} from '../../robots/records'
import type {RobotsDirective, RobotsDirectiveRun, RobotsJob} from '../../robots/types'
import {RobotsDirectiveRunTable} from './RobotsDirectiveRunTable'
import {RobotsNote} from './RobotsNote'
import {RobotsReasonButton} from './RobotsReasonButton'
import {RobotsUnconfirmedNote} from './RobotsUnconfirmedNote'

/** Robots v0 directives still run on uploads that attach them, but never from here. */
function V0DirectivesNote({
  configuredV0Ids,
  directiveNames,
}: {
  configuredV0Ids: string[]
  directiveNames: Record<string, string>
}) {
  const names = configuredV0Ids.map((directiveId) => directiveNames[directiveId] ?? directiveId)
  return (
    <RobotsNote
      tone="caution"
      action={
        <Text size={1}>
          <a href={ROBOTS_DIRECTIVES_MIGRATION_URL} target="_blank" rel="noopener noreferrer">
            How to move a directive to v1
          </a>
        </Text>
      }
    >
      Directives made with Robots v0, which Mux is retiring, can’t be run from the Studio. To run
      one, open it in the Mux dashboard and choose Create v1 copy.
      {names.length > 0 && (
        <>
          {' '}
          New uploads still run {names.join(', ')} on v0 until a developer puts{' '}
          {names.length === 1 ? 'its v1 copy' : 'their v1 copies'} in{' '}
          <code>defaultDirectiveIds</code>.
        </>
      )}
    </RobotsNote>
  )
}

function directivePrompt(listing: RobotsDirectiveListing, available: RobotsDirective[]): string {
  if (listing.status === 'pending') return 'Loading directives…'
  if (available.length > 0) return 'Select a directive'
  return listing.status === 'loaded'
    ? 'No directives in this Mux account'
    : 'Could not list directives'
}

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
  jobsById,
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
  jobsById: ReadonlyMap<string, RobotsJob>
  onRun: (directiveId: string) => void
  onClearUnconfirmed: () => void
  onViewJob: (jobId: string) => void
}) {
  const id = useId()
  const [selectedId, setSelectedId] = useState('')
  const available: RobotsDirective[] =
    listing.status === 'loaded'
      ? listing.directives
      : listing.status === 'failed'
        ? configuredIds.map((directiveId) => ({id: directiveId}))
        : []
  const v0Ids = new Set(v0DirectiveIds(listing))
  // Drop a choice the latest listing no longer offers, or offers as v0: running it would 404.
  const chosenId = available.some(
    (directive) => directive.id === selectedId && !v0Ids.has(directive.id),
  )
    ? selectedId
    : ''

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
          {v0Ids.size > 0 && (
            <V0DirectivesNote
              configuredV0Ids={configuredIds.filter((directiveId) => v0Ids.has(directiveId))}
              directiveNames={directiveNames}
            />
          )}
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
                  <option
                    key={directive.id}
                    value={directive.id}
                    disabled={v0Ids.has(directive.id)}
                  >
                    {v0Ids.has(directive.id)
                      ? `${directive.name || directive.id} (Robots v0)`
                      : directive.name || directive.id}
                  </option>
                ))}
              </Select>
            </Box>
            <RobotsReasonButton
              icon={PlayIcon}
              text="Run directive"
              mode="ghost"
              disabledReason={
                runDisabledReason ?? (chosenId ? undefined : 'Pick a directive first.')
              }
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
        jobsById={jobsById}
        onViewJob={onViewJob}
      />
    </Stack>
  )
}
