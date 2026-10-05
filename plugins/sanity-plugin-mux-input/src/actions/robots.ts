import type {SanityClient} from 'sanity'

import type {
  RobotsDirective,
  RobotsDirectiveRun,
  RobotsJob,
  RobotsJobStatus,
  RobotsWorkflow,
} from '../robots/types'
import {PLUGIN_VERSION_QUERY} from '../util/pluginVersion'

/**
 * A Robots request that didn't succeed. `muxAnswered` means the proxy forwarded Mux's own
 * answer (its body has a `mux` key); the proxy's own errors never do. `status` is absent for
 * network errors, where a create's outcome is unknown.
 */
export class RobotsRequestError extends Error {
  readonly status: number | undefined
  readonly type: string | undefined
  readonly muxAnswered: boolean

  constructor(
    message: string,
    {status, type, muxAnswered = false}: {status?: number; type?: string; muxAnswered?: boolean},
  ) {
    super(message)
    this.name = 'RobotsRequestError'
    this.status = status
    this.type = type
    this.muxAnswered = muxAnswered
  }
}

interface ProxyErrorBody {
  message?: unknown
  mux?: {type?: unknown; message?: unknown}
}

function toRobotsRequestError(error: unknown): RobotsRequestError {
  const {statusCode, response} = (error ?? {}) as {
    statusCode?: unknown
    response?: {body?: unknown}
  }
  const body = (
    response?.body && typeof response.body === 'object' ? response.body : {}
  ) as ProxyErrorBody
  const mux = body.mux && typeof body.mux === 'object' ? body.mux : undefined
  const message =
    (typeof mux?.message === 'string' && mux.message) ||
    (typeof body.message === 'string' && body.message) ||
    (error instanceof Error ? error.message : 'The Robots request failed.')
  return new RobotsRequestError(message, {
    ...(typeof statusCode === 'number' && {status: statusCode}),
    ...(typeof mux?.type === 'string' && {type: mux.type}),
    muxAnswered: !!mux,
  })
}

interface MuxData<T> {
  data?: T
}

async function robotsRequest<T>(
  client: SanityClient,
  method: 'GET' | 'POST',
  segments: string[],
  {query = {}, body}: {query?: Record<string, string>; body?: Record<string, unknown>} = {},
): Promise<MuxData<T>> {
  const {dataset} = client.config()
  try {
    return await client.request<MuxData<T>>({
      url: `/addons/mux/robots/${dataset}/${segments.map(encodeURIComponent).join('/')}`,
      withCredentials: true,
      method,
      query: {...query, ...PLUGIN_VERSION_QUERY},
      ...(body && {body, headers: {'Content-Type': 'application/json'}}),
    })
  } catch (error) {
    throw toRobotsRequestError(error)
  }
}

function pageQuery({limit, page}: {limit?: number; page?: number}): Record<string, string> {
  return {
    ...(limit !== undefined && {limit: String(limit)}),
    ...(page !== undefined && {page: String(page)}),
  }
}

export function listRobotsJobs(
  client: SanityClient,
  query: {
    assetId: string
    workflow?: RobotsWorkflow
    status?: RobotsJobStatus
    limit?: number
    page?: number
  },
) {
  return robotsRequest<RobotsJob[]>(client, 'GET', ['jobs'], {
    query: {
      asset_id: query.assetId,
      ...(query.workflow && {workflow: query.workflow}),
      ...(query.status && {status: query.status}),
      ...pageQuery(query),
    },
  })
}

export function getRobotsJob(client: SanityClient, workflow: RobotsWorkflow, jobId: string) {
  return robotsRequest<RobotsJob>(client, 'GET', ['jobs', workflow, jobId])
}

/** Cancel takes no workflow segment, as in Mux. */
export function cancelRobotsJob(client: SanityClient, jobId: string) {
  return robotsRequest<RobotsJob>(client, 'POST', ['jobs', jobId, 'cancel'])
}

export function listRobotsDirectives(client: SanityClient, query: {limit?: number; page?: number}) {
  return robotsRequest<RobotsDirective[]>(client, 'GET', ['directives'], {query: pageQuery(query)})
}

export function listRobotsDirectiveRuns(
  client: SanityClient,
  directiveId: string,
  query: {limit?: number; page?: number},
) {
  return robotsRequest<RobotsDirectiveRun[]>(client, 'GET', ['directives', directiveId, 'runs'], {
    query: pageQuery(query),
  })
}

export function getRobotsDirectiveRun(client: SanityClient, directiveId: string, runId: string) {
  return robotsRequest<RobotsDirectiveRun>(client, 'GET', [
    'directives',
    directiveId,
    'runs',
    runId,
  ])
}

/**
 * Starts a job, once: a create is billable and has no idempotency key, so it's never retried.
 * A 2xx that names no job throws a plain `Error`, since the outcome is then unknown.
 */
export async function startRobotsJob(
  client: SanityClient,
  workflow: RobotsWorkflow,
  parameters: Record<string, unknown>,
): Promise<RobotsJob> {
  const response = await robotsRequest<RobotsJob>(client, 'POST', ['jobs', workflow], {
    body: {parameters},
  })
  if (!response?.data?.id) throw new Error('Mux answered without naming the job it started.')
  return response.data
}

/** Starts a directive run, on the same terms as `startRobotsJob`. */
export async function startRobotsDirectiveRun(
  client: SanityClient,
  directiveId: string,
  assetId: string,
): Promise<RobotsDirectiveRun> {
  const response = await robotsRequest<RobotsDirectiveRun>(
    client,
    'POST',
    ['directives', directiveId, 'runs'],
    {body: {asset_id: assetId}},
  )
  if (!response?.data?.run_id) throw new Error('Mux answered without naming the run it started.')
  // The response doesn't name its directive.
  return {...response.data, directive_id: directiveId}
}
