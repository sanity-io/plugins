import {AGENT_API_VERSION} from './generateTheme'

/** What reading the AI credits needs of a client; a `SanityClient` has it @internal */
export interface AiCreditsClient {
  config: () => {projectId?: string; apiHost?: string}
  withConfig: (config: {apiVersion: string}) => {
    request: (options: {url: string; tag: string; signal?: AbortSignal}) => Promise<unknown>
  }
}

/**
 * The AI credits of the organization that owns the project, for the current
 * month. Every Agent Actions request is one credit, so these are what
 * generating a theme spends.
 *
 * @internal
 */
export interface AiCredits {
  /** Whether Agent Actions requests go through; false once the spending limit is reached */
  granted: boolean
  /** Credits used this month, as far as the API has metered them (it lags behind by hours) */
  used: number | undefined
  /** Credits the plan includes per month */
  quota: number | undefined
}

/** @internal */
export const AI_CREDITS_DOCS_URL =
  'https://www.sanity.io/docs/platform-management/how-ai-credits-work'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/**
 * The credits as the `ai-usage` resource of the project's subscription
 * reports them; `undefined` for a response of another shape
 *
 * @internal
 */
export function readAiCredits(response: unknown): AiCredits | undefined {
  if (!isRecord(response) || typeof response['granted'] !== 'boolean') return undefined

  const subscription = isRecord(response['subscription']) ? response['subscription'] : {}
  const usage = isRecord(response['usage']) ? response['usage'] : {}

  return {
    granted: response['granted'],
    used: optionalNumber(usage['value']),
    quota: optionalNumber(subscription['quota']),
  }
}

/**
 * Reads the organization's AI credits through the project. The resource only
 * exists on the experimental API; nothing depends on the answer, so a Studio
 * talking to an API without it resolves with `undefined`.
 *
 * @internal
 */
export async function fetchAiCredits(
  client: AiCreditsClient,
  signal?: AbortSignal,
): Promise<AiCredits | undefined> {
  const {projectId} = client.config()

  if (!projectId) return undefined

  const response = await client.withConfig({apiVersion: AGENT_API_VERSION}).request({
    url: `/subscriptions/project/${projectId}/resources/ai-usage`,
    tag: 'themer.ai-credits',
    signal,
  })

  return readAiCredits(response)
}

/**
 * The credits a request was turned down for, from the 429 response Agent
 * Actions give once the organization's spending limit is reached: its body
 * names the limit and carries the usage and the quota, which a plain rate
 * limit response does not. `undefined` for any other error.
 *
 * @internal
 */
export function readAiCreditsLimit(error: unknown): AiCredits | undefined {
  if (!isRecord(error) || error['statusCode'] !== 429) return undefined

  const response = error['response']
  const body = isRecord(response) ? response['body'] : undefined

  if (!isRecord(body)) return undefined

  const quota = optionalNumber(body['quota'])

  if (typeof body['reasonCode'] !== 'string' && quota === undefined) return undefined

  return {granted: false, used: optionalNumber(body['usageValue']), quota}
}

/** The Sanity website the project's API host belongs to, for links into Manage */
function websiteUrl(apiHost: string | undefined): string {
  return apiHost?.endsWith('.work') ? 'https://www.sanity.work' : 'https://www.sanity.io'
}

/** The AI usage of the signed-in user's organization in Manage @internal */
export function aiUsageUrl(apiHost: string | undefined): string {
  return `${websiteUrl(apiHost)}/manage/org/usage/ai`
}

/** The spending limits of the signed-in user's organization in Manage @internal */
export function aiSpendingLimitUrl(apiHost: string | undefined): string {
  return `${websiteUrl(apiHost)}/manage/org/settings`
}
