import type {Secrets} from 'sanity-translations-tab'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {getTranslation} from './getTranslation'
import {getTranslationTask} from './getTranslationTask'
import {authenticate, findExistingJob} from './helpers'

const secrets: Secrets = {
  organization: 'org',
  project: 'project-1',
  secret: '{"userIdentifier":"abc","userSecret":"def"}',
  proxy: 'https://proxy.example.com/api/proxy',
}

const createMockResponse = ({
  status = 200,
  json = {},
}: {
  status?: number
  json?: Record<string, any>
} = {}) => new Response(JSON.stringify(json), {status})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('smartling adapter', () => {
  it('forwards the secret JSON verbatim when authenticating', async () => {
    let capturedBody: BodyInit | null | undefined
    const fetchMock = vi.fn(
      (_input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
        capturedBody = init?.body
        return Promise.resolve(
          createMockResponse({json: {response: {data: {accessToken: 'token-123'}}}}),
        )
      },
    )
    vi.stubGlobal('fetch', fetchMock)

    const token = await authenticate(secrets)

    expect(token).toBe('token-123')
    // The secret is already a JSON string, so it must be sent as-is. Double-encoding it
    // with JSON.stringify would produce a quoted string and break authentication.
    expect(capturedBody).toBe(secrets.secret)
    expect(capturedBody).not.toBe(JSON.stringify(secrets.secret))
  })

  it('throws a clear error when authentication returns no access token', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          createMockResponse({json: {response: {errors: [{message: 'Invalid credentials'}]}}}),
        ),
    )

    await expect(authenticate(secrets)).rejects.toThrow('Invalid credentials')
  })

  it('returns an empty job id instead of throwing when no jobs are found', async () => {
    // Both the name-resolution lookup and the fileUri fallback return no items.
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(createMockResponse({json: {response: {data: {}}}}))
        .mockResolvedValueOnce(createMockResponse({json: {response: {data: {}}}})),
    )

    await expect(findExistingJob('doc-1', secrets, 'token')).resolves.toBe('')
  })

  it('does not throw when a translation response is missing the response payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        // authenticate()
        .mockResolvedValueOnce(createMockResponse({json: {response: {data: {accessToken: 'tok'}}}}))
        // getTranslation() download request returns an unexpected payload
        .mockResolvedValueOnce(createMockResponse({json: {}})),
    )

    await expect(getTranslation('doc-1', 'es', secrets)).resolves.toBe('')
  })

  it('reports finite progress when a job has zero total words', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        // authenticate()
        .mockResolvedValueOnce(createMockResponse({json: {response: {data: {accessToken: 'tok'}}}}))
        // findExistingJob() name lookup -> matching job
        .mockResolvedValueOnce(
          createMockResponse({
            json: {
              response: {
                data: {
                  items: [{jobStatus: 'IN_PROGRESS', jobName: 'doc-1', translationJobUid: 'job-1'}],
                },
              },
            },
          }),
        )
        // job progress -> empty document (totalWordCount === 0)
        .mockResolvedValueOnce(
          createMockResponse({
            json: {
              response: {
                data: {
                  contentProgressReport: [
                    {
                      targetLocaleId: 'es',
                      progress: {percentComplete: 0, totalWordCount: 0},
                      workflowProgressReportList: [
                        {workflowStepSummaryReportItemList: [{wordCount: 0}, {wordCount: 0}]},
                      ],
                    },
                  ],
                },
              },
            },
          }),
        ),
    )

    const task = await getTranslationTask('doc-1', secrets)

    expect(task.locales).toHaveLength(1)
    const [locale] = task.locales
    expect(Number.isFinite(locale?.progress)).toBe(true)
    expect(locale?.progress).toBe(0)
  })
})
