import {RefreshIcon} from '@sanity/icons/Refresh'
import {RobotIcon} from '@sanity/icons/Robot'
import {Box, Button, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useEffect, useState} from 'react'

import {useCanRunRobots} from '../../hooks/useCanRunRobots'
import {directiveNamesById, useRobotsDirectives} from '../../hooks/useRobotsDirectives'
import {useRobotsSync} from '../../hooks/useRobotsSync'
import {robotsRunnersOnlyNote} from '../../robots/access'
import type {RobotsAssetContext} from '../../robots/catalog'
import {
  jobsWithHistory,
  nextPendingRelabelAt,
  type PendingCreateRow,
  pendingCreateRows,
  pendingCreatesOf,
} from '../../robots/records'
import type {RobotsToast} from '../../robots/sync'
import type {RobotsPendingCreate} from '../../robots/types'
import {hasUsableCaptionTrack, isCaptionTrack} from '../../util/tracks'
import type {MuxInputConfig, MuxTextTrack, VideoAssetDocument} from '../../util/types'
import {RobotsCapabilityCard} from './RobotsCapabilityCard'
import {RobotsDirectivesSection} from './RobotsDirectivesSection'
import {detailStateOf, RobotsJobTable} from './RobotsJobTable'
import {RobotsNote} from './RobotsNote'
import {RobotsOutputDialog} from './RobotsOutputDialog'
import {RobotsRunDialog} from './RobotsRunDialog'
import {RobotsUnconfirmedNote} from './RobotsUnconfirmedNote'

const NO_DIRECTIVES: string[] = []

export interface RobotsPanelProps {
  asset: VideoAssetDocument
  config: Pick<MuxInputConfig, 'allowedRolesForRobots' | 'defaultDirectiveIds'>
  readOnly?: boolean | undefined
}

/** The current time in seconds, updated only when a pending create's row is due to relabel. */
function useRelabelClock(pendings: RobotsPendingCreate[]): number {
  const [nowS, setNowS] = useState(() => Math.floor(Date.now() / 1000))
  const wakeAt = nextPendingRelabelAt(pendings, nowS)
  useEffect(() => {
    if (wakeAt === undefined) return undefined
    const timer = setTimeout(
      () => setNowS(Math.floor(Date.now() / 1000)),
      Math.max(0, wakeAt * 1000 - Date.now()) + 50,
    )
    return () => clearTimeout(timer)
  }, [wakeAt])
  return nowS
}

/** Why Run is blocked: while its table shows a pending row. */
function pendingReason(rows: PendingCreateRow[], where: string): string | undefined {
  if (rows.length === 0) return undefined
  return rows.some((row) => row.phase === 'unconfirmed')
    ? `Mux hasn’t confirmed the last run. See the note above the ${where}.`
    : 'A run is starting on this video.'
}

function RobotsPanelForAsset({
  asset,
  assetId,
  config,
  readOnly,
}: RobotsPanelProps & {assetId: string}) {
  const toast = useToast()
  const canRun = useCanRunRobots(config) && !readOnly
  const defaultDirectiveIds = config.defaultDirectiveIds ?? NO_DIRECTIVES
  const {store, snapshot} = useRobotsSync(asset, {enabled: true, defaultDirectiveIds})
  const isEnabled = snapshot.capability?.state === 'enabled'
  const {listing, reload: reloadDirectives} = useRobotsDirectives(isEnabled)
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false)
  const [viewedJobId, setViewedJobId] = useState<string>()

  const pendings = pendingCreatesOf(asset)
  const nowS = useRelabelClock(pendings)

  if (!store) return null
  const {capability} = snapshot
  if (capability && capability.state !== 'enabled') {
    return <RobotsCapabilityCard state={capability.state} termsUrl={capability.termsUrl} />
  }
  if (!snapshot.hasLoadedOnce && !isEnabled) {
    return (
      <Flex align="center" gap={2} padding={3}>
        <Spinner muted />
        <Text size={1} muted>
          Loading Robots…
        </Text>
      </Flex>
    )
  }

  const notify = (message: RobotsToast) => toast.push(message)
  const rowsInput = {settled: snapshot.settledRequestIds, links: snapshot.links, state: asset, nowS}
  const jobRows = pendingCreateRows({
    ...rowsInput,
    stored: pendings.filter((pending) => pending.kind === 'job'),
    local: snapshot.localJobCreate,
    jobs: snapshot.jobs,
    runs: [],
  })
  const runRows = pendingCreateRows({
    ...rowsInput,
    stored: pendings.filter((pending) => pending.kind === 'directive-run'),
    local: snapshot.localRunCreate,
    jobs: [],
    runs: snapshot.directiveRuns,
  })
  const unconfirmedJobRows = jobRows.filter((row) => row.phase === 'unconfirmed')
  const unconfirmedRunRows = runRows.filter((row) => row.phase === 'unconfirmed')
  const runDisabledReason = pendingReason(jobRows, 'jobs')
  // A directive run waits on both: a pending job create may be the same work.
  const directiveRunDisabledReason =
    pendingReason(runRows, 'directive runs') ?? pendingReason(jobRows, 'jobs')

  const tracks = asset.data?.tracks
  const context: RobotsAssetContext = {
    ...(tracks && {
      hasCaptions: hasUsableCaptionTrack(tracks),
      isAudioOnly: !tracks.some((track) => track?.type === 'video'),
    }),
    ...(!asset.data?.is_live &&
      typeof asset.data?.duration === 'number' && {duration: asset.data.duration}),
  }
  const captionTracks = (tracks ?? []).filter(
    (track): track is MuxTextTrack =>
      isCaptionTrack(track) && track.status === 'ready' && !!track.id,
  )
  const shownJobs = jobsWithHistory(snapshot.jobs, asset.robotsJobs)
  const viewedJob = shownJobs.find((job) => job.id === viewedJobId)
  const directiveNames = directiveNamesById(listing, defaultDirectiveIds)

  return (
    <Stack gap={4}>
      <Flex justify="space-between" align="center" gap={2} wrap="wrap">
        {canRun ? (
          <Button
            icon={RobotIcon}
            text="Run a workflow"
            tone="primary"
            disabled={!!runDisabledReason}
            title={runDisabledReason}
            onClick={() => setIsRunDialogOpen(true)}
          />
        ) : (
          <Box />
        )}
        <Button
          icon={RefreshIcon}
          text="Refresh"
          mode="bleed"
          loading={snapshot.isRefreshing}
          onClick={() => {
            store.refreshNow()
            reloadDirectives()
          }}
        />
      </Flex>

      {!canRun && <RobotsNote>{robotsRunnersOnlyNote(config.allowedRolesForRobots)}</RobotsNote>}
      {canRun && (
        <RobotsUnconfirmedNote
          rows={unconfirmedJobRows}
          onClear={() => store.clearUnconfirmed(unconfirmedJobRows.map((row) => row.pending))}
        />
      )}
      {snapshot.loadError && <RobotsNote tone="critical">{snapshot.loadError}</RobotsNote>}
      {snapshot.advisory && <RobotsCapabilityCard state={snapshot.advisory} />}

      <Stack gap={3}>
        <Text size={1} weight="semibold">
          Jobs
        </Text>
        <RobotsJobTable
          jobs={shownJobs}
          pendingRows={jobRows}
          detailedJobIds={snapshot.detailedJobIds}
          failedDetailIds={snapshot.failedDetailIds}
          loadingDetailIds={snapshot.loadingDetailIds}
          pendingDetailIds={snapshot.pendingDetailIds}
          cancellingJobIds={snapshot.cancellingJobIds}
          onCancel={canRun ? (job) => void store.cancelJob(job, notify) : undefined}
          onViewOutput={(job) => setViewedJobId(job.id)}
          onLoadDetail={(job) => void store.loadJobDetail(job)}
          pointsToNote={canRun}
          isLoading={!snapshot.hasLoadedOnce && shownJobs.length === 0}
        />
      </Stack>

      <RobotsDirectivesSection
        canRun={canRun}
        listing={listing}
        configuredIds={defaultDirectiveIds}
        directiveNames={directiveNames}
        runs={snapshot.directiveRuns}
        pendingRows={runRows}
        unconfirmedRows={unconfirmedRunRows}
        isLoading={snapshot.areDirectiveRunsPending}
        runDisabledReason={directiveRunDisabledReason}
        viewableJobIds={new Set(shownJobs.map((job) => job.id))}
        onRun={(directiveId) => void store.startDirectiveRun(directiveId, notify)}
        onClearUnconfirmed={() =>
          store.clearUnconfirmed(unconfirmedRunRows.map((row) => row.pending))
        }
        onViewJob={setViewedJobId}
      />

      {canRun && isRunDialogOpen && (
        <RobotsRunDialog
          assetId={assetId}
          captionTracks={captionTracks}
          context={context}
          runDisabledReason={runDisabledReason}
          onRun={(workflow, parameters) => void store.startJob(workflow, parameters, notify)}
          onClose={() => setIsRunDialogOpen(false)}
        />
      )}
      {viewedJob && (
        <RobotsOutputDialog
          job={viewedJob}
          detailState={detailStateOf(viewedJob, snapshot.detailedJobIds, snapshot.failedDetailIds)}
          onLoaded={store.rememberJobDetail}
          onClose={() => setViewedJobId(undefined)}
        />
      )}
    </Stack>
  )
}

/** Keyed by document and asset, so no state from one video carries over to another. */
export function RobotsPanel(props: RobotsPanelProps) {
  const {assetId, _id: documentId} = props.asset
  if (!assetId) return <RobotsNote>Add a video before running Robots workflows.</RobotsNote>
  return <RobotsPanelForAsset key={`${documentId}:${assetId}`} {...props} assetId={assetId} />
}
