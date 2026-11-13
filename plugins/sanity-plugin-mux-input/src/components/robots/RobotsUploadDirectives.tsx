import {Box, Card, Checkbox, Flex, Stack, Text} from '@sanity/ui'
import {useId} from 'react'

import type {RobotsDirectiveListing} from '../../hooks/useRobotsDirectives'
import {ROBOTS_DIRECTIVES_SET_BY_DEVELOPER} from '../../robots/access'
import {ROBOTS_UPLOAD_DIRECTIVES_GUIDE_URL} from '../../robots/capability'
import FormField from '../FormField'
import {RobotsNote} from './RobotsNote'

function unavailableWarning(listing: RobotsDirectiveListing): string | undefined {
  if (listing.status !== 'failed') return undefined
  if (listing.capability?.state === 'scope-missing') {
    return 'This Mux token can’t run Robots, so these directives won’t run. The video still uploads.'
  }
  if (listing.capability?.state === 'not-enabled') {
    return 'Robots isn’t enabled for this Mux account, so these directives won’t run. The video still uploads.'
  }
  return undefined
}

/** Directives attach at asset creation, so the upload dialog is the only moment to opt out. */
export function RobotsUploadDirectives({
  configuredIds,
  missingIds,
  directiveNames,
  listing,
  uncheckedIds,
  isReadOnly,
  onToggle,
}: {
  configuredIds: string[]
  /** Configured ids the account doesn't have: shown, never attached. */
  missingIds: string[]
  directiveNames: Record<string, string>
  listing: RobotsDirectiveListing
  uncheckedIds: string[]
  /** Shows the directives without checkboxes; they still run. */
  isReadOnly: boolean
  onToggle: (directiveId: string, checked: boolean) => void
}) {
  const id = useId()
  const warning = unavailableWarning(listing)

  if (configuredIds.length === 0) {
    return (
      <FormField inputId={`robots-directives${id}`} title="Robots directives">
        <RobotsNote
          action={
            <Text size={1}>
              <a
                href={ROBOTS_UPLOAD_DIRECTIVES_GUIDE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                How to set up directives
              </a>
            </Text>
          }
        >
          No directives run on new uploads yet. A developer can add them with{' '}
          <code>defaultDirectiveIds</code> in the plugin configuration.
        </RobotsNote>
      </FormField>
    )
  }

  return (
    <FormField
      inputId={`robots-directives${id}`}
      title="Robots directives"
      description={
        isReadOnly
          ? ROBOTS_DIRECTIVES_SET_BY_DEVELOPER
          : 'These directives run once this video is ingested and consume Mux AI units. Uncheck any you don’t want for this upload.'
      }
    >
      <Stack gap={3}>
        {warning && (
          <Card padding={3} radius={2} tone="caution" border>
            <Text size={1}>{warning}</Text>
          </Card>
        )}
        {configuredIds.map((directiveId) => {
          const name = directiveNames[directiveId] ?? directiveId
          const isMissing = missingIds.includes(directiveId)
          const inputId = `robots-directive-${directiveId}${id}`
          const details = (
            <Stack gap={2}>
              {isReadOnly ? (
                <Text size={1}>{name}</Text>
              ) : (
                <Text size={1} as="label" htmlFor={inputId}>
                  {name}
                </Text>
              )}
              {name !== directiveId && (
                <Text size={1} muted style={{wordBreak: 'break-all'}}>
                  {directiveId}
                </Text>
              )}
              {isMissing && (
                <Text size={1} muted>
                  Not in this Mux account, so it won’t run.
                </Text>
              )}
            </Stack>
          )
          return isReadOnly ? (
            <Box key={directiveId}>{details}</Box>
          ) : (
            <Flex key={directiveId} gap={2} align="flex-start">
              <Checkbox
                id={inputId}
                disabled={isMissing}
                checked={!isMissing && !uncheckedIds.includes(directiveId)}
                onChange={(event) => onToggle(directiveId, event.currentTarget.checked)}
              />
              {details}
            </Flex>
          )
        })}
      </Stack>
    </FormField>
  )
}
