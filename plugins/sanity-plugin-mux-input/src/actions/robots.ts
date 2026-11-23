import type {SanityClient} from 'sanity'

import type {
  RobotsApiVersion,
  RobotsDirective,
  RobotsDirectiveRun,
  RobotsJob,
  RobotsJobStatus,
  RobotsJobWorkflow,
  RobotsWorkflow,
} from '../robots/types'
import {jobVersions, linkedVersion, ROBOTS_API_VERSION} from '../robots/versions'
import {getMuxAddonClient} from '../util/muxAddonClient'
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

export function toRobotsRequestError(error: unknown): RobotsRequestError {
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
  version: RobotsApiVersion,
  method: 'GET' | 'POST',
  segments: string[],
  {query = {}, body}: {query?: Record<string, string>; body?: Record<string, unknown>} = {},
): Promise<MuxData<T>> {
  const {dataset} = client.config()
  // v0 keeps the proxy's unversioned routes, which Studios on older plugin versions still call.
  const prefix = version === 'v0' ? dataset : `${dataset}/${version}`
  try {
    return await getMuxAddonClient(client).request<MuxData<T>>({
      url: `/addons/mux/robots/${prefix}/${segments.map(encodeURIComponent).join('/')}`,
      withCredentials: true,
      method,
      query: {...query, ...PLUGIN_VERSION_QUERY},
      ...(body && {body, headers: {'Content-Type': 'application/json'}}),
    })
  } catch (error) {
    throw toRobotsRequestError(error)
  }
}

/** Mux's own 404: nothing by that id on the version asked, which may be the other version. */
function isNotFoundOnVersion(error: unknown): boolean {
  return error instanceof RobotsRequestError && error.status === 404 && error.muxAnswered
}

/** Sends `request` on each version in turn, moving on only after Mux's 404. */
async function onVersions<T>(
  versions: RobotsApiVersion[],
  request: (version: RobotsApiVersion) => Promise<T>,
): Promise<T> {
  const [version, ...rest] = versions
  if (!version) throw new Error('No Robots API version to ask.')
  try {
    return await request(version)
  } catch (error) {
    if (rest.length === 0 || !isNotFoundOnVersion(error)) throw error
    return onVersions(rest, request)
  }
}

/** Directive versions learnt this session, from listings and from where runs answered. */
const directiveVersions = new Map<string, RobotsApiVersion>()

function directiveKey(client: SanityClient, directiveId: string): string {
  const {projectId, dataset} = client.config()
  return `${projectId}:${dataset}:${directiveId}`
}

function rememberDirectiveVersion(
  client: SanityClient,
  directiveId: string,
  version: RobotsApiVersion,
): void {
  directiveVersions.set(directiveKey(client, directiveId), version)
}

export function resetRobotsDirectiveVersions(): void {
  directiveVersions.clear()
}

/**
 * Sends a directive request on the directive's version. An id no listing has named yet, like a
 * configured one, is tried on v1 and then v0. Only a version that answered is remembered: a 404
 * can also mean a run Mux no longer has, which says nothing about the directive's version.
 */
async function onDirectiveVersion<T>(
  client: SanityClient,
  directiveId: string,
  request: (version: RobotsApiVersion) => Promise<T>,
): Promise<T> {
  const known = directiveVersions.get(directiveKey(client, directiveId))
  return onVersions(known ? [known] : ['v1', 'v0'], async (version) => {
    const response = await request(version)
    rememberDirectiveVersion(client, directiveId, version)
    return response
  })
}

function pageQuery({limit, page}: {limit?: number; page?: number}): Record<string, string> {
  return {
    ...(limit !== undefined && {limit: String(limit)}),
    ...(page !== undefined && {page: String(page)}),
  }
}

/** v1 lists the jobs of both versions, each with `_links` naming the version that created it. */
export function listRobotsJobs(
  client: SanityClient,
  query: {
    assetId: string
    workflow?: RobotsJobWorkflow
    status?: RobotsJobStatus
    limit?: number
    page?: number
  },
) {
  return robotsRequest<RobotsJob[]>(client, ROBOTS_API_VERSION, 'GET', ['jobs'], {
    query: {
      asset_id: query.assetId,
      ...(query.workflow && {workflow: query.workflow}),
      ...(query.status && {status: query.status}),
      ...pageQuery(query),
    },
  })
}

type RobotsJobRef = Pick<RobotsJob, 'id' | 'workflow' | '_links'>

export function getRobotsJob(client: SanityClient, job: RobotsJobRef) {
  return onVersions(jobVersions(job), (version) =>
    robotsRequest<RobotsJob>(client, version, 'GET', ['jobs', job.workflow, job.id]),
  )
}

/** Cancel takes no workflow segment, as in Mux. */
export function cancelRobotsJob(client: SanityClient, job: RobotsJobRef) {
  return onVersions(jobVersions(job), (version) =>
    robotsRequest<RobotsJob>(client, version, 'POST', ['jobs', job.id, 'cancel']),
  )
}

/** v1 lists the directives of both versions, each with `_links` naming its own. */
export async function listRobotsDirectives(
  client: SanityClient,
  query: {limit?: number; page?: number},
) {
  const response = await robotsRequest<RobotsDirective[]>(
    client,
    ROBOTS_API_VERSION,
    'GET',
    ['directives'],
    {query: pageQuery(query)},
  )
  for (const directive of response.data ?? []) {
    const version = linkedVersion(directive)
    if (version) rememberDirectiveVersion(client, directive.id, version)
  }
  return response
}

type RobotsDirectiveRunResponse = Omit<RobotsDirectiveRun, 'run_id'> & {
  run_id?: string
  id?: string
}

/** v1 calls the run's id `id`, v0 `run_id`. */
function toDirectiveRun({id, ...run}: RobotsDirectiveRunResponse): RobotsDirectiveRun {
  return {...run, run_id: run.run_id ?? id ?? ''}
}

export async function listRobotsDirectiveRuns(
  client: SanityClient,
  directiveId: string,
  query: {limit?: number; page?: number},
): Promise<MuxData<RobotsDirectiveRun[]>> {
  const response = await onDirectiveVersion(client, directiveId, (version) =>
    robotsRequest<RobotsDirectiveRunResponse[]>(
      client,
      version,
      'GET',
      ['directives', directiveId, 'runs'],
      {query: pageQuery(query)},
    ),
  )
  return response.data ? {data: response.data.map(toDirectiveRun)} : {}
}

export async function getRobotsDirectiveRun(
  client: SanityClient,
  directiveId: string,
  runId: string,
): Promise<MuxData<RobotsDirectiveRun>> {
  const response = await onDirectiveVersion(client, directiveId, (version) =>
    robotsRequest<RobotsDirectiveRunResponse>(client, version, 'GET', [
      'directives',
      directiveId,
      'runs',
      runId,
    ]),
  )
  return response.data ? {data: toDirectiveRun(response.data)} : {}
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
  const response = await robotsRequest<RobotsJob>(
    client,
    ROBOTS_API_VERSION,
    'POST',
    ['jobs', workflow],
    {body: {parameters}},
  )
  if (!response?.data?.id) throw new Error('Mux answered without naming the job it started.')
  return response.data
}

/**
 * Starts a directive run, on the same terms as `startRobotsJob`. Only on v1: the Studio doesn't
 * run v0 directives, and Mux answers 404 for one.
 */
export async function startRobotsDirectiveRun(
  client: SanityClient,
  directiveId: string,
  assetId: string,
): Promise<RobotsDirectiveRun> {
  const response = await robotsRequest<RobotsDirectiveRunResponse>(
    client,
    ROBOTS_API_VERSION,
    'POST',
    ['directives', directiveId, 'runs'],
    {body: {asset_id: assetId}},
  )
  const run = response?.data && toDirectiveRun(response.data)
  if (!run?.run_id) throw new Error('Mux answered without naming the run it started.')
  rememberDirectiveVersion(client, directiveId, ROBOTS_API_VERSION)
  return {...run, directive_id: directiveId}
}
