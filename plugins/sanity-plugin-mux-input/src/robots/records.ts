import {dequal} from 'dequal/lite'

import {
  isTerminalRunStatus,
  isTerminalStatus,
  type RobotsDirectiveRun,
  type RobotsDirectiveRunRecord,
  type RobotsFields,
  type RobotsJob,
  type RobotsJobRecord,
  type RobotsModerateOutput,
  type RobotsOutputs,
  type RobotsPendingCreate,
  type RobotsSummarizeOutput,
  type RobotsWorkflow,
  robotsJobErrorMessage,
} from './types'

/**
 * What Mux says, turned into what `mux.videoAsset` stores. Every merge returns the same
 * reference when nothing changed, which is how a poll tick that learns nothing writes nothing.
 * Records are append-and-update: Mux deletes jobs after 30 days, the document keeps them.
 */

/** The part of `mux.videoAsset` Robots reads and writes. */
export interface RobotsDocumentState extends RobotsFields {
  assetId?: string
  status?: string
  thumbTime?: number
  data?: {thumbnail_time?: number}
}

/** A job or run unfinished for longer than this stops keeping the poll alive. */
const ROBOTS_STALE_JOB_MS = 6 * 60 * 60 * 1000

/** Ids become `_key`s and keyed patch paths, so anything else is never stored. */
const SAFE_KEY = /^[A-Za-z0-9_-]+$/

/** Drops `undefined` keys, so a thinner read never erases what a richer one stored. */
function compact<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T
}

// --- Jobs and outputs ---

function toJobRecord(job: RobotsJob): RobotsJobRecord | undefined {
  if (!job.id || !job.status || !SAFE_KEY.test(job.id)) return undefined
  return compact<RobotsJobRecord>({
    _key: job.id,
    _type: 'mux.robotsJob',
    id: job.id,
    workflow: job.workflow,
    status: job.status,
    created_at: job.created_at,
    updated_at: job.updated_at,
    units_consumed: job.units_consumed,
    error: robotsJobErrorMessage(job),
  })
}

/** Every job read for the asset, whoever started it. Mux wins where the two disagree. */
export function mergeJobRecords(
  existing: RobotsJobRecord[] | undefined,
  jobs: RobotsJob[],
): RobotsJobRecord[] | undefined {
  const next = [...(existing ?? [])]
  const indexByKey = new Map(next.map((record, index) => [record._key, index]))
  let changed = false

  for (const job of jobs) {
    const record = toJobRecord(job)
    if (!record) continue
    const index = indexByKey.get(record._key)
    if (index === undefined) {
      indexByKey.set(record._key, next.length)
      next.push(record)
      changed = true
      continue
    }
    const merged = {...next[index]!, ...record}
    if (!dequal(next[index], merged)) {
      next[index] = merged
      changed = true
    }
  }

  return changed ? next : existing
}

function extractSummarizeOutput(job: RobotsJob): RobotsSummarizeOutput | undefined {
  const outputs = job.outputs ?? {}
  const tags = Array.isArray(outputs['tags'])
    ? outputs['tags'].filter((tag): tag is string => typeof tag === 'string')
    : []
  const output = compact<RobotsSummarizeOutput>({
    jobId: job.id,
    completedAt: job.updated_at,
    title: typeof outputs['title'] === 'string' ? outputs['title'] : undefined,
    description: typeof outputs['description'] === 'string' ? outputs['description'] : undefined,
    tags: tags.length > 0 ? tags : undefined,
  })
  return output.title || output.description || output.tags ? output : undefined
}

function extractModerateOutput(job: RobotsJob): RobotsModerateOutput | undefined {
  const outputs = job.outputs ?? {}
  const maxScores = (outputs['max_scores'] ?? {}) as Record<string, unknown>
  const scores = compact({
    sexual: typeof maxScores['sexual'] === 'number' ? maxScores['sexual'] : undefined,
    violence: typeof maxScores['violence'] === 'number' ? maxScores['violence'] : undefined,
  })
  const output = compact<RobotsModerateOutput>({
    jobId: job.id,
    completedAt: job.updated_at,
    exceedsThreshold:
      typeof outputs['exceeds_threshold'] === 'boolean' ? outputs['exceeds_threshold'] : undefined,
    maxScores: Object.keys(scores).length > 0 ? scores : undefined,
  })
  return output.exceedsThreshold !== undefined || output.maxScores ? output : undefined
}

/** A job's own `parameters.asset_id` (detail only) decides whose output it is. */
function ranOnAsset(job: RobotsJob, assetId: string | undefined): boolean {
  return !!assetId && job.parameters?.['asset_id'] === assetId
}

/** Oldest when missing or not a number, since stored values are user-editable. */
function completionTime(output: {completedAt?: unknown}): number {
  return typeof output.completedAt === 'number' ? output.completedAt : 0
}

/** A strict order, so every session settles on the same output. Ties go to the greater id. */
function isNewerOutput(
  current: {jobId: string; completedAt?: number} | undefined,
  candidate: {jobId: string; completedAt?: number},
): boolean {
  if (!current) return true
  if (current.jobId === candidate.jobId) return !dequal(current, candidate)
  const currentAt = completionTime(current)
  const candidateAt = completionTime(candidate)
  return candidateAt > currentAt || (candidateAt === currentAt && candidate.jobId > current.jobId)
}

/** The newest of the current output and every candidate, per `isNewerOutput`. */
function newestOutput<T extends {jobId: string; completedAt?: number}>(
  current: T | undefined,
  candidates: (T | undefined)[],
): T | undefined {
  let newest = current
  for (const candidate of candidates) {
    if (candidate && isNewerOutput(newest, candidate)) newest = candidate
  }
  return newest
}

/** The newest completed summarize and moderate outputs of this asset. */
function mergeRobotsOutputs(
  existing: RobotsOutputs | undefined,
  jobs: RobotsJob[],
  assetId: string | undefined,
): RobotsOutputs | undefined {
  const completed = jobs.filter((job) => job.status === 'completed' && ranOnAsset(job, assetId))
  const summarize = newestOutput(
    existing?.summarize,
    completed.filter((job) => job.workflow === 'summarize').map(extractSummarizeOutput),
  )
  const moderate = newestOutput(
    existing?.moderate,
    completed.filter((job) => job.workflow === 'moderate').map(extractModerateOutput),
  )
  if (summarize === existing?.summarize && moderate === existing?.moderate) return existing
  return compact<RobotsOutputs>({_type: 'mux.robotsOutputs', summarize, moderate})
}

/** Records every job read for the asset and folds in the newest outputs. */
export function applyRobotsJobs(
  state: RobotsDocumentState,
  jobs: RobotsJob[],
  assetId: string,
): RobotsDocumentState {
  if (state.assetId !== assetId) return state
  const robotsJobs = mergeJobRecords(state.robotsJobs, jobs)
  const robotsOutputs = mergeRobotsOutputs(state.robotsOutputs, jobs, assetId)
  if (robotsJobs === state.robotsJobs && robotsOutputs === state.robotsOutputs) return state
  return {...state, robotsJobs, robotsOutputs}
}

// --- Directive runs ---

function toDirectiveRunRecord(run: RobotsDirectiveRun): RobotsDirectiveRunRecord | undefined {
  if (!run.run_id || !run.directive_id || !SAFE_KEY.test(run.run_id)) return undefined
  const jobIds = (run.node_states ?? []).flatMap((node) => (node.job_id ? [node.job_id] : []))
  return compact<RobotsDirectiveRunRecord>({
    _key: run.run_id,
    _type: 'mux.robotsDirectiveRun',
    runId: run.run_id,
    directiveId: run.directive_id,
    status: run.status,
    startedAt: run.started_at,
    completedAt: run.completed_at ?? undefined,
    jobIds: jobIds.length > 0 ? jobIds : undefined,
  })
}

/**
 * Only runs started from the Studio are recorded: `append` adds one, polling only updates
 * what's already there. `jobIds` is unioned, never replaced.
 */
function mergeDirectiveRunRecords(
  existing: RobotsDirectiveRunRecord[] | undefined,
  runs: RobotsDirectiveRun[],
  {append = false}: {append?: boolean} = {},
): RobotsDirectiveRunRecord[] | undefined {
  const next = [...(existing ?? [])]
  const indexByKey = new Map(next.map((record, index) => [record._key, index]))
  let changed = false

  for (const run of runs) {
    const record = toDirectiveRunRecord(run)
    if (!record) continue
    const index = indexByKey.get(record._key)
    if (index === undefined) {
      if (!append) continue
      indexByKey.set(record._key, next.length)
      next.push(record)
      changed = true
      continue
    }
    const current = next[index]!
    const jobIds = [...new Set([...(current.jobIds ?? []), ...(record.jobIds ?? [])])]
    const merged = {...current, ...record, ...(jobIds.length > 0 && {jobIds})}
    if (!dequal(current, merged)) {
      next[index] = merged
      changed = true
    }
  }

  return changed ? next : existing
}

export function applyDirectiveRuns(
  state: RobotsDocumentState,
  runs: RobotsDirectiveRun[],
  assetId: string,
  options?: {append?: boolean},
): RobotsDocumentState {
  if (state.assetId !== assetId) return state
  const robotsDirectiveRuns = mergeDirectiveRunRecords(state.robotsDirectiveRuns, runs, options)
  return robotsDirectiveRuns === state.robotsDirectiveRuns ? state : {...state, robotsDirectiveRuns}
}

// --- What still needs reading or polling ---

/**
 * Terminal jobs whose detail (outputs, units, parameters) hasn't been read, newest first,
 * within the newest `window`. Past it, the Units cell offers a Load action.
 */
export function jobsAwaitingDetail(
  jobs: RobotsJob[],
  attempted: ReadonlySet<string>,
  {window = 20}: {window?: number} = {},
): RobotsJob[] {
  return jobs
    .toSorted((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))
    .slice(0, window)
    .filter((job) => isTerminalStatus(job.status) && !attempted.has(job.id))
}

/** The next batch of detail reads, a few per tick. */
export function jobsNeedingDetail(
  jobs: RobotsJob[],
  attempted: ReadonlySet<string>,
  {limit = 5, window = 20}: {limit?: number; window?: number} = {},
): RobotsJob[] {
  return jobsAwaitingDetail(jobs, attempted, {window}).slice(0, limit)
}

/**
 * The directives whose runs are listed for this asset: configured, recorded, pending or on
 * screen. Never the whole account, which would cost a request per directive in it.
 */
export function polledDirectiveIds(
  configuredIds: string[],
  state: RobotsDocumentState | undefined,
  runs: RobotsDirectiveRun[],
): string[] {
  const recorded = (state?.robotsDirectiveRuns ?? []).map((run) => run.directiveId)
  const pending = pendingCreatesOf(state).flatMap((entry) =>
    entry.kind === 'directive-run' && entry.directiveId ? [entry.directiveId] : [],
  )
  const live = runs.flatMap((run) => (run.directive_id ? [run.directive_id] : []))
  return [...new Set([...configuredIds, ...recorded, ...pending, ...live])]
    .filter(Boolean)
    .toSorted()
}

export interface RobotsDirectiveRunRef {
  directiveId: string
  runId: string
}

/** The directive runs that dispatched these jobs, once each (detail only). */
export function directiveRunRefsFromJobs(jobs: RobotsJob[]): RobotsDirectiveRunRef[] {
  const byRunId = new Map<string, RobotsDirectiveRunRef>()
  for (const job of jobs) {
    const {id: directiveId, run_id: runId} = job.directive ?? {}
    if (directiveId && runId && !byRunId.has(runId)) byRunId.set(runId, {directiveId, runId})
  }
  return [...byRunId.values()]
}

function isRecent(seconds: number | undefined, now: number): boolean {
  return !seconds || now - seconds * 1000 < ROBOTS_STALE_JOB_MS
}

/** Jobs still worth polling: unfinished, and not so old Mux has lost track of them. */
export function activeJobs<T extends {status?: string; created_at?: number}>(
  jobs: T[],
  now = Date.now(),
): T[] {
  return jobs.filter((job) => !isTerminalStatus(job.status) && isRecent(job.created_at, now))
}

/** Directive runs that may still dispatch work, which carries the loop between workflows. */
export function activeDirectiveRuns(
  runs: RobotsDirectiveRun[],
  now = Date.now(),
): RobotsDirectiveRun[] {
  return runs.filter((run) => !isTerminalRunStatus(run.status) && isRecent(run.started_at, now))
}

/**
 * Whether the document itself says Robots work is in flight: an unfinished job or run, or a
 * pending create. Read from the stored fields, so it costs no request.
 */
export function hasUnfinishedRobotsWork(state: RobotsDocumentState, now = Date.now()): boolean {
  return (
    activeJobs(state.robotsJobs ?? [], now).length > 0 ||
    (state.robotsDirectiveRuns ?? []).some(
      (run) => !isTerminalRunStatus(run.status) && isRecent(run.startedAt, now),
    ) ||
    pendingCreatesOf(state).some((pending) => isRecent(pending.requestedAt, now))
  )
}

// --- Pending creates ---

/**
 * How far from a placeholder's `requestedAt` a job's `created_at` (or a run's `started_at`) may
 * be to resolve it. Lopsided: a job can't predate its request, and the 15 s only absorb a fast
 * browser clock.
 */
const CREATE_MATCH_BEFORE_S = 15
const CREATE_MATCH_AFTER_S = 120

/** How long another tab's placeholder reads "Starting…" before it reads "Not confirmed". */
const CREATE_CONFIRM_GRACE_S = 45

/** 64 random bits: unique within the few creates one document has pending. */
function randomRequestId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function newPendingCreate(
  fields: {kind: 'job'; workflow: RobotsWorkflow} | {kind: 'directive-run'; directiveId: string},
  nowMs: number,
): RobotsPendingCreate {
  const requestId = randomRequestId()
  return {
    _key: requestId,
    _type: 'mux.robotsPendingCreate',
    requestId,
    ...fields,
    requestedAt: Math.floor(nowMs / 1000),
  }
}

export function newPendingJobCreate(workflow: RobotsWorkflow, nowMs = Date.now()) {
  return newPendingCreate({kind: 'job', workflow}, nowMs)
}

export function newPendingDirectiveRunCreate(directiveId: string, nowMs = Date.now()) {
  return newPendingCreate({kind: 'directive-run', directiveId}, nowMs)
}

/** Stored values are user-editable, so anything unreadable is skipped, never thrown on. */
function isPendingCreate(entry: unknown): entry is RobotsPendingCreate {
  if (!entry || typeof entry !== 'object') return false
  const {_key, requestId, kind, requestedAt, workflow, directiveId} = entry as Record<
    string,
    unknown
  >
  if (typeof requestId !== 'string' || _key !== requestId || !SAFE_KEY.test(requestId)) return false
  if (typeof requestedAt !== 'number' || !Number.isFinite(requestedAt)) return false
  if (kind === 'job') return typeof workflow === 'string' && workflow !== ''
  if (kind === 'directive-run') return typeof directiveId === 'string' && directiveId !== ''
  return false
}

export function pendingCreatesOf(state: RobotsDocumentState | undefined): RobotsPendingCreate[] {
  return (state?.robotsPendingCreates ?? []).filter(isPendingCreate)
}

export function addPendingCreate(
  state: RobotsDocumentState,
  pending: RobotsPendingCreate,
  assetId: string,
): RobotsDocumentState {
  if (state.assetId !== assetId) return state
  if (pendingCreatesOf(state).some((entry) => entry.requestId === pending.requestId)) return state
  return {...state, robotsPendingCreates: [...(state.robotsPendingCreates ?? []), pending]}
}

/** Unreadable entries are kept, so a write never drops what this version can't parse. */
export function removePendingCreates(
  state: RobotsDocumentState,
  predicate: (pending: RobotsPendingCreate) => boolean,
): RobotsDocumentState {
  const stored = state.robotsPendingCreates ?? []
  const kept = stored.filter((entry) => !(isPendingCreate(entry) && predicate(entry)))
  return kept.length === stored.length ? state : {...state, robotsPendingCreates: kept}
}

/** A 202 named the job: its record replaces the placeholder, in one write. */
export function resolvePendingJobCreate(
  state: RobotsDocumentState,
  requestId: string,
  job: RobotsJob,
  assetId: string,
): RobotsDocumentState {
  if (state.assetId !== assetId) return state
  const withoutPlaceholder = removePendingCreates(state, (entry) => entry.requestId === requestId)
  return applyRobotsJobs(withoutPlaceholder, [job], assetId)
}

/** A 202 named the run: its record replaces the placeholder, in one write. */
export function resolvePendingDirectiveRunCreate(
  state: RobotsDocumentState,
  requestId: string,
  run: RobotsDirectiveRun,
  assetId: string,
): RobotsDocumentState {
  if (state.assetId !== assetId) return state
  const withoutPlaceholder = removePendingCreates(state, (entry) => entry.requestId === requestId)
  return applyDirectiveRuns(withoutPlaceholder, [run], assetId, {append: true})
}

interface MatchCandidate {
  id: string
  at: number
}

/** Closest to the request first; ties to the earlier time, then the smaller id. */
function closestTo(requestedAt: number, candidates: MatchCandidate[]): MatchCandidate | undefined {
  return candidates.toSorted(
    (a, b) =>
      Math.abs(a.at - requestedAt) - Math.abs(b.at - requestedAt) ||
      a.at - b.at ||
      a.id.localeCompare(b.id),
  )[0]
}

function inMatchWindow(at: number, requestedAt: number): boolean {
  return at >= requestedAt - CREATE_MATCH_BEFORE_S && at <= requestedAt + CREATE_MATCH_AFTER_S
}

/**
 * Which job or run resolves which placeholder, as `requestId` → id. A create this tab holds a
 * response for (`links`) resolves to it; the rest, oldest first, take the closest unused match
 * inside the window that the document hasn't already recorded. Pure, on reads already made.
 */
export function matchPendingCreates(
  pendings: RobotsPendingCreate[],
  jobs: RobotsJob[],
  runs: RobotsDirectiveRun[],
  state: RobotsDocumentState | undefined,
  links: ReadonlyMap<string, string> = new Map(),
): Map<string, string> {
  const matched = new Map<string, string>()
  const used = new Set<string>()
  for (const pending of pendings) {
    const linked = links.get(pending.requestId)
    if (!linked) continue
    matched.set(pending.requestId, linked)
    used.add(linked)
  }

  const recordedJobIds = new Set((state?.robotsJobs ?? []).map((record) => record.id))
  const recordedRunIds = new Set((state?.robotsDirectiveRuns ?? []).map((record) => record.runId))
  const unlinked = pendings
    .filter((pending) => !matched.has(pending.requestId))
    .toSorted((a, b) => a.requestedAt - b.requestedAt)

  for (const pending of unlinked) {
    const candidates: MatchCandidate[] =
      pending.kind === 'job'
        ? jobs.flatMap((job) =>
            job.workflow === pending.workflow &&
            !recordedJobIds.has(job.id) &&
            typeof job.created_at === 'number'
              ? [{id: job.id, at: job.created_at}]
              : [],
          )
        : runs.flatMap((run) =>
            run.run_id &&
            run.directive_id === pending.directiveId &&
            !!state?.assetId &&
            run.subject_id === state.assetId &&
            !recordedRunIds.has(run.run_id) &&
            typeof run.started_at === 'number'
              ? [{id: run.run_id, at: run.started_at}]
              : [],
          )

    const match = closestTo(
      pending.requestedAt,
      candidates.filter(
        (candidate) => !used.has(candidate.id) && inMatchWindow(candidate.at, pending.requestedAt),
      ),
    )
    if (!match) continue
    matched.set(pending.requestId, match.id)
    used.add(match.id)
  }

  return matched
}

/**
 * Removes every placeholder these reads resolve and records the runs that resolve one. The
 * jobs are recorded by `applyRobotsJobs`, applied after this in the same write.
 */
export function resolvePendingCreatesFromReads(
  state: RobotsDocumentState,
  jobs: RobotsJob[],
  runs: RobotsDirectiveRun[],
  assetId: string,
  links?: ReadonlyMap<string, string>,
): RobotsDocumentState {
  if (state.assetId !== assetId) return state
  const pendings = pendingCreatesOf(state)
  if (pendings.length === 0) return state

  const matched = matchPendingCreates(pendings, jobs, runs, state, links)
  if (matched.size === 0) return state

  const resolvedRunIds = new Set(
    pendings
      .filter((pending) => pending.kind === 'directive-run' && matched.has(pending.requestId))
      .map((pending) => matched.get(pending.requestId)),
  )
  const withoutResolved = removePendingCreates(state, (pending) => matched.has(pending.requestId))
  return applyDirectiveRuns(
    withoutResolved,
    runs.filter((run) => resolvedRunIds.has(run.run_id)),
    assetId,
    {append: true},
  )
}

// --- Pending creates on screen ---

/** Where this tab's own create is: saving its placeholder, sent, or of unknown outcome. */
export type PendingCreatePhase = 'saving' | 'sending' | 'unconfirmed'

export interface LocalPendingCreate {
  pending: RobotsPendingCreate
  phase: PendingCreatePhase
}

export type PendingCreateRowPhase = 'starting' | 'unconfirmed'

export interface PendingCreateRow {
  pending: RobotsPendingCreate
  phase: PendingCreateRowPhase
}

export interface PendingCreateRowsInput {
  /** The stored placeholders of one kind. */
  stored: RobotsPendingCreate[]
  local?: LocalPendingCreate | undefined
  /** Creates this tab settled (refused, cleared) whose removal may still be on its way. */
  settled: ReadonlySet<string>
  links: ReadonlyMap<string, string>
  jobs: RobotsJob[]
  runs: RobotsDirectiveRun[]
  state: RobotsDocumentState | undefined
  nowS: number
}

/**
 * One pending row per request, so a row and the job or run it becomes are never both on screen
 * and never both missing. The rows, the Run buttons and the note all read this.
 */
export function pendingCreateRows({
  stored,
  local,
  settled,
  links,
  jobs,
  runs,
  state,
  nowS,
}: PendingCreateRowsInput): PendingCreateRow[] {
  const localPhase = (requestId: string) =>
    local?.pending.requestId === requestId ? local.phase : undefined
  // Not saved yet, so a row of its own; nothing can be its result.
  const unsaved =
    local?.phase === 'saving' && !stored.some((p) => p.requestId === local.pending.requestId)
      ? [local.pending]
      : []
  const unsettled = [...stored, ...unsaved].filter((pending) => !settled.has(pending.requestId))
  const matched = matchPendingCreates(
    unsettled.filter((pending) => localPhase(pending.requestId) !== 'saving'),
    jobs,
    runs,
    state,
    links,
  )
  const shownIds = new Set([...jobs.map((job) => job.id), ...runs.map((run) => run.run_id)])

  return unsettled
    .filter((pending) => {
      const resolvedTo = matched.get(pending.requestId)
      return !resolvedTo || !shownIds.has(resolvedTo)
    })
    .map((pending) => {
      const phase = localPhase(pending.requestId)
      if (phase) return {pending, phase: phase === 'unconfirmed' ? 'unconfirmed' : 'starting'}
      return {
        pending,
        phase: nowS - pending.requestedAt < CREATE_CONFIRM_GRACE_S ? 'starting' : 'unconfirmed',
      }
    })
}

/** When another tab's placeholder crosses the grace period, so its row can be relabelled. */
export function nextPendingRelabelAt(pendings: RobotsPendingCreate[], nowS: number) {
  const crossings = pendings
    .map((pending) => pending.requestedAt + CREATE_CONFIRM_GRACE_S)
    .filter((at) => at > nowS)
  return crossings.length > 0 ? Math.min(...crossings) : undefined
}

export type RobotsTableRow<T> =
  | {key: string; pending: PendingCreateRow; item?: undefined}
  | {key: string; pending?: undefined; item: T}

/** Newest first. A missing time sorts last; on a tie a pending row comes first. */
function tableRows<T>(
  pendingRows: PendingCreateRow[],
  items: T[],
  idOf: (item: T) => string,
  timeOf: (item: T) => number | undefined,
): RobotsTableRow<T>[] {
  const rows: RobotsTableRow<T>[] = [
    ...pendingRows.map((pending) => ({key: `create:${pending.pending.requestId}`, pending})),
    ...items.map((item) => ({key: idOf(item), item})),
  ]
  const at = (row: RobotsTableRow<T>) =>
    row.pending ? row.pending.pending.requestedAt : timeOf(row.item)
  return rows.toSorted((a, b) => {
    const atA = at(a)
    const atB = at(b)
    if ((atA === undefined) !== (atB === undefined)) return atA === undefined ? 1 : -1
    if (atA !== undefined && atB !== undefined && atA !== atB) return atB - atA
    if (!!a.pending !== !!b.pending) return a.pending ? -1 : 1
    return a.key.localeCompare(b.key)
  })
}

export function jobTableRows(pendingRows: PendingCreateRow[], jobs: RobotsJob[]) {
  return tableRows(
    pendingRows,
    jobs,
    (job) => job.id,
    (job) => job.created_at,
  )
}

export function runTableRows(pendingRows: PendingCreateRow[], runs: RobotsDirectiveRun[]) {
  return tableRows(
    pendingRows,
    runs,
    (run) => run.run_id,
    (run) => run.started_at,
  )
}

/** The live list, plus jobs the document recorded that Mux no longer lists (deleted after 30 days). */
export function jobsWithHistory(
  jobs: RobotsJob[],
  records: RobotsJobRecord[] | undefined,
): RobotsJob[] {
  const listed = new Set(jobs.map((job) => job.id))
  const history = (records ?? [])
    .filter((record) => !listed.has(record.id))
    .map((record): RobotsJob =>
      compact({
        id: record.id,
        workflow: record.workflow,
        status: record.status,
        created_at: record.created_at,
        updated_at: record.updated_at,
        units_consumed: record.units_consumed,
        errors: record.error ? [{message: record.error}] : undefined,
      }),
    )
  return [...jobs, ...history]
}

// --- The Units cell ---

/** Whether a job's full record is in hand, failed to load, or was never read. */
export type RobotsJobDetailState = 'loaded' | 'unreadable' | 'unread'

/** Every state names itself, so "unknown" never looks like "empty". */
export function unitsCell(
  job: RobotsJob,
  detail: RobotsJobDetailState,
): {label: string; isLoadable: boolean} {
  if (job.status === 'errored' || job.status === 'cancelled') {
    return {label: 'Not charged', isLoadable: false}
  }
  if (typeof job.units_consumed === 'number') {
    return {label: String(job.units_consumed), isLoadable: false}
  }
  if (!isTerminalStatus(job.status)) return {label: 'Not counted yet', isLoadable: false}
  if (detail === 'unreadable') return {label: 'Unavailable', isLoadable: false}
  if (detail === 'loaded') return {label: 'Not reported', isLoadable: false}
  return {label: 'Not loaded', isLoadable: true}
}

// --- Thumbnails ---

/**
 * Completed find-best-thumbnails jobs that asked to set the asset's thumbnail and whose winner
 * isn't in `thumbTime` yet. Recent ones only: an old job must not overwrite a thumbnail someone
 * picked since.
 */
export function thumbnailJobsToApply(
  state: RobotsDocumentState,
  jobs: RobotsJob[],
  now = Date.now(),
): RobotsJob[] {
  const unapplied = new Set(
    (state.robotsJobs ?? [])
      .filter((record) => !record.thumbnailApplied)
      .map((record) => record.id),
  )
  return jobs.filter(
    (job) =>
      job.workflow === 'find-best-thumbnails' &&
      job.status === 'completed' &&
      job.parameters?.['update_asset_thumbnail'] === true &&
      unapplied.has(job.id) &&
      isRecent(job.updated_at ?? job.created_at, now),
  )
}

/** Copies the asset's `thumbnail_time` into `thumbTime` and marks the jobs, in one write. */
export function applyThumbnail(
  state: RobotsDocumentState,
  jobIds: string[],
  assetId: string,
): RobotsDocumentState {
  const thumbnailTime = state.data?.thumbnail_time
  if (state.assetId !== assetId || typeof thumbnailTime !== 'number' || jobIds.length === 0) {
    return state
  }
  return {
    ...state,
    thumbTime: thumbnailTime,
    robotsJobs: (state.robotsJobs ?? []).map((record) =>
      jobIds.includes(record.id) ? {...record, thumbnailApplied: true} : record,
    ),
  }
}
