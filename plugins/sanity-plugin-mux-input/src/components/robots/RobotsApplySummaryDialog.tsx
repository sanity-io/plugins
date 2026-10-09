import {Box, Button, Card, Dialog, Flex, Grid, Select, Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useId, useState} from 'react'

import type {SummaryTarget} from '../../hooks/useSummaryTarget'
import {
  defaultSummaryTargets,
  isEmptyValue,
  pickSummaryTarget,
  type SummaryOutputRow,
  summaryFieldValues,
  summaryOutputRows,
  type SummaryTargets,
} from '../../robots/applySummary'
import {EM_DASH} from '../../robots/format'
import type {RobotsSummarizeOutput} from '../../robots/types'
import {DIALOGS_Z_INDEX} from '../../util/constants'
import {RobotsReasonButton} from './RobotsReasonButton'

const COLUMNS = {gridTemplateColumns: '6rem minmax(9rem, 1fr) minmax(0, 1fr) minmax(0, 1fr)'}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  return typeof value === 'string' ? value : JSON.stringify(value)
}

function CurrentValue({
  row,
  targets,
  target,
}: {
  row: SummaryOutputRow
  targets: SummaryTargets
  target: SummaryTarget
}) {
  const fieldName = targets[row.key]
  if (fieldName) {
    const value = target.document[fieldName]
    return isEmptyValue(value) ? (
      <Text size={1} muted>
        Empty
      </Text>
    ) : (
      <Text size={1}>{formatValue(value)}</Text>
    )
  }
  // The field named like this output was left out because it has content.
  const namesake = target.fields.find((field) => field.name === row.key && field.kind === row.kind)
  return (
    <Text size={1} muted>
      {namesake && !isEmptyValue(target.document[namesake.name])
        ? `${namesake.title} already has content. Pick it to replace it.`
        : EM_DASH}
    </Text>
  )
}

/** Copies the stored summary into fields of the document this video is in, after a preview. */
export function RobotsApplySummaryDialog({
  summary,
  target,
  onClose,
}: {
  summary: RobotsSummarizeOutput
  target: SummaryTarget
  onClose: () => void
}) {
  const id = useId()
  const toast = useToast()
  const rows = summaryOutputRows(summary)
  const [targets, setTargets] = useState(() =>
    defaultSummaryTargets(rows, target.fields, target.document),
  )
  const values = summaryFieldValues(rows, targets)
  const count = Object.keys(values).length

  const apply = () => {
    target.apply(values)
    toast.push({
      status: 'success',
      title: count === 1 ? 'Applied 1 field' : `Applied ${count} fields`,
      ...(target.isDraft && {description: 'Publish the document to make it live.'}),
    })
    onClose()
  }

  return (
    <Dialog
      id={`robots-apply-summary${id}`}
      header="Apply summary to this document"
      onClose={onClose}
      zOffset={DIALOGS_Z_INDEX}
      width={2}
      footer={
        <Flex justify="flex-end" gap={2} padding={3}>
          <Button text="Cancel" mode="bleed" onClick={onClose} />
          <RobotsReasonButton
            text={count > 0 ? `Apply ${count}` : 'Apply'}
            tone="positive"
            disabledReason={
              target.disabledReason ??
              (count === 0 ? 'Pick a field for at least one output.' : undefined)
            }
            onClick={apply}
          />
        </Flex>
      }
    >
      <Stack gap={4} padding={4}>
        <Text size={1}>
          Pick a field for each output, or leave it on Do not apply. Nothing is sent to Mux: these
          are this document’s own fields
          {target.isDraft ? ', and the change stays a draft until you publish.' : '.'}
        </Text>
        <Card radius={2} border>
          <Grid gap={3} padding={3} style={COLUMNS}>
            {['Output', 'Field', 'Current value', 'New value'].map((heading) => (
              <Text key={heading} size={1} weight="medium" muted>
                {heading}
              </Text>
            ))}
            {rows.map((row) => {
              const selectId = `robots-apply-${row.key}${id}`
              const fields = target.fields.filter((field) => field.kind === row.kind)
              return [
                <Text key={`${row.key}-label`} size={1} as="label" htmlFor={selectId}>
                  {row.label}
                </Text>,
                <Box key={`${row.key}-field`}>
                  <Select
                    id={selectId}
                    fontSize={1}
                    value={targets[row.key] ?? ''}
                    onChange={(event) =>
                      setTargets(
                        pickSummaryTarget(targets, row.key, event.currentTarget.value || undefined),
                      )
                    }
                  >
                    <option value="">Do not apply</option>
                    {fields.map((field) => (
                      <option key={field.name} value={field.name}>
                        {field.title}
                      </option>
                    ))}
                  </Select>
                </Box>,
                <CurrentValue
                  key={`${row.key}-current`}
                  row={row}
                  targets={targets}
                  target={target}
                />,
                <Text key={`${row.key}-new`} size={1}>
                  {formatValue(row.value)}
                </Text>,
              ]
            })}
          </Grid>
        </Card>
        {target.fields.length === 0 && (
          <Text size={1} muted>
            This document has no text or tag fields the summary can go in.
          </Text>
        )}
      </Stack>
    </Dialog>
  )
}
