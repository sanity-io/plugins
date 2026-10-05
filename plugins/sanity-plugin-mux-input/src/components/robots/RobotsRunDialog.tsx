import {Badge, Box, Button, Card, Dialog, Flex, Select, Stack, Text} from '@sanity/ui'
import {useId, useState} from 'react'

import {ROBOTS_PRICING_URL} from '../../robots/capability'
import {
  availableWorkflow,
  confirmWarnings,
  DEFAULT_ROBOTS_WORKFLOW,
  defaultParamValues,
  paramsFromFormValues,
  ROBOTS_CATALOG,
  ROBOTS_CATALOG_BY_KEY,
  ROBOTS_CATEGORIES,
  type RobotsAssetContext,
  validateParams,
  workflowUnavailableReason,
} from '../../robots/catalog'
import type {RobotsWorkflow} from '../../robots/types'
import {DIALOGS_Z_INDEX} from '../../util/constants'
import type {MuxTextTrack} from '../../util/types'
import FormField from '../FormField'
import {RobotsNote} from './RobotsNote'
import {RobotsParamFields} from './RobotsParamFields'

/** Nothing runs until a confirm step names the workflow, the spend and any destructive choice. */
export function RobotsRunDialog({
  assetId,
  captionTracks,
  context,
  runDisabledReason,
  onRun,
  onClose,
}: {
  assetId: string
  captionTracks: MuxTextTrack[]
  context: RobotsAssetContext
  runDisabledReason?: string | undefined
  /** Not awaited: the dialog closes on confirm and the job list shows the run starting. */
  onRun: (workflow: RobotsWorkflow, parameters: Record<string, unknown>) => void
  onClose: () => void
}) {
  const id = useId()
  const [selectedWorkflow, setSelectedWorkflow] = useState<RobotsWorkflow>(DEFAULT_ROBOTS_WORKFLOW)
  // Kept per workflow, so options from one never leak into another's parameters.
  const [valuesByWorkflow, setValuesByWorkflow] = useState<
    Partial<Record<RobotsWorkflow, Record<string, unknown>>>
  >({})
  // A workflow, not a boolean: if the workflow changes under the confirm step, the step ends.
  const [confirmedWorkflow, setConfirmedWorkflow] = useState<RobotsWorkflow>()

  // Derived: the asset kind can arrive after the choice was made.
  const workflow = availableWorkflow(selectedWorkflow, context)
  const isConfirming = confirmedWorkflow === workflow
  const definition = ROBOTS_CATALOG_BY_KEY[workflow]
  const values = valuesByWorkflow[workflow] ?? defaultParamValues(definition.params)
  const errors = validateParams(definition, values, context)
  const warnings = confirmWarnings(definition, values, context)

  const handleChange = (name: string, value: unknown) =>
    setValuesByWorkflow((previous) => ({...previous, [workflow]: {...values, [name]: value}}))

  const handleConfirm = () => {
    onRun(workflow, paramsFromFormValues(definition, assetId, values, context))
    onClose()
  }

  const footer = isConfirming ? (
    <Flex justify="flex-end" gap={2} padding={3}>
      <Button text="Back" mode="bleed" onClick={() => setConfirmedWorkflow(undefined)} />
      <Button
        text={`Run ${definition.label}`}
        tone="positive"
        disabled={!!runDisabledReason}
        onClick={handleConfirm}
      />
    </Flex>
  ) : (
    <Flex justify="flex-end" gap={2} padding={3}>
      <Button text="Cancel" mode="bleed" onClick={onClose} />
      <Button
        text="Continue"
        tone="primary"
        disabled={!!runDisabledReason || errors.length > 0}
        title={runDisabledReason ?? errors[0]}
        onClick={() => {
          if (errors.length === 0) setConfirmedWorkflow(workflow)
        }}
      />
    </Flex>
  )

  return (
    <Dialog
      id={`robots-run${id}`}
      header={isConfirming ? 'Confirm this run' : 'Run a Robots workflow'}
      onClose={onClose}
      zOffset={DIALOGS_Z_INDEX}
      width={1}
      footer={footer}
    >
      <Box padding={4}>
        {isConfirming ? (
          <Stack gap={3}>
            <Text size={1}>
              This will run <strong>{definition.label}</strong> on this video and consume Mux AI
              units from your account. Robots is billed per AI unit. The first 100,000 units each
              month are free.{' '}
              <a href={ROBOTS_PRICING_URL} target="_blank" rel="noopener noreferrer">
                See pricing
              </a>
              .
            </Text>
            {definition.producesTrack && (
              <RobotsNote>
                The result is attached to the Mux video, so it works in your players straight away.
                The Studio picks it up when the job finishes.
              </RobotsNote>
            )}
            {(definition.notes ?? []).map((note) => (
              <RobotsNote key={note} tone="caution">
                {note}
              </RobotsNote>
            ))}
            {warnings.map((warning) => (
              <Card key={warning.title} padding={3} radius={2} tone="critical" border>
                <Stack gap={3}>
                  <Text size={1} weight="semibold">
                    {warning.title}
                  </Text>
                  <Text size={1}>{warning.body}</Text>
                </Stack>
              </Card>
            ))}
          </Stack>
        ) : (
          <Stack gap={4}>
            <FormField
              inputId={`robots-workflow${id}`}
              title="Workflow"
              description={definition.description}
            >
              <Select
                id={`robots-workflow${id}`}
                value={workflow}
                onChange={(event) =>
                  setSelectedWorkflow(event.currentTarget.value as RobotsWorkflow)
                }
              >
                {ROBOTS_CATEGORIES.map((category) => (
                  <optgroup key={category} label={category}>
                    {ROBOTS_CATALOG.filter((candidate) => candidate.category === category).map(
                      (candidate) => {
                        const unavailable = workflowUnavailableReason(candidate, context)
                        return (
                          <option
                            key={candidate.key}
                            value={candidate.key}
                            disabled={!!unavailable}
                          >
                            {unavailable ? `${candidate.label} (${unavailable})` : candidate.label}
                          </option>
                        )
                      },
                    )}
                  </optgroup>
                ))}
              </Select>
            </FormField>

            {(definition.producesTrack ||
              definition.planRestricted ||
              definition.requiresViewData) && (
              <Flex gap={1} wrap="wrap">
                {definition.producesTrack && (
                  <Badge tone="primary" fontSize={1} padding={2}>
                    Adds a track
                  </Badge>
                )}
                {definition.planRestricted && (
                  <Badge tone="caution" fontSize={1} padding={2}>
                    Plan dependent
                  </Badge>
                )}
                {definition.requiresViewData && (
                  <Badge fontSize={1} padding={2}>
                    Needs Mux Data views
                  </Badge>
                )}
              </Flex>
            )}

            {(definition.notes ?? []).map((note) => (
              <RobotsNote key={note}>{note}</RobotsNote>
            ))}

            <RobotsParamFields
              key={workflow}
              fields={definition.params}
              values={values}
              onChange={handleChange}
              captionTracks={captionTracks}
              context={context}
            />

            {/* Shown live: Continue stays disabled until these are fixed. */}
            {errors.length > 0 && (
              <Card padding={3} radius={2} tone="critical" border>
                <Stack gap={2}>
                  <Text size={1} weight="semibold">
                    Fix these before running
                  </Text>
                  {errors.map((error) => (
                    <Text key={error} size={1}>
                      {error}
                    </Text>
                  ))}
                </Stack>
              </Card>
            )}
          </Stack>
        )}
      </Box>
    </Dialog>
  )
}
