import {describe, expect, it, vi} from 'vitest'

import {
  type AiCreditsClient,
  aiSpendingLimitUrl,
  aiUsageUrl,
  fetchAiCredits,
  readAiCredits,
  readAiCreditsLimit,
} from './aiCredits'

describe('readAiCredits', () => {
  it('reads the usage and quota of the ai-usage resource', () => {
    expect(
      readAiCredits({
        granted: true,
        reasonCode: null,
        subscription: {resourceId: 'ai-usage', quota: 5000},
        usage: {metric: 'ai-usage', value: 126},
      }),
    ).toEqual({granted: true, used: 126, quota: 5000})
  })

  it('leaves out what the response does not have', () => {
    expect(readAiCredits({granted: false})).toEqual({
      granted: false,
      used: undefined,
      quota: undefined,
    })
  })

  it('reads nothing from a response of another shape', () => {
    expect(readAiCredits(undefined)).toBeUndefined()
    expect(readAiCredits({message: 'Not found'})).toBeUndefined()
  })
})

describe('fetchAiCredits', () => {
  it('reads the credits through the project on the experimental API', async () => {
    const request = vi.fn(() => Promise.resolve({granted: true, usage: {value: 3}}))
    const withConfig = vi.fn(() => ({request}))
    const client: AiCreditsClient = {config: () => ({projectId: 'abc123'}), withConfig}

    await expect(fetchAiCredits(client)).resolves.toEqual({
      granted: true,
      used: 3,
      quota: undefined,
    })
    expect(withConfig).toHaveBeenCalledWith({apiVersion: 'vX'})
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({url: '/subscriptions/project/abc123/resources/ai-usage'}),
    )
  })

  it('reads nothing without a project', async () => {
    const withConfig = vi.fn()

    await expect(fetchAiCredits({config: () => ({}), withConfig})).resolves.toBeUndefined()
    expect(withConfig).not.toHaveBeenCalled()
  })
})

describe('readAiCreditsLimit', () => {
  it('reads the limit from the response that turned a request down', () => {
    const error = Object.assign(new Error('Too many requests'), {
      statusCode: 429,
      response: {body: {reasonCode: 'plan_limit_reached', usageValue: 5012, quota: 5000}},
    })

    expect(readAiCreditsLimit(error)).toEqual({granted: false, used: 5012, quota: 5000})
  })

  it('tells a plain rate limit and other errors from a spent limit', () => {
    expect(
      readAiCreditsLimit(
        Object.assign(new Error('Too many requests'), {statusCode: 429, response: {body: {}}}),
      ),
    ).toBeUndefined()
    expect(
      readAiCreditsLimit(
        Object.assign(new Error('Forbidden'), {
          statusCode: 403,
          response: {body: {reasonCode: 'plan_limit_reached'}},
        }),
      ),
    ).toBeUndefined()
    expect(readAiCreditsLimit(new Error('Network error'))).toBeUndefined()
  })
})

describe('Manage links', () => {
  it('follow the website of the API host', () => {
    expect(aiUsageUrl('https://api.sanity.io')).toBe('https://www.sanity.io/manage/org/usage/ai')
    expect(aiSpendingLimitUrl('https://api.sanity.work')).toBe(
      'https://www.sanity.work/manage/org/settings',
    )
  })
})
