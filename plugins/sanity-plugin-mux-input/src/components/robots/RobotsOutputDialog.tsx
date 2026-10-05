import {Box, Dialog, Flex, Grid, Spinner, Stack, Tab, TabList, TabPanel, Text} from '@sanity/ui'
import {useEffect, useId, useState} from 'react'
import {useDataset} from 'sanity'
import useSWR from 'swr'

import {getRobotsJob, RobotsRequestError} from '../../actions/robots'
import {useClient} from '../../hooks/useClient'
import {workflowLabel} from '../../robots/catalog'
import {formatTimestamp} from '../../robots/format'
import {type RobotsJobDetailState, unitsCell} from '../../robots/records'
import {type RobotsJob, robotsJobErrorMessage} from '../../robots/types'
import {DIALOGS_Z_INDEX} from '../../util/constants'
import {RobotsJsonBlock} from './RobotsJsonBlock'
import {RobotsNote} from './RobotsNote'
import {OUTPUT_VIEWS} from './RobotsOutputViews'
import {RobotsStatusBadge} from './RobotsStatusBadge'

function OutputBody({job}: {job: RobotsJob}) {
  if (job.status === 'errored') {
    return (
      <RobotsNote tone="critical">
        {robotsJobErrorMessage(job) ?? 'This job failed without a message.'}
      </RobotsNote>
    )
  }
  if (job.status === 'cancelled') return <RobotsNote>This job was cancelled.</RobotsNote>
  if (job.status !== 'completed') return <RobotsNote>This job is still {job.status}.</RobotsNote>

  const outputs = job.outputs
  if (!outputs || Object.keys(outputs).length === 0) {
    return <RobotsNote>Mux reports this job as completed but returned no output for it.</RobotsNote>
  }
  const view = OUTPUT_VIEWS[job.workflow]
  if (view?.hasContent(outputs)) return view.render(outputs)
  return (
    <Stack gap={3}>
      <RobotsNote tone="caution">
        This job completed, but its output isn’t in a shape this view can draw. The raw result
        follows.
      </RobotsNote>
      <RobotsJsonBlock value={outputs} what="this output" />
    </Stack>
  )
}

function Fact({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <>
      <Text size={1} muted>
        {label}
      </Text>
      <Box style={{minWidth: 0}}>{children}</Box>
    </>
  )
}

function readError(error: unknown): string {
  if (error instanceof RobotsRequestError && error.status === 404 && error.muxAnswered) {
    return 'Mux keeps jobs for 30 days, and this one is gone. The video document still records its status and units.'
  }
  return error instanceof Error ? error.message : 'Could not load this job from Mux.'
}

/**
 * A job's output, read live from Mux: shaped per workflow, with the whole job as raw JSON.
 * Only summarize and moderate outputs are stored on the document; the rest live in Mux.
 */
export function RobotsOutputDialog({
  job,
  detailState,
  onLoaded,
  onClose,
}: {
  job: RobotsJob
  detailState: RobotsJobDetailState
  onLoaded: (job: RobotsJob) => void
  onClose: () => void
}) {
  const client = useClient()
  const dataset = useDataset()
  const id = useId()
  const [tab, setTab] = useState<'result' | 'raw'>('result')
  // `outputs` and `errors` exist only on the single-job GET, so either means it's in hand.
  const isHeldInFull = !!job.outputs || job.errors !== undefined
  const {data: fetched, error} = useSWR(
    isHeldInFull ? null : `robots-job/${dataset}/${job.id}`,
    async () => (await getRobotsJob(client, job.workflow, job.id)).data,
    {revalidateOnFocus: false, shouldRetryOnError: false},
  )

  useEffect(() => {
    if (fetched) onLoaded(fetched)
  }, [fetched, onLoaded])

  const shown = fetched ?? job
  const isLoading = !isHeldInFull && !fetched && !error
  const detail: RobotsJobDetailState = fetched ? 'loaded' : error ? 'unreadable' : detailState

  return (
    <Dialog
      id={`robots-output${id}`}
      header={workflowLabel(shown.workflow)}
      onClose={onClose}
      onClickOutside={onClose}
      zOffset={DIALOGS_Z_INDEX}
      width={2}
    >
      <Stack gap={4} padding={4}>
        <Grid gap={3} style={{gridTemplateColumns: 'max-content minmax(0, 1fr)'}}>
          <Fact label="Status">
            <Flex>
              <RobotsStatusBadge kind="job" status={shown.status} />
            </Flex>
          </Fact>
          <Fact label="AI units">
            <Text size={1}>{isLoading ? 'Loading…' : unitsCell(shown, detail).label}</Text>
          </Fact>
          <Fact label="Started">
            <Text size={1}>{formatTimestamp(shown.created_at)}</Text>
          </Fact>
          <Fact label="Job ID">
            <Text size={1} textOverflow="ellipsis" title={shown.id}>
              {shown.id}
            </Text>
          </Fact>
        </Grid>

        {isLoading && (
          <Flex align="center" gap={2}>
            <Spinner muted />
            <Text size={1} muted>
              Loading the result from Mux…
            </Text>
          </Flex>
        )}
        {error && <RobotsNote tone="caution">{readError(error)}</RobotsNote>}
        {!isLoading && !error && (
          <Stack gap={3}>
            <TabList gap={2}>
              <Tab
                id={`robots-output-result${id}`}
                aria-controls={`robots-output-result-panel${id}`}
                label="Result"
                selected={tab === 'result'}
                onClick={() => setTab('result')}
              />
              <Tab
                id={`robots-output-raw${id}`}
                aria-controls={`robots-output-raw-panel${id}`}
                label="Raw JSON"
                selected={tab === 'raw'}
                onClick={() => setTab('raw')}
              />
            </TabList>
            <TabPanel
              id={`robots-output-result-panel${id}`}
              aria-labelledby={`robots-output-result${id}`}
              hidden={tab !== 'result'}
            >
              <OutputBody job={shown} />
            </TabPanel>
            <TabPanel
              id={`robots-output-raw-panel${id}`}
              aria-labelledby={`robots-output-raw${id}`}
              hidden={tab !== 'raw'}
            >
              <RobotsJsonBlock value={shown} what="this job" />
            </TabPanel>
          </Stack>
        )}
      </Stack>
    </Dialog>
  )
}
