import {dequal} from 'dequal/lite'
import type {SanityClient} from 'sanity'

import {getAsset} from '../actions/assets'
import {
  cancelRobotsJob,
  getRobotsDirectiveRun,
  getRobotsJob,
  listRobotsDirectiveRuns,
  listRobotsJobs,
  RobotsRequestError,
  startRobotsDirectiveRun,
  startRobotsJob,
} from '../actions/robots'
import {addKeysToMuxData} from '../util/addKeysToMuxData'
import {hasPreparingTracks} from '../util/tracks'
import {
  advisoryFromError,
  cachedRobotsCapability,
  capabilityFromError,
  recordRobotsCapability,
} from './capability'
import {workflowLabel} from './catalog'
import {writeRobotsFields} from './patches'
import {
  activeDirectiveRuns,
  activeJobs,
  addPendingCreate,
  applyDirectiveRuns,
  applyRobotsJobs,
  applyThumbnail,
  directiveRunRefsFromJobs,
  jobsAwaitingDetail,
  jobsNeedingDetail,
  type LocalPendingCreate,
  newPendingDirectiveRunCreate,
  newPendingJobCreate,
  type PendingCreatePhase,
  pendingCreatesOf,
  polledDirectiveIds,
  removePendingCreates,
  resolvePendingCreatesFromReads,
  resolvePendingDirectiveRunCreate,
  resolvePendingJobCreate,
  type RobotsDocumentState,
  thumbnailJobsToApply,
} from './records'
import {
  isTerminalStatus,
  type RobotsAdvisory,
  type RobotsCapability,
  type RobotsDirectiveRun,
  type RobotsJob,
  type RobotsPendingCreate,
  type RobotsWorkflow,
} from './types'

/**
 * One Robots poll loop per asset per browser tab, shared by every input and panel showing that
 * asset. It polls only while something subscribes and something is in flight, so a Studio that
 * never opens Robots sends nothing.
 */

const POLL_INTERVAL_MS = 6000

/** How many ticks a pending create keeps the loop looking for its job or run. */
const UNCONFIRMED_RECHECK_TICKS = 10

/** Times to re-read the asset while a track from a finished job is still preparing (2 minutes). */
const TRACK_RECHECKS = 20

/** Times to read a job whose detail still trails the list's terminal status (1 minute). */
const DETAIL_RECHECKS = 10

const JOB_LIST_LIMIT = 100
const DIRECTIVE_RUNS_LIMIT = 25

const LOG_PREFIX = '[sanity-plugin-mux-input]'

export interface RobotsSyncSnapshot {
  capability?: RobotsCapability | undefined
  hasLoadedOnce: boolean
  /** A refresh someone asked for is running. */
  isRefreshing: boolean
  loadError?: string | undefined
  advisory?: RobotsAdvisory | undefined
  /** The live list, overlaid with whatever detail has been read. */
  jobs: RobotsJob[]
  detailedJobIds: ReadonlySet<string>
  failedDetailIds: ReadonlySet<string>
  loadingDetailIds: ReadonlySet<string>
  /** Jobs the background pass will still read, so their Units are on their way. */
  pendingDetailIds: ReadonlySet<string>
  cancellingJobIds: ReadonlySet<string>
  directiveRuns: RobotsDirectiveRun[]
  /** The runs haven't been read once for the current set of directives. */
  areDirectiveRunsPending: boolean
  localJobCreate?: LocalPendingCreate | undefined
  localRunCreate?: LocalPendingCreate | undefined
  /** Creates this tab settled (refused, cleared) whose removal may still be on its way. */
  settledRequestIds: ReadonlySet<string>
  /** Request id → the job or run id its create returned in this tab. */
  links: ReadonlyMap<string, string>
}

export interface RobotsToast {
  status: 'success' | 'warning' | 'error'
  title: string
  description?: string
}

type Notify = (toast: RobotsToast) => void

interface SubscriberInputs {
  document: RobotsDocumentState | undefined
  defaultDirectiveIds: string[]
}

const EMPTY_SET: ReadonlySet<string> = new Set()

export const EMPTY_ROBOTS_SNAPSHOT: RobotsSyncSnapshot = {
  hasLoadedOnce: false,
  isRefreshing: false,
  jobs: [],
  detailedJobIds: EMPTY_SET,
  failedDetailIds: EMPTY_SET,
  loadingDetailIds: EMPTY_SET,
  pendingDetailIds: EMPTY_SET,
  cancellingJobIds: EMPTY_SET,
  directiveRuns: [],
  areDirectiveRunsPending: false,
  settledRequestIds: EMPTY_SET,
  links: new Map(),
}

const isRefusal = (error: unknown): error is RobotsRequestError =>
  error instanceof RobotsRequestError &&
  error.status !== undefined &&
  error.status >= 400 &&
  error.status < 500

const byNewestStart = (a: RobotsDirectiveRun, b: RobotsDirectiveRun) =>
  (b.started_at ?? 0) - (a.started_at ?? 0)

/** Whether the document already stores these asset fields, compared as the JSON it's saved as. */
function holdsAssetFields(
  document: RobotsDocumentState | undefined,
  fields: {status: string; data: unknown},
): boolean {
  return (
    document?.status === fields.status &&
    dequal(document.data, JSON.parse(JSON.stringify(fields.data)))
  )
}

export class RobotsSyncStore {
  private client: SanityClient
  private readonly documentId: string
  private readonly assetId: string

  private snapshot: RobotsSyncSnapshot
  private readonly listeners = new Set<() => void>()
  private readonly subscribers = new Map<symbol, SubscriberInputs>()
  private document: RobotsDocumentState | undefined

  private pollTimer: ReturnType<typeof setTimeout> | undefined
  private trackTimer: ReturnType<typeof setTimeout> | undefined
  /** Someone came back after nobody watched: read afresh once their inputs arrive. */
  private needsFreshRead = false
  private isFetching = false
  private isRefreshQueued = false
  private liveJobs: RobotsJob[] = []
  /** Jobs created in this tab that the list hasn't caught up with yet. */
  private readonly locallyCreated = new Map<string, RobotsJob>()
  private readonly details = new Map<string, RobotsJob>()
  private readonly failedDetails = new Set<string>()
  /** Jobs the list calls finished but whose detail didn't yet, with the reads so far. */
  private readonly trailingDetails = new Map<string, {job: RobotsJob; reads: number}>()
  private detailTimer: ReturnType<typeof setTimeout> | undefined
  private isDetailPassRunning = false
  /** Jobs whose completion already refreshed the asset this session. */
  private readonly resyncedJobIds = new Set<string>()
  private readonly resyncingJobIds = new Set<string>()
  private readonly links = new Map<string, string>()
  private readonly seenRequestIds = new Set<string>()
  /** Recorded running jobs the list didn't show, already looked for once. */
  private readonly lookedUpJobIds = new Set<string>()
  private jobRecheckTicks = 0
  private runRecheckTicks = 0
  private startingJob: string | undefined
  private startingRun: string | undefined

  private listedRuns: RobotsDirectiveRun[] = []
  private namedRuns: RobotsDirectiveRun[] = []
  private isLoadingRuns = false
  private runsInFlightKey: string | undefined
  private isRunsQueued = false
  private runsSettledKey: string | undefined

  private isPersisting = false
  private isPersistQueued = false
  private hasLoggedWriteFailure = false

  constructor(client: SanityClient, documentId: string, assetId: string) {
    this.client = client
    this.documentId = documentId
    this.assetId = assetId
    const capability = cachedRobotsCapability()
    this.snapshot = {...EMPTY_ROBOTS_SNAPSHOT, ...(capability && {capability}), links: this.links}
  }

  // --- React ---

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  readonly getSnapshot = (): RobotsSyncSnapshot => this.snapshot

  register(): {
    update: (inputs: SubscriberInputs & {client: SanityClient}) => void
    unregister: () => void
  } {
    const token = Symbol('robots-subscriber')
    const isFirst = this.subscribers.size === 0
    this.subscribers.set(token, {document: this.document, defaultDirectiveIds: []})
    if (isFirst && this.snapshot.hasLoadedOnce) this.needsFreshRead = true
    return {
      update: ({client, ...inputs}) => {
        this.client = client
        this.subscribers.set(token, inputs)
        this.setDocument(inputs.document)
      },
      unregister: () => {
        this.subscribers.delete(token)
        if (this.subscribers.size > 0) return
        this.stopPolling()
      },
    }
  }

  private set(changes: Partial<RobotsSyncSnapshot>) {
    this.snapshot = {...this.snapshot, ...changes}
    for (const listener of this.listeners) listener()
  }

  // --- What the loop knows ---

  private enrichedJobs(): RobotsJob[] {
    return this.liveJobs.map((job) => {
      const detail = this.details.get(job.id)
      return detail ? {...job, ...detail} : job
    })
  }

  private directiveRuns(): RobotsDirectiveRun[] {
    const listedIds = new Set(this.listedRuns.map((run) => run.run_id))
    return [
      ...this.listedRuns,
      ...this.namedRuns.filter((run) => !listedIds.has(run.run_id)),
    ].toSorted(byNewestStart)
  }

  private directiveIdKey(): string {
    const configured = [...this.subscribers.values()].flatMap(
      (inputs) => inputs.defaultDirectiveIds,
    )
    return polledDirectiveIds(configured, this.document, this.listedRuns).join(',')
  }

  private namedRunKey(): string {
    return directiveRunRefsFromJobs(this.enrichedJobs())
      .map((ref) => `${ref.directiveId}/${ref.runId}`)
      .toSorted()
      .join(',')
  }

  private publishReads() {
    const jobs = this.enrichedJobs()
    const attempted = new Set([...this.details.keys(), ...this.failedDetails])
    const runKey = `${this.directiveIdKey()}|${this.namedRunKey()}`
    this.set({
      jobs,
      detailedJobIds: new Set(this.details.keys()),
      failedDetailIds: new Set(this.failedDetails),
      pendingDetailIds: new Set(jobsAwaitingDetail(this.liveJobs, attempted).map((job) => job.id)),
      directiveRuns: this.directiveRuns(),
      areDirectiveRunsPending: runKey !== '|' && this.runsSettledKey !== runKey,
    })
  }

  private setDocument(document: RobotsDocumentState | undefined) {
    this.document = document
    // A create this tab hasn't seen (from another tab, say) gets a full recheck budget.
    for (const pending of pendingCreatesOf(document)) {
      if (this.seenRequestIds.has(pending.requestId)) continue
      this.seenRequestIds.add(pending.requestId)
      if (pending.kind === 'job') this.jobRecheckTicks = 0
      else this.runRecheckTicks = 0
    }
    if (!this.snapshot.hasLoadedOnce) {
      this.startIfNeeded()
      return
    }
    if (this.needsFreshRead) {
      this.needsFreshRead = false
      this.readEverything()
      return
    }
    if (this.pollTimer || this.isFetching) return
    // Another tab may have started a job this tab's list doesn't show yet: look once.
    const listed = new Set(this.liveJobs.map((job) => job.id))
    const unknown = activeJobs(document?.robotsJobs ?? []).filter(
      (record) => !listed.has(record.id) && !this.lookedUpJobIds.has(record.id),
    )
    if (unknown.length > 0) {
      for (const record of unknown) this.lookedUpJobIds.add(record.id)
      void this.refresh()
    } else {
      this.scheduleTick()
    }
  }

  // --- The loop ---

  /** The first read, once anything subscribes. A known-unavailable session reads nothing. */
  private startIfNeeded() {
    if (this.subscribers.size === 0 || this.isFetching || this.snapshot.hasLoadedOnce) return
    const cached = cachedRobotsCapability()
    if (cached && cached.state !== 'enabled') {
      this.set({capability: cached, hasLoadedOnce: true})
      return
    }
    this.readEverything()
  }

  private readEverything() {
    void this.refresh()
    void this.loadDirectiveRuns()
  }

  private stopPolling() {
    if (this.pollTimer) clearTimeout(this.pollTimer)
    this.pollTimer = undefined
  }

  private scheduleTick() {
    this.stopPolling()
    if (this.subscribers.size === 0) return
    if (this.snapshot.capability?.state !== 'enabled' || !this.snapshot.hasLoadedOnce) return

    const pendings = pendingCreatesOf(this.document)
    const hasJobCreates = pendings.some((pending) => pending.kind === 'job')
    const hasRunCreates = pendings.some((pending) => pending.kind === 'directive-run')
    const isRecheckingJobs = hasJobCreates && this.jobRecheckTicks < UNCONFIRMED_RECHECK_TICKS
    const isRecheckingRuns = hasRunCreates && this.runRecheckTicks < UNCONFIRMED_RECHECK_TICKS
    const hasActiveRuns = activeDirectiveRuns(this.directiveRuns()).length > 0
    const hasActiveJobs = activeJobs(this.enrichedJobs()).length > 0
    if (!hasActiveJobs && !hasActiveRuns && !isRecheckingJobs && !isRecheckingRuns) return

    this.pollTimer = setTimeout(() => {
      this.pollTimer = undefined
      if (hasJobCreates) this.jobRecheckTicks += 1
      if (hasRunCreates) this.runRecheckTicks += 1
      void this.refresh()
      if (hasActiveRuns || isRecheckingRuns) void this.loadDirectiveRuns()
    }, POLL_INTERVAL_MS)
  }

  /** Refresh button: the list, the runs, now. */
  refreshNow() {
    this.set({isRefreshing: true})
    this.readEverything()
  }

  private async refresh(): Promise<void> {
    if (this.isFetching) {
      this.isRefreshQueued = true
      return
    }
    this.isFetching = true
    let fetched: RobotsJob[] | undefined

    try {
      const response = await listRobotsJobs(this.client, {
        assetId: this.assetId,
        limit: JOB_LIST_LIMIT,
      })
      fetched = response.data ?? []
      // Once the list knows a job, Mux's copy wins over the one the create returned.
      const listed = new Set(fetched.map((job) => job.id))
      for (const id of this.locallyCreated.keys())
        if (listed.has(id)) this.locallyCreated.delete(id)
      this.liveJobs = [...this.locallyCreated.values(), ...fetched]
      // A successful list is the capability check, for every document.
      recordRobotsCapability({state: 'enabled'})
      this.set({
        capability:
          this.snapshot.capability?.state === 'enabled'
            ? this.snapshot.capability
            : {state: 'enabled'},
        loadError: undefined,
      })
    } catch (error) {
      const unavailable = capabilityFromError(error)
      if (unavailable) {
        recordRobotsCapability(unavailable)
        this.set({capability: unavailable})
      } else {
        this.set({
          loadError:
            error instanceof Error
              ? error.message
              : 'Could not load the Robots jobs for this video.',
        })
      }
    } finally {
      this.isFetching = false
      this.set({hasLoadedOnce: true, isRefreshing: false})
    }

    if (fetched) {
      this.publishReads()
      void this.resyncFinishedJobs(fetched)
      void this.loadDetails()
      this.persist()
    }
    if (this.isRefreshQueued) {
      this.isRefreshQueued = false
      void this.refresh()
    } else {
      this.scheduleTick()
    }
  }

  /**
   * A completed job may have changed the Mux asset (tracks, title, thumbnail, playback IDs), so
   * the asset is refreshed the way `useMuxPolling` does: status and data only, never filename.
   */
  private async resyncFinishedJobs(jobs: RobotsJob[]) {
    const finished = jobs.filter(
      (job) =>
        job.status === 'completed' &&
        !this.resyncedJobIds.has(job.id) &&
        !this.resyncingJobIds.has(job.id),
    )
    if (finished.length === 0) return
    for (const job of finished) this.resyncingJobIds.add(job.id)
    try {
      const isTrackPreparing = await this.refreshAsset()
      for (const job of finished) this.resyncedJobIds.add(job.id)
      // A thumbnail job can now be applied from the fresh `thumbnail_time`.
      this.persist()
      if (isTrackPreparing) this.awaitTracks(TRACK_RECHECKS)
    } catch (error) {
      console.error(`${LOG_PREFIX} Could not refresh the asset after a Robots job`, error)
    } finally {
      for (const job of finished) this.resyncingJobIds.delete(job.id)
    }
  }

  /** Writes the asset as Mux has it now. Resolves to whether a track is still preparing. */
  private async refreshAsset(): Promise<boolean> {
    const {data} = await getAsset(this.client, this.assetId)
    const fields = {status: data.status, data: addKeysToMuxData(data)}
    // Most jobs leave the asset as it was, and every session re-checks the finished ones.
    if (!holdsAssetFields(this.document, fields)) {
      await this.client.patch(this.documentId).set(fields).commit({returnDocuments: false})
    }
    return hasPreparingTracks(data.tracks)
  }

  /**
   * A caption or audio track a job added can still be preparing, and players only get it once
   * the document says it's ready, so the asset is read again a few times. It outlives the last
   * subscriber: the input stops subscribing once the job's record says completed.
   */
  private awaitTracks(remaining: number) {
    if (this.trackTimer) clearTimeout(this.trackTimer)
    this.trackTimer = undefined
    if (remaining <= 0) return
    this.trackTimer = setTimeout(() => {
      this.trackTimer = undefined
      this.refreshAsset()
        .then((isTrackPreparing) => {
          if (isTrackPreparing) this.awaitTracks(remaining - 1)
        })
        .catch((error: unknown) => {
          console.error(`${LOG_PREFIX} Could not refresh the asset after a Robots job`, error)
        })
    }, POLL_INTERVAL_MS)
  }

  /** The detail pass: a few of the newest terminal jobs at a time, each read once. */
  private async loadDetails() {
    if (this.isDetailPassRunning || this.subscribers.size === 0) return
    // Trailing reads wait for their own timer, or this pass would spend their rechecks at once.
    const attempted = new Set([
      ...this.details.keys(),
      ...this.failedDetails,
      ...this.trailingDetails.keys(),
    ])
    const batch = jobsNeedingDetail(this.liveJobs, attempted)
    if (batch.length === 0) return

    this.isDetailPassRunning = true
    const results = await Promise.all(batch.map((job) => this.readDetail(job)))
    this.isDetailPassRunning = false
    this.retryTrailingDetails()
    if (results.every((result) => !result)) {
      this.publishReads()
      return
    }
    this.publishReads()
    this.persist()
    // Details name the directive runs that dispatched their jobs.
    void this.loadDirectiveRuns()
    void this.loadDetails()
  }

  /**
   * Re-reads the trailing details on a timer of their own, since nothing else may poll once the
   * list says every job is done. Bounded, so it outlives the last subscriber like `awaitTracks`.
   */
  private retryTrailingDetails() {
    if (this.detailTimer || this.trailingDetails.size === 0) return
    this.detailTimer = setTimeout(() => {
      this.detailTimer = undefined
      const jobs = [...this.trailingDetails.values()].map((entry) => entry.job)
      void Promise.all(jobs.map((job) => this.readDetail(job))).then((results) => {
        this.publishReads()
        if (results.some(Boolean)) {
          this.persist()
          void this.loadDirectiveRuns()
        }
        this.retryTrailingDetails()
      })
    }, POLL_INTERVAL_MS)
  }

  private async readDetail(job: RobotsJob): Promise<boolean> {
    try {
      const detail = (await getRobotsJob(this.client, job.workflow, job.id)).data
      // The single-job GET can trail the list. Kept out of `details`, it can't undo the list's
      // terminal status, and it's read again a few times.
      const reads = (this.trailingDetails.get(job.id)?.reads ?? 0) + 1
      if (detail && !isTerminalStatus(detail.status) && reads < DETAIL_RECHECKS) {
        this.trailingDetails.set(job.id, {job, reads})
        return false
      }
      this.trailingDetails.delete(job.id)
      if (detail && isTerminalStatus(detail.status)) {
        this.details.set(job.id, detail)
        return true
      }
    } catch (error) {
      this.trailingDetails.delete(job.id)
      console.error(`${LOG_PREFIX} Could not load Robots job ${job.id}`, error)
    }
    // Failed reads aren't retried this session, so a deleted job isn't asked for every tick.
    this.failedDetails.add(job.id)
    return false
  }

  /** One row's detail, on a click past the background window. */
  async loadJobDetail(job: RobotsJob) {
    if (this.details.has(job.id) || this.failedDetails.has(job.id)) return
    if (this.snapshot.loadingDetailIds.has(job.id)) return
    this.set({loadingDetailIds: new Set([...this.snapshot.loadingDetailIds, job.id])})
    const loaded = await this.readDetail(job)
    const loadingDetailIds = new Set(this.snapshot.loadingDetailIds)
    loadingDetailIds.delete(job.id)
    this.set({loadingDetailIds})
    this.publishReads()
    if (loaded) this.persist()
  }

  /** Keeps what the output dialog fetched, once the job is final: an earlier read would pin
   * the status it had then. */
  readonly rememberJobDetail = (job: RobotsJob) => {
    if (!isTerminalStatus(job.status) || this.details.has(job.id)) return
    this.details.set(job.id, job)
    this.trailingDetails.delete(job.id)
    this.publishReads()
    this.persist()
  }

  /**
   * The runs on this asset. The runs endpoint can't filter by asset, so only directives the
   * asset is tied to are listed and narrowed by `subject_id`; runs of any other directive are
   * read by id from the jobs that name them.
   */
  private async loadDirectiveRuns(): Promise<void> {
    const directiveKey = this.directiveIdKey()
    const namedKey = this.namedRunKey()
    const passKey = `${directiveKey}|${namedKey}`
    if (passKey === '|') {
      this.publishReads()
      return
    }
    if (this.isLoadingRuns) {
      if (passKey !== this.runsInFlightKey) this.isRunsQueued = true
      return
    }
    this.isLoadingRuns = true
    this.runsInFlightKey = passKey

    try {
      const directiveIds = directiveKey ? directiveKey.split(',') : []
      const listed = await Promise.all(directiveIds.map((id) => this.listRunsOf(id)))
      // A directive whose read failed keeps what was known, or one bad tick ends the loop.
      this.listedRuns = listed
        .flatMap(
          (runs, index) =>
            runs ?? this.listedRuns.filter((run) => run.directive_id === directiveIds[index]),
        )
        .toSorted(byNewestStart)

      const listedIds = new Set(this.listedRuns.map((run) => run.run_id))
      const settledIds = new Set(
        this.namedRuns
          .filter((run) => activeDirectiveRuns([run]).length === 0)
          .map((run) => run.run_id),
      )
      const refs = namedKey
        ? namedKey.split(',').map((key) => {
            const [directiveId = '', runId = ''] = key.split('/')
            return {directiveId, runId}
          })
        : []
      const read = await Promise.all(
        refs
          .filter((ref) => !listedIds.has(ref.runId) && !settledIds.has(ref.runId))
          .map((ref) => this.readNamedRun(ref.directiveId, ref.runId)),
      )
      const fresh = read.filter((run): run is RobotsDirectiveRun => !!run)
      const freshIds = new Set(fresh.map((run) => run.run_id))
      this.namedRuns = [...fresh, ...this.namedRuns.filter((run) => !freshIds.has(run.run_id))]
    } finally {
      this.isLoadingRuns = false
      this.runsInFlightKey = undefined
      this.runsSettledKey = passKey
    }

    this.publishReads()
    this.persist()
    if (this.isRunsQueued) {
      this.isRunsQueued = false
      void this.loadDirectiveRuns()
    } else if (!this.pollTimer && !this.isFetching) {
      this.scheduleTick()
    }
  }

  private async listRunsOf(directiveId: string): Promise<RobotsDirectiveRun[] | undefined> {
    try {
      const response = await listRobotsDirectiveRuns(this.client, directiveId, {
        limit: DIRECTIVE_RUNS_LIMIT,
      })
      const runs = (response.data ?? [])
        .filter((run) => run.subject_id === this.assetId)
        .map((run) => ({...run, directive_id: directiveId}))
      // `node_states` is normally on the list; this is the fallback.
      return await Promise.all(
        runs.map(async (run) =>
          run.node_states ? run : ((await this.readNamedRun(directiveId, run.run_id)) ?? run),
        ),
      )
    } catch (error) {
      console.error(`${LOG_PREFIX} Could not list the runs of directive ${directiveId}`, error)
      return undefined
    }
  }

  private async readNamedRun(
    directiveId: string,
    runId: string,
  ): Promise<RobotsDirectiveRun | undefined> {
    try {
      const run = (await getRobotsDirectiveRun(this.client, directiveId, runId)).data
      // Checked, not assumed: a run on another asset isn't this video's.
      return run?.run_id && run.subject_id === this.assetId
        ? {...run, directive_id: directiveId}
        : undefined
    } catch (error) {
      console.error(`${LOG_PREFIX} Could not load directive run ${runId}`, error)
      return undefined
    }
  }

  // --- Recording on the document ---

  /** What the reads say, merged onto the latest document at write time. */
  private mergeReads = (current: RobotsDocumentState): RobotsDocumentState => {
    const jobs = this.enrichedJobs()
    const runs = this.directiveRuns()
    // Placeholders first: a job already recorded can no longer resolve one.
    const resolved = resolvePendingCreatesFromReads(current, jobs, runs, this.assetId, this.links)
    const withJobs = applyRobotsJobs(
      applyDirectiveRuns(resolved, runs, this.assetId),
      jobs,
      this.assetId,
    )
    const resynced = jobs.filter((job) => this.resyncedJobIds.has(job.id))
    const thumbnailJobIds = thumbnailJobsToApply(withJobs, resynced).map((job) => job.id)
    return applyThumbnail(withJobs, thumbnailJobIds, this.assetId)
  }

  /** One write at a time; a write asked for meanwhile runs once more with the newest reads. */
  private persist() {
    if (this.liveJobs.length === 0 && this.listedRuns.length === 0 && this.namedRuns.length === 0) {
      return
    }
    if (this.isPersisting) {
      this.isPersistQueued = true
      return
    }
    this.isPersisting = true
    writeRobotsFields(this.client, this.documentId, this.assetId, this.mergeReads)
      .catch((error: unknown) => {
        // Someone without write access still sees live data; the failure is logged once.
        if (this.hasLoggedWriteFailure) return
        this.hasLoggedWriteFailure = true
        console.warn(`${LOG_PREFIX} Could not record Robots state on the video document`, error)
      })
      .finally(() => {
        this.isPersisting = false
        if (!this.isPersistQueued) return
        this.isPersistQueued = false
        this.persist()
      })
  }

  // --- Creates ---

  private setLocal(kind: RobotsPendingCreate['kind'], local: LocalPendingCreate | undefined) {
    this.set(kind === 'job' ? {localJobCreate: local} : {localRunCreate: local})
  }

  private setLocalPhase(pending: RobotsPendingCreate, phase: PendingCreatePhase) {
    this.setLocal(pending.kind, {pending, phase})
  }

  private dropLocal(pending: RobotsPendingCreate) {
    const local =
      pending.kind === 'job' ? this.snapshot.localJobCreate : this.snapshot.localRunCreate
    if (local?.pending.requestId === pending.requestId) this.setLocal(pending.kind, undefined)
  }

  /** Hides these rows and gives Run back at once, while their removal is written. */
  private settle(pendings: RobotsPendingCreate[]) {
    this.set({
      settledRequestIds: new Set([
        ...this.snapshot.settledRequestIds,
        ...pendings.map((pending) => pending.requestId),
      ]),
    })
    pendings.forEach((pending) => this.dropLocal(pending))
  }

  private removePlaceholders(requestIds: string[]) {
    writeRobotsFields(this.client, this.documentId, this.assetId, (current) =>
      removePendingCreates(current, (entry) => requestIds.includes(entry.requestId)),
    ).catch((error: unknown) => {
      console.error(`${LOG_PREFIX} Could not remove a settled Robots placeholder`, error)
    })
  }

  /** No placeholder, no spend: nothing is sent unless it was saved. */
  private async savePlaceholder(pending: RobotsPendingCreate, notify: Notify): Promise<boolean> {
    let saved = false
    try {
      saved = await writeRobotsFields(this.client, this.documentId, this.assetId, (current) =>
        addPendingCreate(current, pending, this.assetId),
      )
    } catch (error) {
      console.error(`${LOG_PREFIX} Could not record a Robots run before starting it`, error)
    }
    if (!saved) {
      this.dropLocal(pending)
      notify({
        status: 'error',
        title: 'Could not record this run on the video, so it was not started.',
      })
      return false
    }
    this.setLocalPhase(pending, 'sending')
    return true
  }

  /** Mux or the proxy said no: nothing started, so the placeholder has nothing left to guard. */
  private settleRefusal(
    pending: RobotsPendingCreate,
    error: RobotsRequestError,
    alreadyRunning: string,
    notify: Notify,
  ) {
    this.settle([pending])
    this.removePlaceholders([pending.requestId])
    if (error.status === 409) {
      notify({status: 'warning', title: alreadyRunning})
      this.readEverything()
      return
    }
    notify({status: 'error', title: 'Mux refused this run', description: error.message})
    const advisory = advisoryFromError(error)
    if (advisory) this.set({advisory})
    // A refusal that might mean the account lost Robots asks the list, which decides that.
    else if (capabilityFromError(error)) void this.refresh()
  }

  /** Unknown outcome: it may be running and billing. The placeholder stays and the loop looks. */
  private markUnconfirmed(pending: RobotsPendingCreate, what: string, notify: Notify) {
    this.setLocalPhase(pending, 'unconfirmed')
    if (pending.kind === 'job') this.jobRecheckTicks = 0
    else this.runRecheckTicks = 0
    notify({
      status: 'warning',
      title: `Mux hasn’t answered about ${what} yet`,
      description: 'The Robots panel keeps checking.',
    })
    this.readEverything()
  }

  /** The created job or run replaces its placeholder. A failure is logged, never a failed run. */
  private recordCreated(mutate: (current: RobotsDocumentState) => RobotsDocumentState) {
    return writeRobotsFields(this.client, this.documentId, this.assetId, mutate).catch(
      (error: unknown) => {
        console.error(`${LOG_PREFIX} Started a Robots run but could not record it`, error)
      },
    )
  }

  /** Starts a workflow, once. The dialog has already closed; the job table shows the rest. */
  async startJob(workflow: RobotsWorkflow, parameters: Record<string, unknown>, notify: Notify) {
    if (this.startingJob) return
    const pending = newPendingJobCreate(workflow)
    this.startingJob = pending.requestId
    this.setLocalPhase(pending, 'saving')

    try {
      if (!(await this.savePlaceholder(pending, notify))) return
      let job: RobotsJob
      try {
        job = await startRobotsJob(this.client, workflow, parameters)
      } catch (error) {
        if (isRefusal(error)) {
          this.settleRefusal(
            pending,
            error,
            'This workflow is already running on this video with the same settings.',
            notify,
          )
        } else {
          this.markUnconfirmed(pending, `the ${workflowLabel(workflow)} run`, notify)
        }
        return
      }

      // On screen before anything removes its pending row.
      this.links.set(pending.requestId, job.id)
      this.locallyCreated.set(job.id, job)
      this.liveJobs = [job, ...this.liveJobs.filter((existing) => existing.id !== job.id)]
      this.publishReads()
      this.dropLocal(pending)
      await this.recordCreated((current) =>
        resolvePendingJobCreate(current, pending.requestId, job, this.assetId),
      )
      this.set({advisory: undefined})
      notify({
        status: 'success',
        title: `Started ${workflowLabel(workflow)}`,
        description: 'This can take a few minutes.',
      })
    } finally {
      if (this.startingJob === pending.requestId) this.startingJob = undefined
      this.scheduleTick()
    }
  }

  /** Starts a directive run on the same terms: it dispatches several billable workflows. */
  async startDirectiveRun(directiveId: string, notify: Notify) {
    if (this.startingRun) return
    const pending = newPendingDirectiveRunCreate(directiveId)
    this.startingRun = pending.requestId
    this.setLocalPhase(pending, 'saving')

    try {
      if (!(await this.savePlaceholder(pending, notify))) return
      let run: RobotsDirectiveRun
      try {
        run = await startRobotsDirectiveRun(this.client, directiveId, this.assetId)
      } catch (error) {
        if (isRefusal(error)) {
          this.settleRefusal(
            pending,
            error,
            'This directive is already running on this video.',
            notify,
          )
        } else {
          this.markUnconfirmed(pending, 'this directive run', notify)
        }
        return
      }

      this.links.set(pending.requestId, run.run_id)
      this.listedRuns = [
        run,
        ...this.listedRuns.filter((existing) => existing.run_id !== run.run_id),
      ]
      this.publishReads()
      this.dropLocal(pending)
      await this.recordCreated((current) =>
        resolvePendingDirectiveRunCreate(current, pending.requestId, run, this.assetId),
      )
      this.set({advisory: undefined})
      notify({status: 'success', title: 'Directive run started'})
      void this.refresh()
    } finally {
      if (this.startingRun === pending.requestId) this.startingRun = undefined
      this.scheduleTick()
    }
  }

  async cancelJob(job: RobotsJob, notify: Notify) {
    this.set({cancellingJobIds: new Set([...this.snapshot.cancellingJobIds, job.id])})
    try {
      await cancelRobotsJob(this.client, job.id)
    } catch (error) {
      // A 409 means it finished first; the refresh below shows how.
      if (!(error instanceof RobotsRequestError && error.status === 409)) {
        notify({
          status: 'error',
          title: 'Could not cancel this job',
          ...(error instanceof Error && {description: error.message}),
        })
      }
    } finally {
      const cancellingJobIds = new Set(this.snapshot.cancellingJobIds)
      cancellingJobIds.delete(job.id)
      this.set({cancellingJobIds})
    }
    await this.refresh()
  }

  /** "Nothing is running": clears exactly the placeholders the note names. */
  clearUnconfirmed(pendings: RobotsPendingCreate[]) {
    this.settle(pendings)
    this.removePlaceholders(pendings.map((pending) => pending.requestId))
  }
}

const stores = new Map<string, RobotsSyncStore>()

/** The store for one asset document, kept for the browser session. */
export function getRobotsSyncStore(
  client: SanityClient,
  documentId: string,
  assetId: string,
): RobotsSyncStore {
  const {projectId, dataset} = client.config()
  const key = `${projectId}:${dataset}:${documentId}:${assetId}`
  let store = stores.get(key)
  if (!store) {
    store = new RobotsSyncStore(client, documentId, assetId)
    stores.set(key, store)
  }
  return store
}
