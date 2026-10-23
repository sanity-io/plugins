/**
 * API shapes keep Mux's snake_case. The records stored on `mux.videoAsset` are camelCase, except
 * the fields a job record copies straight from Mux.
 */

/** The twelve workflows, as they appear in `POST /robots/v0/jobs/{workflow}`. */
export const ROBOTS_WORKFLOWS = [
  'generate-premium-captions',
  'edit-captions',
  'translate-captions',
  'translate-audio',
  'summarize',
  'ask-questions',
  'find-key-moments',
  'find-best-thumbnails',
  'generate-engagement-insights',
  'generate-chapters',
  'find-scenes',
  'moderate',
] as const

export type RobotsWorkflow = (typeof ROBOTS_WORKFLOWS)[number]

export type RobotsJobStatus = 'pending' | 'processing' | 'completed' | 'errored' | 'cancelled'

const TERMINAL_JOB_STATUSES: ReadonlySet<string> = new Set(['completed', 'errored', 'cancelled'])

export function isTerminalStatus(status?: string): boolean {
  return !!status && TERMINAL_JOB_STATUSES.has(status)
}

export interface RobotsJobDirective {
  id: string
  run_id: string
}

/** A job as the Robots API returns it. `parameters`, `outputs` and `directive` are detail only. */
export interface RobotsJob {
  id: string
  workflow: RobotsWorkflow
  status: RobotsJobStatus
  created_at?: number
  updated_at?: number
  units_consumed?: number
  parameters?: Record<string, unknown>
  outputs?: Record<string, unknown>
  /** Only documented as "present when errored"; read through `robotsJobErrorMessage`. */
  errors?: unknown
  directive?: RobotsJobDirective
}

export interface RobotsDirectiveWorkflowBinding {
  reference_id?: string
  workflow?: RobotsWorkflow
}

export interface RobotsDirective {
  id: string
  name?: string
  workflows?: RobotsDirectiveWorkflowBinding[]
}

export type RobotsDirectiveRunStatus =
  | 'pending'
  | 'dispatching'
  | 'running'
  | 'waiting'
  | 'completed'
  | 'partial'
  | 'errored'

const TERMINAL_RUN_STATUSES: ReadonlySet<string> = new Set(['completed', 'partial', 'errored'])

export function isTerminalRunStatus(status?: string): boolean {
  return !!status && TERMINAL_RUN_STATUSES.has(status)
}

export type RobotsNodeStatus =
  | 'dispatched'
  | 'failed'
  | 'waiting_for_resources'
  | 'waiting_for_source_workflow'

export interface RobotsNodeState {
  reference_id?: string
  status?: RobotsNodeStatus
  workflow_name?: string
  job_id?: string
  /** Present when `status` is `failed`. */
  reason?: string
  /** Present when `status` is `waiting_for_source_workflow`. */
  source_workflows?: string[]
}

/**
 * A directive run from the REST API. It uses `run_id` and `subject_id` (the asset) and doesn't
 * name its directive, so the caller tags `directive_id` from the directive it asked about.
 */
export interface RobotsDirectiveRun {
  run_id: string
  subject_id?: string
  status?: RobotsDirectiveRunStatus
  node_states?: RobotsNodeState[]
  started_at?: number
  completed_at?: number | null
  directive_id?: string
}

/** Whether this Studio can use Robots. Only the job-list read decides it. */
export type RobotsCapabilityState =
  | 'enabled'
  /** 401 from Mux: the token lacks the `robots:*` scope. */
  | 'scope-missing'
  /** 403 `forbidden` from Mux: the Robots terms aren't accepted. */
  | 'not-enabled'
  /** 404 from the proxy itself: it doesn't have the Robots routes yet. */
  | 'unavailable'

export interface RobotsCapability {
  state: RobotsCapabilityState
  /** The dashboard page Mux named for accepting the terms. */
  termsUrl?: string
}

/** A warning over a working panel, never cached: Mux refused one run, not the account. */
export type RobotsAdvisory = 'units-exhausted'

// --- Stored on the `mux.videoAsset` document ---

export interface RobotsJobRecord {
  _key: string
  _type: 'mux.robotsJob'
  id: string
  workflow: RobotsWorkflow
  status: RobotsJobStatus
  created_at?: number
  updated_at?: number
  units_consumed?: number
  /** First error message, when the job errored. */
  error?: string
  /** find-best-thumbnails only: its `thumbnail_time` was copied into `thumbTime`. */
  thumbnailApplied?: boolean
}

export interface RobotsSummarizeOutput {
  jobId: string
  completedAt?: number
  title?: string
  description?: string
  tags?: string[]
}

export interface RobotsModerateOutput {
  jobId: string
  completedAt?: number
  exceedsThreshold?: boolean
  maxScores?: {sexual?: number; violence?: number}
}

/** The newest completed summarize and moderate outputs on this asset, whoever ran them. */
export interface RobotsOutputs {
  _type: 'mux.robotsOutputs'
  summarize?: RobotsSummarizeOutput
  moderate?: RobotsModerateOutput
}

export interface RobotsDirectiveRunRecord {
  _key: string
  _type: 'mux.robotsDirectiveRun'
  runId: string
  directiveId: string
  status?: RobotsDirectiveRunStatus
  startedAt?: number
  completedAt?: number
  /** Jobs the run dispatched. Unioned, never replaced. */
  jobIds?: string[]
}

/** A create whose outcome isn't known yet: saved before it's sent, removed once resolved. */
export interface RobotsPendingCreate {
  _key: string
  _type: 'mux.robotsPendingCreate'
  requestId: string
  kind: 'job' | 'directive-run'
  workflow?: RobotsWorkflow
  directiveId?: string
  /** Unix seconds, browser clock: the unit of Mux's `created_at`. */
  requestedAt: number
}

export interface RobotsFields {
  robotsJobs?: RobotsJobRecord[]
  robotsOutputs?: RobotsOutputs
  robotsDirectiveRuns?: RobotsDirectiveRunRecord[]
  robotsPendingCreates?: RobotsPendingCreate[]
}

/** Pulls a readable message out of the loosely documented `errors`. */
export function robotsJobErrorMessage(job: Pick<RobotsJob, 'errors'>): string | undefined {
  const {errors} = job
  if (!errors) return undefined
  if (typeof errors === 'string') return errors
  const first = Array.isArray(errors) ? (errors[0] as unknown) : errors
  if (typeof first === 'string') return first
  if (!first || typeof first !== 'object') return undefined
  const {messages, message} = first as {messages?: unknown; message?: unknown}
  if (Array.isArray(messages) && typeof messages[0] === 'string') return messages[0]
  return typeof message === 'string' ? message : undefined
}
